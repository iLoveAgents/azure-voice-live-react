/**
 * useVoiceLive Hook - Comprehensive Implementation
 *
 * React hook for Azure Voice Live API with full parameter support.
 * Supports all Voice Live features with sensible defaults.
 *
 * @example
 * ```tsx
 * // Simple usage with defaults
 * const { connectionState, videoStream, connect } = useVoiceLive({
 *   connection: {
 *     resourceName: 'my-resource',
 *     apiKey: 'xxx',
 *   },
 * });
 *
 * // Advanced usage with full config
 * const api = useVoiceLive({
 *   connection: {
 *     resourceName: 'my-resource',
 *     apiKey: 'xxx',
 *     model: 'gpt-4o', // or any model
 *   },
 *   session: {
 *     instructions: 'You are helpful',
 *     voice: {
 *       name: 'en-US-Ava:DragonHDLatestNeural',
 *       type: 'azure-standard',
 *       temperature: 0.9,
 *       rate: '1.2',
 *     },
 *     turnDetection: {
 *       type: 'azure_semantic_vad',
 *       removeFillerWords: true,
 *       endOfUtteranceDetection: {
 *         model: 'semantic_detection_v1',
 *       },
 *     },
 *     avatar: {
 *       character: 'lisa',
 *       style: 'casual-sitting',
 *     },
 *   },
 *   toolExecutor: (name, args, id) => {},
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  UseVoiceLiveConfig,
  UseVoiceLiveReturn,
} from '../types/voiceLive';
import { buildSessionConfig } from '../utils/sessionBuilder';

/**
 * Utility to get timestamp for logging
 */
const getTimestamp = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now
    .getMilliseconds()
    .toString()
    .padStart(3, '0')}`;
};

/**
 * Hook for Azure Voice Live API integration
 * Supports all Voice Live parameters with best-practice defaults
 */
export function useVoiceLive(config: UseVoiceLiveConfig): UseVoiceLiveReturn {
  const {
    connection,
    session,
    autoConnect = false,
    onEvent,
    toolExecutor,
  } = config;

  const [connectionState, setConnectionState] = useState<UseVoiceLiveReturn['connectionState']>('disconnected');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);
  const currentResponseIdRef = useRef<string | null>(null);
  const responseStartTimeRef = useRef<number | null>(null);
  const isFirstChunkRef = useRef<boolean>(true);

  /**
   * Send an event to the Voice Live API
   */
  const sendEvent = useCallback((event: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Skip logging for verbose events
      const skipSendLogging = [
        'input_audio_buffer.append',
        'conversation.item.create',
        'response.create',
      ];
      if (!skipSendLogging.includes(event.type)) {
        console.log(`[${getTimestamp()}] ⬆️ Sending:`, event.type);
      }
      wsRef.current.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, cannot send event:', event.type);
    }
  }, []);

  /**
   * Update session configuration
   */
  const updateSession = useCallback(
    (partialSession: Partial<typeof session>) => {
      const updatedSession = buildSessionConfig({
        ...session,
        ...partialSession,
      });

      sendEvent({
        type: 'session.update',
        session: updatedSession,
      });
    },
    [session, sendEvent]
  );

  /**
   * Stop all audio playback immediately (for interruptions/barge-in)
   * Following Microsoft's WebSocket interruption pattern
   */
  const stopAudioPlayback = useCallback(() => {
    // Stop all scheduled audio sources
    audioQueueRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source may have already stopped naturally
      }
    });
    audioQueueRef.current = [];

    // Reset playback scheduling
    nextPlayTimeRef.current = 0;

    console.log(`[${getTimestamp()}] 🛑 Audio playback stopped (user interruption)`);
  }, []);

  /**
   * Play audio chunk for voice-only mode with proper sequential scheduling
   * Following Microsoft Azure Voice Live API and OpenAI Realtime API patterns
   */
  const playAudioChunk = useCallback((base64Audio: string) => {
    try {
      // Initialize AudioContext if needed (24kHz for Azure Voice Live API)
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        nextPlayTimeRef.current = 0;
      }

      const audioContext = audioContextRef.current;

      // Decode base64 to PCM16 (following Microsoft's pattern)
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32 for Web Audio API
      // PCM16 range: -32768 to 32767 → Float32 range: -1.0 to 1.0
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        const sample = pcm16[i];
        if (sample !== undefined) {
          float32[i] = sample / 32768.0;
        }
      }

      // Create AudioBuffer (mono channel, 24kHz sample rate)
      const audioBuffer = audioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      // Calculate scheduled play time for sequential playback
      const currentTime = audioContext.currentTime;
      const scheduleTime = Math.max(currentTime, nextPlayTimeRef.current);

      // Track response start time (for viseme synchronization)
      if (isFirstChunkRef.current) {
        responseStartTimeRef.current = scheduleTime;
        isFirstChunkRef.current = false;
      }

      // Create and schedule audio source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // Also connect to MediaStreamDestination for visualization
      if (audioStreamDestinationRef.current) {
        source.connect(audioStreamDestinationRef.current);
      }

      source.start(scheduleTime);

      // Update next play time to maintain continuous playback without gaps
      nextPlayTimeRef.current = scheduleTime + audioBuffer.duration;

      // Track for cleanup
      audioQueueRef.current.push(source);
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  }, []);

  /**
   * Handle WebSocket messages
   */
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const data: any = JSON.parse(event.data);

      // Skip verbose event logging
      const skipLogging = [
        'response.audio.delta',
        'response.audio_transcript.delta',
        'response.text.delta',
        'response.audio.done',
        'response.content_part.added',
        'response.content_part.done',
        'response.output_item.done',
        'conversation.item.created',
        'response.created',
        'response.function_call_arguments.delta',
        'response.output_item.added',
        'response.animation_viseme.delta',
        'response.audio_timestamp.delta',
      ];

      if (!skipLogging.includes(data.type)) {
        console.log(`[${getTimestamp()}]`, data.type);
      }

      // Call custom event handler if provided
      if (onEvent) {
        onEvent(data);
      }

      // Handle specific events
      switch (data.type) {
        case 'session.created':
          console.log(`[${getTimestamp()}] ✅ Session created`);
          break;

        case 'session.updated':
          console.log(`[${getTimestamp()}] ✅ Session configured`);

          // Set up WebRTC after session update
          if (data.session?.avatar?.ice_servers) {
            console.log(`[${getTimestamp()}] 🎥 Setting up avatar WebRTC...`);

            const newConfig: RTCConfiguration = {
              iceServers: data.session.avatar.ice_servers,
            };
            const newPc = new RTCPeerConnection(newConfig);
            pcRef.current = newPc;

            // Handle incoming tracks
            newPc.ontrack = (event) => {
              if (event.track.kind === 'video') {
                console.log(`[${getTimestamp()}] 🎥 Video stream connected`);
                setVideoStream(event.streams[0] || null);
              } else if (event.track.kind === 'audio') {
                console.log(`[${getTimestamp()}] 🔊 Audio stream connected`);
                setAudioStream(event.streams[0] || null);
              }
            };

            // Log connection state changes
            newPc.oniceconnectionstatechange = () => {
              if (newPc.iceConnectionState === 'connected') {
                console.log(`[${getTimestamp()}] ✅ ICE connected`);
              } else if (newPc.iceConnectionState === 'failed') {
                console.log(`[${getTimestamp()}] ❌ ICE connection failed`);
                setError('ICE connection failed');
              }
            };

            newPc.onconnectionstatechange = () => {
              if (newPc.connectionState === 'connected') {
                console.log(`[${getTimestamp()}] ✅ WebRTC connected`);
              } else if (newPc.connectionState === 'failed') {
                console.log(`[${getTimestamp()}] ❌ WebRTC connection failed`);
                setError('WebRTC connection failed');
              }
            };

            newPc.onicecandidate = (event) => {
              if (!event.candidate) {
                console.log(`[${getTimestamp()}] ✅ ICE gathering complete`);
              }
            };

            // Add transceivers
            newPc.addTransceiver('video', { direction: 'recvonly' });
            newPc.addTransceiver('audio', { direction: 'recvonly' });

            // Create offer
            const offer = await newPc.createOffer();
            await newPc.setLocalDescription(offer);

            // Wait for ICE gathering
            await new Promise<void>((resolve) => {
              if (newPc.iceGatheringState === 'complete') {
                resolve();
              } else {
                newPc.addEventListener('icegatheringstatechange', () => {
                  if (newPc.iceGatheringState === 'complete') {
                    resolve();
                  }
                });
              }
            });

            // Send avatar connect event
            const localDesc = newPc.localDescription;
            if (localDesc) {
              const encodedSdp = btoa(JSON.stringify(localDesc));
              sendEvent({
                type: 'session.avatar.connect',
                client_sdp: encodedSdp,
              });
              console.log(`[${getTimestamp()}] 🎥 Avatar connection request sent`);
            }
          }
          break;

        case 'session.avatar.connecting':
          if (data.server_sdp && pcRef.current) {
            const decodedSdp = atob(data.server_sdp);
            const remoteDesc = JSON.parse(decodedSdp);
            await pcRef.current.setRemoteDescription(remoteDesc);
            console.log(`[${getTimestamp()}] ✅ Avatar WebRTC established`);
            setIsReady(true);
          }
          break;

        case 'response.created':
          // Track current response for interruption handling
          if (data.response?.id) {
            currentResponseIdRef.current = data.response.id;
            // Reset for new response (for viseme sync)
            isFirstChunkRef.current = true;
            responseStartTimeRef.current = null;
          }
          break;

        case 'input_audio_buffer.speech_started':
          console.log(`[${getTimestamp()}] 🎤 User speaking (interrupting)...`);
          // Microsoft's official pattern for WebSocket barge-in:
          // Stop client-side audio playback immediately
          // Server handles truncation with auto_truncate: true
          stopAudioPlayback();
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log(`[${getTimestamp()}] 🎤 User stopped speaking`);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log(`[${getTimestamp()}] 📝 User said: "${data.transcript}"`);
          break;

        case 'response.audio.delta':
          // Play audio for voice-only mode (no avatar)
          // Only play if this is the current response (not interrupted)
          if (data.delta && !videoStream && data.response_id === currentResponseIdRef.current) {
            playAudioChunk(data.delta);
          }
          break;

        case 'response.audio.done':
          // Reset playback scheduling for next response
          if (data.response_id === currentResponseIdRef.current) {
            nextPlayTimeRef.current = 0;
          }
          break;

        case 'response.audio_transcript.done':
          if (data.transcript) {
            console.log(`[${getTimestamp()}] 💬 Assistant: "${data.transcript}"`);
          }
          break;

        case 'response.function_call_arguments.done':
          if (toolExecutor) {
            toolExecutor(data.name, data.arguments, data.call_id);
          }
          break;

        case 'error':
          console.error(`[${getTimestamp()}] ❌ API Error:`, data.error);
          setError(data.error?.message || 'Unknown API error');
          break;
      }
    },
    [onEvent, sendEvent, toolExecutor, playAudioChunk, stopAudioPlayback, videoStream]
  );

  /**
   * Connect to Voice Live API
   */
  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState('connecting');

      // Build WebSocket URL
      const isAgentMode = !!(connection.agentId && connection.projectId);
      let wsUrl: string;

      if (isAgentMode) {
        // Agent Service mode
        wsUrl = `wss://${connection.resourceName}.services.ai.azure.com/voice-live/realtime?api-version=${
          connection.apiVersion || '2025-10-01'
        }&agent_id=${connection.agentId}&project_id=${connection.projectId}`;
      } else {
        // Standard mode with model
        const model = connection.model || 'gpt-realtime'; // Default to best quality
        wsUrl = `wss://${connection.resourceName}.services.ai.azure.com/voice-live/realtime?api-version=${
          connection.apiVersion || '2025-10-01'
        }&model=${model}`;
      }

      // Add authentication
      if (connection.apiKey) {
        wsUrl += `&api-key=${encodeURIComponent(connection.apiKey)}`;
      }
      // Note: Token auth via Authorization header would need different WebSocket setup

      console.log(`[${getTimestamp()}] 🔌 Connecting to Voice Live API...`);
      console.log(`[${getTimestamp()}] 📦 Model: ${connection.model || 'gpt-realtime'}`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[${getTimestamp()}] ✅ WebSocket connected`);
        setConnectionState('connected');

        // Initialize AudioContext early on connection
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 24000 });
          console.log(`[${getTimestamp()}] 🔊 AudioContext created`);
        }

        // Create MediaStreamDestination only for voice-only mode (not avatar)
        if (!audioStreamDestinationRef.current && !session?.avatar) {
          audioStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
          setAudioStream(audioStreamDestinationRef.current.stream);
          console.log(`[${getTimestamp()}] 📊 Audio visualization stream created`);
        }

        // Build session configuration using session builder
        const sessionUpdate = buildSessionConfig(session);

        console.log(`[${getTimestamp()}] 🔧 Configuring session...`);
        sendEvent({
          type: 'session.update',
          session: sessionUpdate,
        });
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error(`[${getTimestamp()}] ❌ WebSocket error:`, error);
        setError('WebSocket connection error');
        setConnectionState('error');
      };

      ws.onclose = () => {
        console.log(`[${getTimestamp()}] 🔌 WebSocket closed`);
        setConnectionState('disconnected');
        setIsReady(false);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      console.error(`[${getTimestamp()}] ❌ Connection error:`, err);
      setError(errorMessage);
      setConnectionState('error');
    }
  }, [
    connection,
    session,
    sendEvent,
    handleMessage,
  ]);

  /**
   * Disconnect from Voice Live API
   */
  const disconnect = useCallback(() => {
    console.log(`[${getTimestamp()}] 🔌 Disconnecting...`);

    // Stop any playing audio
    audioQueueRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    audioQueueRef.current = [];

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    nextPlayTimeRef.current = 0;

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setVideoStream(null);
    setAudioStream(null);
    setIsReady(false);
    setConnectionState('disconnected');
  }, []);

  // Auto-connect if requested
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [autoConnect, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  /**
   * Get current audio playback time in milliseconds
   * Used for synchronizing visemes with audio playback
   */
  const getAudioPlaybackTime = useCallback((): number | null => {
    if (!audioContextRef.current || responseStartTimeRef.current === null) {
      return null;
    }
    const elapsed = audioContextRef.current.currentTime - responseStartTimeRef.current;
    return Math.max(0, elapsed * 1000); // Convert to milliseconds
  }, []);

  return {
    connectionState,
    videoStream,
    audioStream,
    audioContext: audioContextRef.current,
    isReady,
    error,
    connect,
    disconnect,
    sendEvent,
    updateSession,
    getAudioPlaybackTime,
  };
}
