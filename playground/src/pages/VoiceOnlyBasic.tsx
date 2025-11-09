import { useRef, useEffect } from 'react';
import { useVoiceLive, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

/**
 * VoiceOnlyBasic - Simple voice chat example
 *
 * Demonstrates basic voice-only conversation with Azure Voice Live API.
 * Microphone automatically starts when the session is ready (autoStartMic: true by default).
 * No need to manually manage audio capture!
 */
export function VoiceOnlyBasic(): JSX.Element {
  // Create Voice Live configuration
  const config = createVoiceLiveConfig({
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    }
  });

  // Voice Live hook - mic capture is integrated and auto-starts!
  const { connect, disconnect, connectionState, audioStream } = useVoiceLive(config);

  // Ref for audio playback
  const audioRef = useRef<HTMLAudioElement>(null);

  // Set up audio playback when stream becomes available
  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

  const handleStart = async (): Promise<void> => {
    try {
      // Just connect - mic will auto-start when session is ready!
      await connect();
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = (): void => {
    // Disconnect also stops the mic automatically
    disconnect();
  };

  const isConnected = connectionState === 'connected';

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Voice Chat - Simple</h1>
      <p>Status: {connectionState}</p>
      <div>
        <button onClick={handleStart} disabled={isConnected}>Start</button>
        <button onClick={handleStop} disabled={!isConnected}>Stop</button>
      </div>
      {/* Hidden audio element for playing assistant responses */}
      <audio ref={audioRef} autoPlay hidden />
    </div>
  );
}
