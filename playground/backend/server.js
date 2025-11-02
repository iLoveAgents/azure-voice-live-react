import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { parse } from 'url';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Configuration
const PORT = process.env.PORT || 8080;
const AZURE_RESOURCE = process.env.AZURE_AI_FOUNDRY_RESOURCE;
const AGENT_ID = process.env.AGENT_ID;
const PROJECT_NAME = process.env.PROJECT_NAME;
const API_VERSION = process.env.API_VERSION || '2025-10-01';

// Validate required configuration
if (!AZURE_RESOURCE || !AGENT_ID || !PROJECT_NAME) {
  console.error('❌ Missing required environment variables:');
  console.error('   AZURE_AI_FOUNDRY_RESOURCE:', AZURE_RESOURCE ? '✓' : '✗');
  console.error('   AGENT_ID:', AGENT_ID ? '✓' : '✗');
  console.error('   PROJECT_NAME:', PROJECT_NAME ? '✓' : '✗');
  console.error('\nPlease configure all required variables in .env file');
  process.exit(1);
}

/**
 * Establish WebSocket connection to Azure Voice Live Agent Service
 * @param {string} bearerToken - The Azure AD token from the browser (MSAL)
 */
async function connectToAzure(bearerToken) {
  const wsUrl = `wss://${AZURE_RESOURCE}.services.ai.azure.com/voice-live/realtime?api-version=${API_VERSION}&agent-id=${AGENT_ID}&agent-project-name=${PROJECT_NAME}&agent-access-token=${encodeURIComponent(bearerToken)}`;

  console.log(`🔗 Connecting to Azure Voice Live Agent Service...`);
  console.log(`   Agent: ${AGENT_ID}`);
  console.log(`   Project: ${PROJECT_NAME}`);

  // Create WebSocket connection with Authorization header
  // Browser can't set this header, but Node.js can
  const azureWs = new WebSocket(wsUrl, {
    headers: {
      'Authorization': `Bearer ${bearerToken}`
    }
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      azureWs.close();
      reject(new Error('Connection timeout after 10 seconds'));
    }, 10000);

    azureWs.on('open', () => {
      clearTimeout(timeout);
      console.log('✓ Connected to Azure Voice Live Agent Service');
      resolve(azureWs);
    });

    azureWs.on('error', (error) => {
      clearTimeout(timeout);
      console.error('Azure WebSocket error:', error.message);
      reject(error);
    });
  });
}

/**
 * Handle WebSocket connections from browser clients
 */
wss.on('connection', async (browserWs, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`\n📱 Browser client connected from ${clientIp}`);

  let azureWs = null;

  try {
    // Extract bearer token from query parameters
    const { query } = parse(req.url, true);
    const bearerToken = query.token;

    if (!bearerToken) {
      throw new Error('Missing bearer token. Please provide token in query parameter: ?token=YOUR_TOKEN');
    }

    console.log('🔐 Using bearer token from browser (MSAL)');

    // Connect to Azure Voice Live Agent Service with the browser's token
    azureWs = await connectToAzure(bearerToken);

    // Proxy messages from browser to Azure
    browserWs.on('message', (message) => {
      if (azureWs && azureWs.readyState === WebSocket.OPEN) {
        // Convert to text if it's a buffer
        const textMessage = message.toString('utf8');
        azureWs.send(textMessage);
      } else {
        console.warn('⚠️  Azure connection not ready, message dropped');
      }
    });

    // Proxy messages from Azure to browser
    azureWs.on('message', (message) => {
      if (browserWs.readyState === WebSocket.OPEN) {
        // Convert to text if it's a buffer
        const textMessage = message.toString('utf8');
        browserWs.send(textMessage);
      }
    });

    // Handle Azure connection close
    azureWs.on('close', (code, reason) => {
      console.log(`🔌 Azure connection closed - Code: ${code}, Reason: ${reason || 'No reason'}`);
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.close(1000, 'Azure connection closed');
      }
    });

    // Handle Azure connection error
    azureWs.on('error', (error) => {
      console.error('❌ Azure connection error:', error.message);
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.close(1011, 'Azure connection error');
      }
    });

    // Handle browser connection close
    browserWs.on('close', (code, reason) => {
      console.log(`🔌 Browser connection closed - Code: ${code}, Reason: ${reason || 'No reason'}`);
      if (azureWs && azureWs.readyState === WebSocket.OPEN) {
        azureWs.close(1000, 'Browser disconnected');
      }
    });

    // Handle browser connection error
    browserWs.on('error', (error) => {
      console.error('❌ Browser connection error:', error.message);
    });

    console.log('✓ Proxy established - Browser ↔ Backend ↔ Azure');

  } catch (error) {
    console.error('❌ Failed to establish proxy:', error.message);

    // Send error to browser
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.send(JSON.stringify({
        type: 'error',
        error: {
          message: 'Failed to connect to Azure Voice Live Agent Service',
          details: error.message
        }
      }));
      browserWs.close(1011, 'Proxy setup failed');
    }

    // Clean up Azure connection if it exists
    if (azureWs && azureWs.readyState === WebSocket.OPEN) {
      azureWs.close();
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Agent Service Proxy',
    config: {
      resource: AZURE_RESOURCE,
      agentId: AGENT_ID,
      projectName: PROJECT_NAME
    }
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Agent Service Proxy Server Running');
  console.log('='.repeat(60));
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🎯 Azure Configuration:`);
  console.log(`   Resource: ${AZURE_RESOURCE}.services.ai.azure.com`);
  console.log(`   Agent ID: ${AGENT_ID}`);
  console.log(`   Project: ${PROJECT_NAME}`);
  console.log('\n💡 Make sure you are logged in with Azure CLI:');
  console.log('   az login');
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});
