var express = require('express');
var router = express.Router();
var https = require('https');
var http = require('http');
var toMarkdown = require('to-markdown');
var url = require('url');
var HttpsProxyAgent = require('https-proxy-agent');
var HttpProxyAgent = require('http-proxy-agent');
const Buffer = require('buffer').Buffer;
const fetch = require('node-fetch');

function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function doConversion(str) {
    return toMarkdown(str);
}

async function postToURL(url, data) {
    console.log("Informing teams channel: " + url);
    console.log("Data: ", data);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        const json = await response.json(); 1
        console.log('Response:', json);
    } catch (error) {
        console.error('Failed to post to teams URL:', error);
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


    const decodedBuffer = Buffer.from(hookId, 'base64');
    var teamsUrl = decodedBuffer.toString('utf8');
    console.log("Teams URL: ", teamsUrl);

    var displayName = req.body.user.displayName;
    var changeLog = req.body.changelog;
    var comment = req.body.comment;

    var postContent;

    if (webevent == "jira:issue_updated") {
        postContent = "**" + displayName + "** updated [" + issueID + "](" + issueUrl + "): " + summary;
    }
    else if (webevent == "jira:issue_created") {
        postContent = "**" + displayName + "** created [" + issueID + "](" + issueUrl + "): " + summary;
    }
    else if (webevent == "jira:issue_deleted") {
        postContent = "**" + displayName + "** deleted [" + issueID + "](" + issueUrl + "): " + summary;
    }
    else {
        console.log("Ignoring events which we don't understand");
        return;
    }
    console.log("Post content #1: ", postContent);

    if (changeLog) {
        var changedItems = req.body.changelog.items;

        postContent += "\r**Changed Fields**";

        for (i = 0; i < changedItems.length; i++) {
            var item = changedItems[i];
            var fieldName = item.field;
            var fieldValue = item.toString;
            if (!fieldValue) {
                fieldValue = "-Cleared-";
            }
            postContent += "\r* **" + toTitleCase(doConversion(fieldName)) + "**: " + doConversion(fieldValue);
        }
    }
    console.log("Post content #2: ", postContent);

    if (comment) {
        postContent += "\r\r**Comment**: " + doConversion(comment.body);
    }

    postToURL(teamsUrl, transformJiraToTeams(postContent, summary, issueUrl));

    res.render('index', {
        title: 'JIRA Teams Bridge - beauty, posted to JIRA'
    });
});

// Function to transform JIRA payload to Teams message
function transformJiraToTeams(content, summary, jiraUrl) {
    const teamsMessage = {
        type: 'message',
        attachments: [
            {
                contentType: 'application/vnd.microsoft.card.adaptive',
                content: {
                    type: 'AdaptiveCard',
                    version: '1.2',
                    body: [
                        {
                            type: "TextBlock",
                            size: "medium",
                            weight: "bolder",
                            text: summary,
                            style: "heading",
                            wrap: true
                        },
                        {
                            type: 'TextBlock',
                            text: content,
                            wrap: true
                        }
                    ],
                    actions: [
                        {
                            type: 'Action.OpenUrl',
                            title: 'View in JIRA',
                            url: jiraUrl
                        }
                    ]
                },
                msteams: {
                    width: "full"
                }
            }
        ]
    };

    return teamsMessage;
}

module.exports = router;