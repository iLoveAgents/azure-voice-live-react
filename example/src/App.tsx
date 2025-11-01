import { useState } from 'react';
import { useVoiceLive, AvatarDisplay, createCallCenterConfig } from '@iloveagents/azure-voice-live-react';

function App() {
  const [resourceName, setResourceName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instructions, setInstructions] = useState('You are a helpful AI assistant.');

  const config = createCallCenterConfig({
    connection: {
      resourceName,
      apiKey,
    },
    session: {
      instructions,
      voice: 'en-US-Ava:DragonHDLatestNeural',
    },
  });

  const { videoStream, connect, disconnect, connectionState } = useVoiceLive(config);

  const handleConnect = () => {
    if (!resourceName || !apiKey) {
      alert('Please enter Azure resource name and API key');
      return;
    }
    connect();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Azure Voice Live React - Test Page</h1>

      <div style={{ marginBottom: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Configuration</h2>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Azure Resource Name:
          </label>
          <input
            type="text"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
            placeholder="your-resource-name"
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            API Key:
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="your-api-key"
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Instructions:
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', fontSize: '14px' }}
          />
        </div>

        <div>
          <button
            onClick={handleConnect}
            disabled={connectionState === 'connected'}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              marginRight: '10px',
              cursor: connectionState === 'connected' ? 'not-allowed' : 'pointer',
              opacity: connectionState === 'connected' ? 0.5 : 1,
            }}
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={connectionState === 'disconnected'}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: connectionState === 'disconnected' ? 'not-allowed' : 'pointer',
              opacity: connectionState === 'disconnected' ? 0.5 : 1,
            }}
          >
            Disconnect
          </button>
          <span style={{ marginLeft: '20px', fontWeight: 'bold' }}>
            Status: <span style={{
              color: connectionState === 'connected' ? 'green' :
                     connectionState === 'connecting' ? 'orange' : 'red'
            }}>
              {connectionState}
            </span>
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Avatar</h2>
        <div style={{
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          aspectRatio: '16/9',
          maxWidth: '800px'
        }}>
          <AvatarDisplay
            videoStream={videoStream}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      <div style={{
        padding: '15px',
        background: '#e3f2fd',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Testing the Library</h3>
        <p>This example demonstrates:</p>
        <ul>
          <li>Using <code>createCallCenterConfig</code> preset</li>
          <li>Connecting to Azure Voice Live API</li>
          <li>Displaying avatar video</li>
          <li>Managing connection state</li>
        </ul>
        <p><strong>Note:</strong> You need valid Azure AI Foundry credentials to test.</p>
      </div>
    </div>
  );
}

export default App;
