var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var toMarkdown = require('to-markdown');
var url = require('url');
var HttpsProxyAgent = require('https-proxy-agent');
var HttpProxyAgent = require('http-proxy-agent');

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function doConversion(str) {
    return toMarkdown(str);
}

function postToServer(postContent, hookid, teamsUrl) {
    console.log("Informing teams channel: " + hookid);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    var agent, httpsagent, httpagent = null;
    var https_proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
    var http_proxy = process.env.HTTP_PROXY || process.env.http_proxy;
    if (https_proxy) {
        httpsagent = new HttpsProxyAgent(https_proxy);
        console.log("Using HTTPS proxy - " + https_proxy);
    }
    if (http_proxy) {
        httpagent = new HttpProxyAgent(http_proxy);
        console.log("Using HTTP proxy - " + http_proxy);
    }

    var teamsServer = process.env.TEAMS_SERVER || 'localhost';
    var teamsServerPort = process.env.TEAMS_SERVER_PORT;
    var teamsProto = process.env.TEAMS_SERVER_PROTO || 'http';
    var teamsPath = process.env.TEAMS_SERVER_PATH || '/hooks/' + hookid;
    var teamsUsername = process.env.TEAMS_USERNAME || 'JIRA';
    var teamsIconUrl = process.env.TEAMS_ICON_URL || 'https://design.atlassian.com/images/logo/favicon.png';

    if (teamsUrl) {
        try {
            var murl = url.parse(teamsUrl);
            teamsServer = murl.hostname || teamsServer;
            teamsServerPort = murl.port || teamsServerPort;
            teamsProto = murl.protocol.replace(":", "") || teamsProto;
            teamsPath = murl.pathname || teamsPath;
        }
        catch (err) { console.log(err) }
    }
    //If the port is not initialized yet (neither from env, nor from query param)
    // use the defaults ports
    if (!teamsServerPort) {
        if (teamsProto == 'https') {
            teamsServerPort = '443';
        }
        else {
            teamsServerPort = '80';
        }
    }
    console.log(teamsServer + "-" + teamsServerPort + "-" + teamsProto);
    var proto;
    if (teamsProto == 'https') {
        console.log("Using https protocol");
        proto = https;
        agent = httpsagent;
    }
    else {
        console.log("Using http protocol");
        proto = http;
        agent = httpagent;
    }

    var postData = '{"text": ' + JSON.stringify(postContent) + ', "username": "' + teamsUsername + '", "icon_url": "' + teamsIconUrl + '"}';
    console.log(postData);

    var post_options = {
        host: teamsServer,
        port: teamsServerPort,
        path: teamsPath,
        method: 'POST',
        agent: agent,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log(post_options);

    try {
        // Set up the request
        var post_req = proto.request(post_options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('Response: ' + chunk);
            });
            res.on('error', function (err) {
                console.log('Error: ' + err);
            });
        });

        // post the data
        post_req.write(postData);
        post_req.end();
    }
    catch (err) {
        console.log("Unable to reach teams server: " + err);
    }
}

router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'JIRA Teams Bridge'
    });
});

router.get('/hooks/:hookid', function (req, res, next) {
    res.render('index', {
        title: 'JIRA Teams Bridge - You got it right'
    });
});

router.post('/hooks/:hookid', function (req, res, next) {
    console.log("Received update from JIRA");
    var hookId = req.params.hookid;
    var webevent = req.body.webhookEvent;
    var issueID = req.body.issue.key;
    var issueRestUrl = req.body.issue.self;
    var regExp = /(.*?)\/rest\/api\/.*/g;
    var matches = regExp.exec(issueRestUrl);
    var issueUrl = matches[1] + "/browse/" + issueID;
    var summary = req.body.issue.fields.summary;

    var teamsUrl = req.query.teamsUrl;

    var displayName = req.body.user.displayName;
    var changeLog = req.body.changelog;
    var comment = req.body.comment;

    var postContent;

    if (webevent == "jira:issue_updated") {
        postContent = "##### " + displayName + " updated [" + issueID + "](" + issueUrl + "): " + summary;
    }
    else if (webevent == "jira:issue_created") {
        postContent = "##### " + displayName + " created [" + issueID + "](" + issueUrl + "): " + summary;
    }
    else if (webevent == "jira:issue_deleted") {
        postContent = "##### " + displayName + " deleted [" + issueID + "](" + issueUrl + "): " + summary;
    }
    else {
        console.log("Ignoring events which we don't understand");
        return;
    }

    if (changeLog) {
        var changedItems = req.body.changelog.items;

        postContent += "\r\n| Field | Updated Value |\r\n|:----- |:-------------|\r\n";

        for (i = 0; i < changedItems.length; i++) {
            var item = changedItems[i];
            var fieldName = item.field;
            var fieldValue = item.toString;
            if (!fieldValue) {
                fieldValue = "-Cleared-";
            }
            postContent += "| " + toTitleCase(doConversion(fieldName)) + " | " + doConversion(fieldValue) + " |\r\n";
        }
    }

    if (comment) {
        postContent += "\r\n##### Comment:\r\n" + doConversion(comment.body);
    }

    postToServer(postContent, hookId, teamsUrl);

    res.render('index', {
        title: 'JIRA Teams Bridge - beauty, posted to JIRA'
    });
});

// Function to transform JIRA payload to Teams message
function transformJiraToTeams(jiraPayload) {
    const { issueKey, summary, description, reporter } = jiraPayload;

    const teamsMessage = {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    type: 'AdaptiveCard',
                    body: [
                        {
                            type: 'TextBlock',
                            text: `Issue Created: ${issueKey}`,
                            weight: 'Bolder'
                        },
                        {
                            type: 'TextBlock',
                            text: `**Summary:** ${summary}`
                        },
                        {
                            type: 'TextBlock',
                            text: `**Description:** ${description}`
                        },
                        {
                            type: 'TextBlock',
                            text: `**Reporter:** ${reporter.displayName}`
                        }
                    ]
                }
            }
        ]
    };

    return teamsMessage;
}

module.exports = router;