import { useRef, useEffect, useState } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig , createAudioDataCallback } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function FunctionCalling() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Define tools
  const tools = [
    {
      type: 'function' as const,
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name or location',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'Temperature unit',
          },
        },
        required: ['location'],
      },
    },
    {
      type: 'function' as const,
      name: 'get_time',
      description: 'Get the current time',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  ];

  // Tool executor
  const toolExecutor = useCallback((toolName: string, args: string, callId: string) => {
    addLog(`🔧 Tool called: ${toolName}`);
    addLog(`📥 Args: ${args}`);

    let result: any;

    try {
      const parsedArgs = JSON.parse(args);

      // Execute tool
      if (toolName === 'get_weather') {
        result = {
          location: parsedArgs.location,
          temperature: Math.floor(Math.random() * 30) + 10,
          unit: parsedArgs.unit || 'celsius',
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Windy'][Math.floor(Math.random() * 4)],
        };
      } else if (toolName === 'get_time') {
        result = {
          time: new Date().toLocaleTimeString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      } else {
        result = { error: 'Unknown tool' };
      }

      addLog(`✅ Result: ${JSON.stringify(result)}`);

      // Send result back to API
      sendEventRef.current({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(result),
        },
      });

      // Trigger response generation
      sendEventRef.current({
        type: 'response.create',
      });
    } catch (err) {
      addLog(`❌ Error: ${err}`);
    }
  }, []);

  const sendEventRef = useRef<(event: any) => void>(() => {});

  const config = createVoiceLiveConfig({
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: {
      instructions: 'You are a helpful assistant. When the user asks about weather or time, use the available tools.',
      tools,
      toolChoice: 'auto',
    },
  });

  const { connect, disconnect, connectionState, sendEvent, audioStream } = useVoiceLive({
    ...config,
    toolExecutor,
  });

  sendEventRef.current = sendEvent;

  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: createAudioDataCallback(sendEvent),
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

  const handleStart = async () => {
    addLog('Starting...');
    try {
      await connect();
      addLog('Connected');
      await startCapture();
      addLog('Mic started');
    } catch (err) {
      addLog(`Error: ${err}`);
    }
  };

  const handleStop = async () => {
    await stopCapture();
    disconnect();
    addLog('Stopped');
  };

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Function Calling Example</h1>
      <p>Status: {connectionState}</p>

      <div>
        <button onClick={handleStart} disabled={connectionState === 'connected'}>Start</button>
        <button onClick={handleStop} disabled={connectionState !== 'connected'}>Stop</button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Available Tools</h2>
        <ul>
          <li><strong>get_weather</strong> - Get weather for a location</li>
          <li><strong>get_time</strong> - Get current time</li>
        </ul>

        <p style={{ marginTop: '20px' }}>
          <strong>Try saying:</strong> "What's the weather in London?" or "What time is it?"
        </p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Tool Call Logs</h2>
        <div style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '15px',
          borderRadius: '6px',
          maxHeight: '300px',
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '13px',
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#888' }}>No tool calls yet...</div>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
      </div>

      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
    </div>
  );
}
