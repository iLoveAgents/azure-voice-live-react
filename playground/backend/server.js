import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { parse } from 'url';

dotenv.config();

const server = createServer();
const wss = new WebSocketServer({ server });

// Configuration - API key secured in backend (not exposed to browser)
const PORT = process.env.PORT || 8080;
const AZURE_AI_FOUNDRY_RESOURCE = process.env.AZURE_AI_FOUNDRY_RESOURCE;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY; // For Voice/Avatar modes
const API_VERSION = process.env.API_VERSION || '2025-10-01';

// Agent Service configuration (optional)
const AGENT_ID = process.env.AGENT_ID;
const PROJECT_NAME = process.env.PROJECT_NAME;

if (!AZURE_AI_FOUNDRY_RESOURCE) {
  console.error('Error: AZURE_AI_FOUNDRY_RESOURCE required in .env');
  process.exit(1);
}

/**
 * Build Azure WebSocket URL based on connection mode and authentication
 *
 * Supports multiple authentication methods:
 * - Agent mode: MSAL token from browser (required)
 * - Standard mode: MSAL token from browser OR API key from backend
 */
function buildAzureUrl(query) {
  const base = `wss://${AZURE_AI_FOUNDRY_RESOURCE}.services.ai.azure.com/voice-live/realtime?api-version=${API_VERSION}`;

  // Agent mode: requires token from client (MSAL), agent-id, project-name
  if (query.mode === 'agent') {
    const agentId = query.agentId || AGENT_ID;
    const projectName = query.projectName || PROJECT_NAME;

    if (!agentId || !projectName) {
      throw new Error('Agent mode requires agentId and projectName');
    }
    if (!query.token) {
      throw new Error('Agent mode requires token parameter (MSAL)');
    }

    console.log('[Proxy] Auth: MSAL token (Agent mode)');
    return {
      url: `${base}&agent-id=${agentId}&agent-project-name=${projectName}&agent-access-token=${encodeURIComponent(query.token)}`,
      headers: { 'Authorization': `Bearer ${query.token}` }
    };
  }

  // Standard mode: Voice/Avatar
  const model = query.model || 'gpt-realtime';

  // Option 1: Token-based auth (MSAL from browser) - Enterprise/User-level auth
  if (query.token) {
    console.log('[Proxy] Auth: MSAL token (user-level)');
    return {
      url: `${base}&model=${model}`,
      headers: { 'Authorization': `Bearer ${query.token}` }
    };
  }

  // Option 2: API key auth (from backend .env) - Shared key auth
  if (AZURE_SPEECH_KEY) {
    console.log('[Proxy] Auth: API key (shared)');
    return {
      url: `${base}&model=${model}&api-key=${encodeURIComponent(AZURE_SPEECH_KEY)}`,
      headers: {}
    };
  }

  throw new Error('Standard mode requires either token parameter (MSAL) or AZURE_SPEECH_KEY in .env');
}

/**
 * Connect to Azure with appropriate authentication
 */
async function connectToAzure(query) {
  const { url, headers } = buildAzureUrl(query);

  const azureWs = new WebSocket(url, { headers });

  return new Promise((resolve, reject) => {
    azureWs.once('open', () => resolve(azureWs));
    azureWs.once('error', reject);
  });
}

/**
 * Generic transparent proxy for all Azure Voice Live scenarios
 *
 * Usage:
 * - Voice/Avatar with API key: ws://localhost:8080?mode=standard&model=gpt-realtime
 * - Voice/Avatar with MSAL: ws://localhost:8080?mode=standard&model=gpt-realtime&token=MSAL_TOKEN
 * - Agent with MSAL: ws://localhost:8080?mode=agent&token=MSAL_TOKEN
 */
wss.on('connection', async (clientWs, req) => {
  console.log('\n[Proxy] Client connected:', req.url);
  let azureWs;

  try {
    const { query } = parse(req.url, true);
    console.log('[Proxy] Mode:', query.mode || 'standard');
    console.log('[Proxy] Model:', query.model || 'default');

    azureWs = await connectToAzure(query);
    console.log('[Proxy] Connected to Azure');

    // Bidirectional message proxy
    clientWs.on('message', (msg) => {
      const text = msg.toString('utf8');
      console.log('[Proxy] Browser → Azure:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      azureWs.readyState === WebSocket.OPEN && azureWs.send(text);
    });

    azureWs.on('message', (msg) => {
      const text = msg.toString('utf8');
      console.log('[Proxy] Azure → Browser:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      clientWs.readyState === WebSocket.OPEN && clientWs.send(text);
    });

    // Connection cleanup
    clientWs.on('close', () => {
      console.log('[Proxy] Client disconnected');
      azureWs?.close();
    });
    azureWs.on('close', () => {
      console.log('[Proxy] Azure disconnected');
      clientWs.close();
    });

  } catch (error) {
    console.error('[Proxy] Error:', error.message);
    clientWs.send(JSON.stringify({ type: 'error', error: { message: error.message } }));
    clientWs.close();
    azureWs?.close();
  }
});

server.listen(PORT, () => {
  console.log(`Azure Voice Live Proxy running on ws://localhost:${PORT}`);
  console.log(`Modes: standard (Voice/Avatar) | agent (Agent Service)`);
});
