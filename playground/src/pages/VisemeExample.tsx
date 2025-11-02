import { useCallback, useState } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig, withViseme } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function VisemeExample() {
  const [currentViseme, setCurrentViseme] = useState<number | null>(null);
  const [visemeHistory, setVisemeHistory] = useState<Array<{viseme: number, offset: number}>>([]);

  // Enable viseme output
  // IMPORTANT: Visemes only work with Azure STANDARD voices (not HD or OpenAI voices)
  const config = createVoiceLiveConfig('default', {
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: withViseme({
      instructions: 'You are a helpful assistant. Keep responses brief.',
      voice: {
        name: 'en-US-AvaNeural', // Standard voice (HD voices don't support viseme)
        type: 'azure-standard',
      },
    }),
  });

  const { connect, disconnect, connectionState, sendEvent } = useVoiceLive({
    ...config,
    onEvent: useCallback((event: any) => {
      if (event.type === 'response.animation_viseme.delta') {
        setCurrentViseme(event.viseme_id);
        setVisemeHistory(prev => [...prev.slice(-20), { viseme: event.viseme_id, offset: event.audio_offset_ms }]);
      }
    }, []),
  });

  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: useCallback((audioData: ArrayBuffer) => {
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
      sendEvent({ type: 'input_audio_buffer.append', audio: base64Audio });
    }, [sendEvent]),
  });

  const handleStart = async () => {
    try {
      await connect();
      await startCapture();
      setVisemeHistory([]);
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = async () => {
    await stopCapture();
    disconnect();
  };

  // Viseme to mouth shape mapping (simplified)
  const getVisemeName = (id: number) => {
    const visemes: { [key: number]: string } = {
      0: 'Silence',
      1: 'AE/AX/AH',
      2: 'AA',
      3: 'AO',
      4: 'EY/EH/UH',
      5: 'ER',
      6: 'Y/IY/IH/IX',
      7: 'W/UW',
      8: 'OW',
      9: 'AW',
      10: 'OY',
      11: 'AY',
      12: 'H',
      13: 'R',
      14: 'L',
      15: 'S/Z',
      16: 'SH/CH/JH/ZH',
      17: 'TH/DH',
      18: 'F/V',
      19: 'D/T/N',
      20: 'K/G/NG',
      21: 'P/B/M',
    };
    return visemes[id] || 'Unknown';
  };

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Viseme for Custom Avatar</h1>
      <p>Status: {connectionState}</p>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleStart}>Start</button>
        <button onClick={handleStop}>Stop</button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Current Viseme</h2>
        <div style={{
          background: '#f5f5f5',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '2px solid #ddd',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {currentViseme !== null ? (
            <>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#0078d4' }}>
                {currentViseme}
              </div>
              <div style={{ fontSize: '18px', marginTop: '10px', color: '#666' }}>
                {getVisemeName(currentViseme)}
              </div>
            </>
          ) : (
            <div style={{ color: '#999' }}>No viseme data yet...</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Viseme History</h2>
        <div style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '15px',
          borderRadius: '6px',
          maxHeight: '200px',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          {visemeHistory.length === 0 ? (
            <div style={{ color: '#888' }}>No visemes yet... Start talking!</div>
          ) : (
            visemeHistory.map((v, i) => (
              <div key={i}>
                [{v.offset}ms] Viseme {v.viseme} ({getVisemeName(v.viseme)})
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
