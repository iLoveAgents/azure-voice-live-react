# Azure Voice Live Backend Proxy

**Generic WebSocket proxy for all Azure Voice Live scenarios with production-ready security.**

## Why Use a Proxy?

### ⚠️ Security Problem: API Keys in Browser

**Never embed API keys in browser code:**
- ❌ API keys in `.env` files get bundled into browser JavaScript
- ❌ Anyone can inspect network tab and steal your keys
- ❌ Keys can be extracted from source code

**Three Authentication Options:**

| Option | Security | Use Case |
|--------|----------|----------|
| **API keys in browser** | 🔴 Insecure | Quick demos only |
| **Azure Static Web Apps + Easy Auth** | 🟡 Better | SWA deployment, keys in backend config |
| **Backend Proxy** | 🟢 Best | Production apps, keys never exposed |

## How the Proxy Works

```
┌─────────┐              ┌─────────┐              ┌───────┐
│ Browser │──no keys──▶  │  Proxy  │──with keys──▶│ Azure │
└─────────┘              └─────────┘              └───────┘
                         API key secured
                         in backend .env
```

**Key Benefits:**
- API keys stay server-side (never exposed to browser)
- Single proxy handles all scenarios (Voice, Avatar, Agent)
- Switch to proxy by changing one line of code

## Quick Start

### 1. Install & Configure

```bash
cd playground/backend
npm install
cp .env.example .env
# Edit .env with your values
npm start
```

### 2. Update Frontend Code

**Before (insecure):**
```typescript
const config = createVoiceLiveConfig('default', {
  connection: {
    resourceName: 'my-resource',
    apiKey: 'my-api-key', // ❌ Exposed in browser!
  }
});
```

**After (secure):**
```typescript
const config = createVoiceLiveConfig('default', {
  connection: {
    customWebSocketUrl: 'ws://localhost:8080?mode=standard&model=gpt-realtime',
    // ✅ No API key needed! Proxy adds it server-side.
  }
});
```

That's it! Just change the endpoint.

## All Supported Scenarios

### Voice & Avatar (Standard Mode)

**Frontend:**
```typescript
customWebSocketUrl: 'ws://localhost:8080?mode=standard&model=gpt-realtime'
```

**Backend (.env):**
```bash
AZURE_AI_FOUNDRY_RESOURCE=your-resource
AZURE_SPEECH_KEY=your-api-key  # Secured server-side
```

### Agent Service (MSAL Mode)

**Frontend:**
```typescript
const token = await msalInstance.acquireTokenSilent({
  scopes: ['https://ai.azure.com/.default']
});

customWebSocketUrl: `ws://localhost:8080?mode=agent&token=${token.accessToken}`
```

**Backend (.env):**
```bash
AZURE_AI_FOUNDRY_RESOURCE=your-resource
AGENT_ID=your-agent-id
PROJECT_NAME=your-project
```

## Configuration

### Environment Variables (.env)

```bash
# Server
PORT=8080
API_VERSION=2025-10-01

# Azure Resource (required)
AZURE_AI_FOUNDRY_RESOURCE=your-resource-name

# Voice/Avatar: API key secured in backend
AZURE_SPEECH_KEY=your-api-key-here

# Agent Service: optional defaults
AGENT_ID=your-agent-id
PROJECT_NAME=your-project-name
```

## Production Deployment

### Option 1: Node.js (PM2, Docker, etc.)

```bash
# With PM2
pm2 start server.js --name azure-voice-proxy

# With Docker
docker build -t voice-proxy .
docker run -p 8080:8080 --env-file .env voice-proxy
```

### Option 2: Nginx (Simplest)

See [nginx.conf.example](./nginx.conf.example) for full configuration.

```nginx
location /voice-proxy {
    proxy_pass https://your-resource.services.ai.azure.com/voice-live/realtime?...;
    proxy_set_header Authorization "Bearer $token";
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Security Best Practices

1. **Never commit `.env`** - add to `.gitignore`
2. **Use WSS in production** - secure WebSocket (TLS)
3. **Add rate limiting** - prevent abuse
4. **Validate tokens** - especially for agent mode
5. **Use environment-specific configs** - dev/staging/prod

## Examples

See the playground for complete examples:
- `/voice-proxy` - Voice chat with secure proxy
- `/avatar-proxy` - Avatar with secure proxy
- `/agent-service` - Agent Service with MSAL + proxy

## Troubleshooting

**Connection fails:**
- Verify `.env` has correct values
- Check backend is running: `curl http://localhost:8080`
- Check backend logs for errors

**"Missing token parameter":**
- Agent mode requires MSAL token in query param
- Standard mode doesn't need token

**"AZURE_SPEECH_KEY required":**
- Standard mode needs API key in backend .env
- Make sure you copied .env.example to .env
