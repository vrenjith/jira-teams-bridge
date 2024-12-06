# JIRA Teams Webhook Bridge

Serves as a bridge that translates the JIRA webhooks into Teams webhooks.

## Integration

* Install the required modules by running `npm install`
* Start the app by running `npm start`
* Configure Teams server and create a new [incoming webhooks](https://github.com/teams/platform/blob/master/doc/integrations/webhooks/Incoming-Webhooks.md) and note the hook-id (the part that appears after `hooks` in the hook URL.
* Configure JIRA Webhooks to forward the hook (for the required JQL) to `http://<jira-teams-bridge-server>:3000/hooks/<teams hook id - base64 encoded>`
* That's it.

## Docker Image

The docker image of this is available in [Docker Hub](https://hub.docker.com/r/vrenjith/jira-teams-bridge)

```bash
docker run -it vrenjith/jira-teams-bridge
```

## Running in Kubernetes

To run this Docker image as a service in Kubernetes, follow these steps:

1. **Create a Deployment**: This will manage the pods running your Docker image.

```sh
kubectl create deployment jira-teams-bridge --image=vrenjith/jira-teams-bridge

2. Expose the Deployment as a Service: This will expose your deployment to the network.

```bash

kubectl expose deployment jira-teams-bridge --type=ClusterIP --port=80 --target-port=3000

```
