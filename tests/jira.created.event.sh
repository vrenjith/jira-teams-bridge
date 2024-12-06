curl -X POST -H "Content-Type: application/json" -d '{
    "webhookEvent": "jira:issue_created",
    "id": "1",
    "issue": {
        "id": "10001",
        "key": "TEST-1",
        "type": "Bug",
        "fields" : {
            "summary": "This is a test issue and a very long summary for testing",
            "description": "This is a test issue description."
        },
        "self" : "https://your-jira-instance.atlassian.net/rest/api/latest/issue/TEST-1"
    },
    "changelog": {
        "items": [
            {
                "field": "somefield",
                "fieldId": "somefield",
                "fromString": "",
                "toString": "Some data changed"
            }
        ]
    },
    "user": {
        "self": "https://your-jira-instance.atlassian.net/rest/api/3/user?username=yourusername",
        "name": "Your Name",
        "displayName": "Your Display Name",
        "emailAddress": "your.email@example.com",
        "avatarUrls": {
            "48x48": "https://your-avatar-url.com/48x48.jpg"
        }
    },
    "comment" : {
        "body" : "This is a comment. Again a very long comment for testing."
    },
    "timestamp": "2023-11-29T12:34:56.789Z"
}' "http://127.0.0.1:3000/hooks/aHR0cHM6Ly9zYXAud2ViaG9vay5vZmZpY2UuY29tL3dlYmhvb2tiMi8wYzhlYmZkNC03M2MxLTQ5MDktOTI4OS0yYWVhZjY0MDBmNzZANDJmNzY3NmMtZjQ1NS00MjNjLTgyZjYtZGMyZDk5NzkxYWY3L0luY29taW5nV2ViaG9vay85OTgyZGZjNjIzODc0YWEzODVlNDFmMTE1Nzc3NjFlNi8wNjEzYjY0MS1iZGYxLTRiODItOTg1NC1kNjg2ZmE4YTgyY2MvVjJxNTdybTdMQjljdTl0YmNlanRpdUI3bUxUUXNPdEpBajNEMFhDb3hySXc0MQo="