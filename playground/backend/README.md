# Agent Service Backend Proxy

This is a Node.js WebSocket proxy server that enables browser-based applications to connect to Azure Voice Live Agent Service.

## Why is this needed?

Browser WebSocket API has a fundamental limitation: **it cannot set custom HTTP headers** (like `Authorization`) during the WebSocket handshake. The Azure Voice Live Agent Service requires the `Authorization: Bearer <token>` header for authentication, which makes direct browser connections impossible.

### Architecture

```
Browser (MSAL) → Backend Proxy → Azure Voice Live Agent Service
     ↓               ↓                        ↓
  Token via    Adds Auth Header      Requires Auth Header
  Query Param   (Node.js can do)      (Browser cannot do)
```

## Setup

### 1. Install Dependencies

```bash
cd playground/backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
PORT=8080
AZURE_AI_FOUNDRY_RESOURCE=your-resource-name
AGENT_ID=your-agent-id
PROJECT_NAME=your-project-name
API_VERSION=2025-10-01
```

### 3. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## How It Works

1. **Browser Authentication**: The browser uses MSAL to obtain an Azure AD token with scope `https://ai.azure.com/.default`

2. **WebSocket Connection**: The browser connects to the proxy with the token as a query parameter:
   ```
   ws://localhost:8080?token=<azure-ad-token>
   ```

3. **Proxy → Azure**: The Node.js proxy:
   - Extracts the token from the query parameter
   - Creates a WebSocket connection to Azure Voice Live Agent Service
   - Adds the `Authorization: Bearer <token>` header (which browsers can't do)
   - Adds the `agent-access-token` query parameter

4. **Message Proxying**: The proxy bidirectionally forwards all WebSocket messages between the browser and Azure

## API

### WebSocket Endpoint

**URL**: `ws://localhost:8080`

**Query Parameters**:
- `token` (required): Azure AD bearer token from MSAL

**Example**:
```javascript
const token = await msalInstance.acquireTokenSilent({
  scopes: ['https://ai.azure.com/.default']
});

const ws = new WebSocket(`ws://localhost:8080?token=${encodeURIComponent(token.accessToken)}`);
```

### Health Check

**URL**: `http://localhost:8080/health`

**Response**:
```json
{
  "status": "ok",
  "service": "Agent Service Proxy",
  "config": {
    "resource": "your-resource-name",
    "agentId": "your-agent-id",
    "projectName": "your-project-name"
  }
}
```

## Security Considerations

- **Token in URL**: The token is passed as a query parameter, which is encrypted by WSS (WebSocket Secure). This is equivalent to HTTPS encryption.
- **Backend Only**: This proxy should run on a backend server, not exposed directly to the internet without proper security measures.
- **Token Validation**: The proxy trusts the token from the browser. In production, you should add additional validation.
- **CORS**: Configure CORS appropriately for your production environment.

## Production Deployment

For production, consider:

1. **HTTPS**: Use WSS (secure WebSocket) with SSL certificates
2. **Authentication**: Add your own authentication layer before accepting browser connections
3. **Rate Limiting**: Implement rate limiting per user/IP
4. **Monitoring**: Add logging and monitoring for connection events
5. **Error Handling**: Implement robust error handling and retry logic

## Troubleshooting

### "Missing bearer token" error

Make sure you're passing the token in the URL:
```javascript
ws://localhost:8080?token=YOUR_TOKEN
```

### "Failed to connect to Azure" error

Check that:
- Your Azure credentials are valid
- The agent ID and project name are correct
- You have the "Cognitive Services User" role in Azure

### Connection timeout

The proxy waits 10 seconds for Azure to respond. If this times out:
- Check your network connection
- Verify Azure service is available
- Check Azure portal for service health

## License

Same as parent project
