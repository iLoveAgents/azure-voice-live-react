# Agent Service Backend Proxy

Transparent WebSocket proxy that enables browser connections to Azure Voice Live Agent Service.

## Why is this needed?

Browsers cannot set the `Authorization` header during WebSocket handshake, but Azure requires it. This proxy adds the header server-side.

```
Browser (MSAL) → Proxy → Azure Agent Service
     Token       Adds Auth       Requires Auth
```

## Proxy Options

### Option 1: Node.js (Development)

**Setup:**

```bash
npm install
cp .env.example .env
# Edit .env with your Azure configuration
npm start
```

**Configuration (.env):**
```bash
PORT=8080
AZURE_AI_FOUNDRY_RESOURCE=your-resource
AGENT_ID=your-agent-id
PROJECT_NAME=your-project
API_VERSION=2025-10-01
```

**Usage:**
```javascript
const ws = new WebSocket(`ws://localhost:8080?token=${token}`);
```

### Option 2: Nginx (Production)

**Configuration (nginx.conf):**
```nginx
location /agent-service {
    set $token $arg_token;
    set $azure_resource "your-resource.services.ai.azure.com";

    proxy_pass https://$azure_resource/voice-live/realtime?...;
    proxy_set_header Authorization "Bearer $token";

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

See [nginx.conf.example](./nginx.conf.example) for complete configuration.

## How it works

1. Browser gets Azure AD token via MSAL
2. Browser connects to proxy with token in query parameter
3. Proxy adds `Authorization: Bearer <token>` header (browsers can't)
4. Proxy forwards all messages transparently

## Security

- Token transmitted over WSS (encrypted like HTTPS)
- Add authentication/rate limiting for production
- Use WSS (secure WebSocket) in production
- Validate tokens server-side for sensitive applications

## Troubleshooting

**Connection fails:**
- Verify token is valid and has `https://ai.azure.com/.default` scope
- Check Azure configuration in .env
- Ensure "Cognitive Services User" role assigned in Azure

**Messages not working:**
- Azure expects text messages (JSON), not binary
- Proxy automatically converts buffers to UTF-8 text
