import { useState, useCallback } from 'react';
import {
  useVoiceLive,
  useAudioCapture,
  AvatarDisplay,
  createCallCenterConfig,
} from '@iloveagents/azure-voice-live-react';

type Mode = 'voice-only' | 'avatar';

function App() {
  // Debug: Log all env vars
  console.log('🔍 Environment variables:', {
    resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
    hasApiKey: !!import.meta.env.VITE_AZURE_SPEECH_KEY,
    allEnv: import.meta.env,
  });

  const [mode, setMode] = useState<Mode>('voice-only');
  const [resourceName, setResourceName] = useState(
    import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE || ''
  );
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_AZURE_SPEECH_KEY || '');
  const [instructions, setInstructions] = useState('You are a helpful AI assistant.');

  // Voice-only configuration (no avatar)
  const voiceOnlyConfig = createCallCenterConfig(
    { resourceName, apiKey }, // connection as first parameter
    {
      session: {
        instructions,
        voice: 'en-US-Ava:DragonHDLatestNeural',
        // No avatar configuration
      },
    }
  );

  // Avatar configuration
  const avatarConfig = createCallCenterConfig(
    { resourceName, apiKey }, // connection as first parameter
    {
      session: {
        instructions,
        voice: 'en-US-Ava:DragonHDLatestNeural',
        avatar: {
          character: 'lisa',
          style: 'casual-sitting',
        },
      },
    }
  );

  const config = mode === 'voice-only' ? voiceOnlyConfig : avatarConfig;

  // Debug: Log config before using it
  console.log('🔧 Config being used:', {
    mode,
    resourceName: config.connection.resourceName,
    hasApiKey: !!config.connection.apiKey,
    fullConfig: config,
  });

  const { videoStream, connect, disconnect, connectionState, sendEvent } =
    useVoiceLive(config);

  // Audio capture hook
  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    workletPath: '/audio-processor.js',
    onAudioData: useCallback(
      (audioData: ArrayBuffer) => {
        if (connectionState === 'connected') {
          const uint8Array = new Uint8Array(audioData);
          const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
          sendEvent({
            type: 'input_audio_buffer.append',
            audio: base64Audio,
          });
        }
      },
      [connectionState, sendEvent]
    ),
  });

  const handleConnect = async () => {
    console.log('🔌 handleConnect called with:', {
      resourceName,
      apiKey: apiKey?.substring(0, 10) + '...',
    });
    if (!resourceName || !apiKey) {
      alert('Please enter Azure resource name and API key');
      return;
    }
    await connect();
    await startCapture();
  };

  const handleDisconnect = async () => {
    await stopCapture();
    disconnect();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Azure Voice Live React - Playground</h1>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setMode('voice-only')}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              background: mode === 'voice-only' ? '#0078d4' : '#f0f0f0',
              color: mode === 'voice-only' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              fontWeight: mode === 'voice-only' ? 'bold' : 'normal',
            }}
          >
            Voice Only
          </button>
          <button
            onClick={() => setMode('avatar')}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              background: mode === 'avatar' ? '#0078d4' : '#f0f0f0',
              color: mode === 'avatar' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              fontWeight: mode === 'avatar' ? 'bold' : 'normal',
            }}
          >
            Voice + Avatar
          </button>
        </div>

        <div style={{
          padding: '15px',
          background: '#fff3cd',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffc107',
        }}>
          <strong>Current Mode:</strong> {mode === 'voice-only' ? '🎤 Voice Only' : '🎭 Voice + Avatar (Lisa, casual-sitting)'}
        </div>
      </div>

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
            onClick={handleDisconnect}
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

      {mode === 'avatar' && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Avatar Display</h2>
          <div style={{
            background: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            maxWidth: '800px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {connectionState === 'connected' ? (
              <AvatarDisplay
                videoStream={videoStream}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '18px' }}>Connect to see avatar</p>
                <p style={{ fontSize: '14px', color: '#999' }}>Avatar: Lisa (casual-sitting)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'voice-only' && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Voice Session</h2>
          <div style={{
            background: '#f9f9f9',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            border: '2px dashed #ddd',
          }}>
            {connectionState === 'connected' ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎤</div>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0078d4' }}>Voice session active</p>
                <p style={{ fontSize: '14px', color: '#666' }}>Speak to the AI assistant</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎙️</div>
                <p style={{ fontSize: '16px', color: '#666' }}>Connect to start voice session</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{
        padding: '15px',
        background: '#e3f2fd',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Testing Guide</h3>
        <p><strong>Voice Only Mode:</strong></p>
        <ul>
          <li>Audio-only conversation with AI</li>
          <li>Lower bandwidth requirements</li>
          <li>Uses <code>createCallCenterConfig</code> preset without avatar</li>
        </ul>
        <p><strong>Voice + Avatar Mode:</strong></p>
        <ul>
          <li>Full audio + video avatar experience</li>
          <li>Displays Lisa avatar in casual-sitting style</li>
          <li>Real-time lip-sync and expressions</li>
        </ul>
        <p><strong>Note:</strong> You need valid Azure AI Foundry credentials to test.</p>
      </div>
    </div>
  );
}

export default App;
