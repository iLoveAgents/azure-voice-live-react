import { useRef, useEffect, useCallback, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useAudioCapture } from '@iloveagents/azure-voice-live-react';

export default function AgentServiceProxy(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [sessionReady, setSessionReady] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const backendProxyUrl = import.meta.env.VITE_BACKEND_PROXY_URL || 'ws://localhost:8080';

  // Acquire access token for Agent Service
  const acquireToken = async () => {
    if (accounts.length === 0) {
      // No user signed in - initiate sign-in
      try {
        setAuthError(null);
        await instance.loginPopup({
          scopes: ['https://ai.azure.com/.default'],
        });
      } catch (error) {
        console.error('Sign-in error:', error);
        setAuthError(`Sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    // User is signed in - acquire token silently
    try {
      setAuthError(null);
      const response = await instance.acquireTokenSilent({
        scopes: ['https://ai.azure.com/.default'],
        account: accounts[0],
      });
      setAccessToken(response.accessToken);
      console.log('Access token acquired successfully with Azure AI scope');
    } catch (error) {
      // Token acquisition failed - may need interactive authentication
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const response = await instance.acquireTokenPopup({
            scopes: ['https://ai.azure.com/.default'],
            account: accounts[0],
          });
          setAccessToken(response.accessToken);
          console.log('Access token acquired via popup with Azure AI scope');
        } catch (popupError) {
          console.error('Token acquisition failed:', popupError);
          setAuthError(`Authentication failed: ${popupError instanceof Error ? popupError.message : String(popupError)}`);
        }
      } else {
        console.error('Token acquisition error:', error);
        setAuthError(`Token error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  // Auto-acquire token on mount and when accounts change
  useEffect(() => {
    if (accounts.length > 0 && !accessToken) {
      acquireToken();
    }
  }, [accounts]);

  // Connect to backend proxy
  const connect = useCallback(async () => {
    if (!accessToken) {
      setAuthError('Please sign in first');
      return;
    }

    try {
      setConnectionState('connecting');

      // Connect to backend with token as query parameter (agent mode)
      const ws = new WebSocket(`${backendProxyUrl}/ws?mode=agent&token=${encodeURIComponent(accessToken)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[Agent] Connected to proxy');
        setConnectionState('connected');

        // Initialize AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 24000 });
          const destination = audioContextRef.current.createMediaStreamDestination();
          setAudioStream(destination.stream);
        }
      };

      ws.onmessage = async (event) => {
        try {
          // Handle both text and blob messages
          let data: string;
          if (event.data instanceof Blob) {
            data = await event.data.text();
          } else {
            data = event.data;
          }

          const message = JSON.parse(data);

          // Only log important events (not every message)
          const importantEvents = ['session.created', 'session.updated', 'error', 'conversation.item.input_audio_transcription.completed'];
          if (importantEvents.includes(message.type)) {
            console.log(`[Agent] ${message.type}:`, message);
          }

          // Handle audio delta
          if (message.type === 'response.audio.delta' && message.delta) {
            const audioData = Uint8Array.from(atob(message.delta), c => c.charCodeAt(0));
            playAudio(audioData);
          }

          // Handle session created - send configuration
          if (message.type === 'session.created') {
            ws.send(JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: { model: 'whisper-1' },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 500
                }
              }
            }));
          }

          // Handle session updated - now ready to send audio
          if (message.type === 'session.updated') {
            setSessionReady(true);
          }

          // Handle errors from Azure
          if (message.type === 'error') {
            const errorMsg = message.error?.message || message.error?.code || 'Unknown error from Azure';
            console.error('[Agent] Error:', message);
            setAuthError(`Azure Error: ${errorMsg}`);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('disconnected');
        setAuthError('Connection error');
      };

      ws.onclose = (event) => {
        console.log(`[Agent] WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'No reason'}`);
        setConnectionState('disconnected');
        if (!event.wasClean && event.code !== 1000) {
          // Map common close codes to user-friendly messages
          const closeMessages: Record<number, string> = {
            1007: 'Invalid data format or permissions issue',
            1008: 'Policy violation',
            1011: 'Server error',
          };
          const userMessage = closeMessages[event.code] || `Connection closed unexpectedly (code: ${event.code})`;
          setAuthError(event.reason || userMessage);
        }
      };

    } catch (error) {
      console.error('Connection error:', error);
      setConnectionState('disconnected');
      setAuthError(error instanceof Error ? error.message : String(error));
    }
  }, [accessToken, backendProxyUrl]);

  // Disconnect
  const disconnect = useCallback(() => {
    // Stop all playing audio
    audioQueueRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    audioQueueRef.current = [];
    nextPlayTimeRef.current = 0;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    setSessionReady(false);
  }, []);

  // Play audio with queuing to prevent overlaps
  const playAudio = useCallback((audioData: Uint8Array) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const int16Array = new Int16Array(audioData.buffer);
    const float32Array = new Float32Array(int16Array.length);

    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    // Queue audio to play sequentially
    const currentTime = audioContext.currentTime;
    const startTime = Math.max(currentTime, nextPlayTimeRef.current);

    source.start(startTime);
    nextPlayTimeRef.current = startTime + audioBuffer.duration;

    // Clean up when done
    source.onended = () => {
      const index = audioQueueRef.current.indexOf(source);
      if (index > -1) {
        audioQueueRef.current.splice(index, 1);
      }
    };

    audioQueueRef.current.push(source);
  }, []);

  // Send audio data to backend proxy
  const sendAudioData = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionReady) {
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));
    }
  }, [sessionReady]);

  const { startCapture, stopCapture, isCapturing } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: useCallback((audioData: ArrayBuffer) => {
      sendAudioData(audioData);
    }, [sendAudioData]),
  });

  // Setup audio element
  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

  const handleStart = async (): Promise<void> => {
    try {
      setAuthError(null); // Clear previous errors
      await connect();
      // Audio capture will start automatically when session is ready
    } catch (err) {
      console.error('[Agent] Start error:', err);
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

  // Start audio capture when session is ready
  useEffect(() => {
    if (sessionReady && connectionState === 'connected' && !isCapturing) {
      startCapture().then(() => {
        console.log('[Agent] Microphone started');
      }).catch((err) => {
        console.error('[Agent] Mic start failed:', err);
        setAuthError(`Microphone error: ${err.message}`);
      });
    }
  }, [sessionReady, connectionState, isCapturing, startCapture]);

  const handleStop = async (): Promise<void> => {
    await stopCapture();
    disconnect();
  };

  const handleSignOut = () => {
    instance.logoutPopup();
    setAccessToken(null);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Agent Service with Backend Proxy</h1>

      {/* Authentication Status */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Authentication Status</h3>
        {accounts.length === 0 ? (
          <>
            <p>Not signed in</p>
            <button onClick={acquireToken}>Sign In</button>
          </>
        ) : (
          <>
            <p>Signed in as: <strong>{accounts[0].username}</strong></p>
            <p>Access token: {accessToken ? '✓ Acquired' : '✗ Not available'}</p>
            <button onClick={handleSignOut}>Sign Out</button>
          </>
        )}
        {authError && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
            {authError}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={handleStart}
          disabled={connectionState === 'connected' || !accessToken}
          style={{ marginRight: '1rem' }}
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={connectionState === 'disconnected'}
        >
          Stop
        </button>
        <div style={{ marginTop: '0.5rem' }}>
          {connectionState} {isCapturing && '(mic)'}
        </div>
      </div>

      {/* Architecture Diagram */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Architecture</h3>
        <div style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
          Browser (MSAL) → Backend Proxy (Node.js) → Azure Voice Live Agent Service
          <br />
          <span style={{ opacity: 0.7 }}>Token acquired via MSAL, sent to proxy, proxy adds Authorization header</span>
        </div>
      </div>

      {/* Setup Instructions */}
      <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Setup Instructions</h3>
        <ol>
          <li>Ensure your backend proxy server is running</li>
          <li>Configure Azure AD app with appropriate scopes</li>
          <li>Sign in and click "Start"</li>
        </ol>
        <p style={{ marginTop: '1rem' }}>
          <strong>Backend URL:</strong> {backendProxyUrl}
        </p>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
