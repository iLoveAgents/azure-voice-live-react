import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { parse } from 'url';

dotenv.config();

const server = createServer();
const wss = new WebSocketServer({ server });

// Configuration
const PORT = process.env.PORT || 8080;
const AZURE_RESOURCE = process.env.AZURE_AI_FOUNDRY_RESOURCE;
const AGENT_ID = process.env.AGENT_ID;
const PROJECT_NAME = process.env.PROJECT_NAME;
const API_VERSION = process.env.API_VERSION || '2025-10-01';

if (!AZURE_RESOURCE || !AGENT_ID || !PROJECT_NAME) {
  console.error('Error: Missing required environment variables (AZURE_AI_FOUNDRY_RESOURCE, AGENT_ID, PROJECT_NAME)');
  process.exit(1);
}

/**
 * Connect to Azure with Authorization header (browsers cannot do this)
 */
async function connectToAzure(bearerToken) {
  const wsUrl = `wss://${AZURE_RESOURCE}.services.ai.azure.com/voice-live/realtime?api-version=${API_VERSION}&agent-id=${AGENT_ID}&agent-project-name=${PROJECT_NAME}&agent-access-token=${encodeURIComponent(bearerToken)}`;

  const azureWs = new WebSocket(wsUrl, {
    headers: { 'Authorization': `Bearer ${bearerToken}` }
  });

  return new Promise((resolve, reject) => {
    azureWs.once('open', () => resolve(azureWs));
    azureWs.once('error', reject);
  });
}

/**
 * Simple transparent proxy: Browser ↔ Backend ↔ Azure
 */
wss.on('connection', async (clientWs, req) => {
  let azureWs;

  try {
    const { query } = parse(req.url, true);
    if (!query.token) throw new Error('Missing token parameter');

    azureWs = await connectToAzure(query.token);

    // Bidirectional message proxy
    clientWs.on('message', (msg) => azureWs.readyState === WebSocket.OPEN && azureWs.send(msg.toString('utf8')));
    azureWs.on('message', (msg) => clientWs.readyState === WebSocket.OPEN && clientWs.send(msg.toString('utf8')));

    // Connection cleanup
    clientWs.on('close', () => azureWs?.close());
    azureWs.on('close', () => clientWs.close());

  } catch (error) {
    clientWs.send(JSON.stringify({ type: 'error', error: { message: error.message } }));
    clientWs.close();
    azureWs?.close();
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Azure Agent Service Proxy running on ws://localhost:${PORT}`);
});
