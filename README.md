# JIRA Teams Webhook Bridge

Serves as a bridge that translates the JIRA webhooks into Teams webhooks.

## Integration

* Install the required modules by running `npm install`
* Start the app by running `npm start`
* Configure Teams server and create a new [incoming webhooks](https://github.com/teams/platform/blob/master/doc/integrations/webhooks/Incoming-Webhooks.md) and note the hook-id (the part that appears after `hooks` in the hook URL.
* Configure JIRA Webhooks to forward the hook (for the required JQL) to `http://<jira-teams-bridge-server>:3000/hooks/<teams hook id - base64 encoded>`
* That's it.
