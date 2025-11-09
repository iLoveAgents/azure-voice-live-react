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
import { buildSessionConfig, buildAgentSessionConfig } from '../utils/sessionBuilder';
import { useAudioCapture } from './useAudioCapture';
import { arrayBufferToBase64 } from '../utils/audioHelpers';

/**
 * Utility to get timestamp for logging
 */
const getTimestamp = (): string => {
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
    autoStartMic = true,
    audioSampleRate = 24000,
    audioConstraints,
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
  const isAgentModeRef = useRef<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventQueueRef = useRef<any[]>([]);

  // Keep a stable ref for sendEvent to use in audio capture callback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendEventRef = useRef<(event: any) => void>();

  /**
   * Handle audio data from microphone
   * Converts to base64 and sends to Voice Live API
   */
  const handleAudioData = useCallback((audioData: ArrayBuffer) => {
    const base64Audio = arrayBufferToBase64(audioData);
    if (sendEventRef.current) {
      sendEventRef.current({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      });
    }
  }, []);

  /**
   * Integrate audio capture for microphone input
   */
  const {
    isCapturing: isMicActive,
    startCapture: startMic,
    stopCapture: stopMic,
  } = useAudioCapture({
    sampleRate: audioSampleRate,
    audioConstraints: typeof audioConstraints === 'boolean' ? undefined : audioConstraints,
    onAudioData: handleAudioData,
    autoStart: false, // Manual control - we'll start when session is ready
  });

  /**
   * Send an event to the Voice Live API.
   * Audio events are automatically queued until session is ready.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendEvent = useCallback((event: any) => {
    // Queue audio buffer events until session is ready
    if (event.type === 'input_audio_buffer.append' && !isReady) {
      eventQueueRef.current.push(event);
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Skip logging for verbose events
      const skipSendLogging = [
        'input_audio_buffer.append',
        'conversation.item.create',
        'response.create',
      ];
      if (!skipSendLogging.includes(event.type)) {
        console.log(`[${getTimestamp()}] Sending:`, event.type);
      }
      wsRef.current.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket not connected, cannot send event:', event.type);
    }
  }, [isReady]);

  // Keep sendEventRef up to date
  useEffect(() => {
    sendEventRef.current = sendEvent;
  }, [sendEvent]);

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

    console.log(`[${getTimestamp()}] Audio playback stopped (user interruption)`);
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

      // Connect to MediaStreamDestination for visualization OR directly to speakers
      if (audioStreamDestinationRef.current) {
        // Voice-only mode: connect to MediaStream, component will play it via <audio> element
        source.connect(audioStreamDestinationRef.current);
      } else {
        // Fallback: play directly (shouldn't happen in normal voice-only mode)
        source.connect(audioContext.destination);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        case 'session.created': {
          console.log(`[${getTimestamp()}] Session created`);

          // Send session.update immediately after session.created
          // Don't start audio capture until session is configured
          const sessionConfig = isAgentModeRef.current
            ? buildAgentSessionConfig(session)
            : buildSessionConfig(session);

          console.log(`[${getTimestamp()}] Configuring session...`);
          sendEvent({
            type: 'session.update',
            session: sessionConfig,
          });
          break;
        }

        case 'session.updated':
          console.log(`[${getTimestamp()}] Session configured`);

          // Set up WebRTC after session update (avatar mode)
          if (data.session?.avatar?.ice_servers) {
            console.log(`[${getTimestamp()}] Setting up avatar WebRTC...`);

            const newConfig: RTCConfiguration = {
              iceServers: data.session.avatar.ice_servers,
            };
            const newPc = new RTCPeerConnection(newConfig);
            pcRef.current = newPc;

            // Handle incoming tracks
            newPc.ontrack = (event) => {
              if (event.track.kind === 'video') {
                console.log(`[${getTimestamp()}] Video stream connected`);
                setVideoStream(event.streams[0] || null);
              } else if (event.track.kind === 'audio') {
                console.log(`[${getTimestamp()}] Audio stream connected`);
                setAudioStream(event.streams[0] || null);
              }
            };

            // Log connection state changes
            newPc.oniceconnectionstatechange = () => {
              if (newPc.iceConnectionState === 'connected') {
                console.log(`[${getTimestamp()}] ICE connected`);
              } else if (newPc.iceConnectionState === 'failed') {
                console.log(`[${getTimestamp()}] ICE connection failed`);
                setError('ICE connection failed');
              }
            };

            newPc.onconnectionstatechange = () => {
              if (newPc.connectionState === 'connected') {
                console.log(`[${getTimestamp()}] WebRTC connected`);
              } else if (newPc.connectionState === 'failed') {
                console.log(`[${getTimestamp()}] WebRTC connection failed`);
                setError('WebRTC connection failed');
              }
            };

            newPc.onicecandidate = (event) => {
              if (!event.candidate) {
                console.log(`[${getTimestamp()}] ICE gathering complete`);
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
              console.log(`[${getTimestamp()}] Avatar connection request sent`);
            }
          } else {
            // Voice-only mode (no avatar) - session is ready immediately
            console.log(`[${getTimestamp()}] Voice-only session ready`);
            setIsReady(true);
            
            // Flush queued audio events
            if (eventQueueRef.current.length > 0) {
              console.log(`[${getTimestamp()}] Flushing ${eventQueueRef.current.length} queued audio events`);
              eventQueueRef.current.forEach((event) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify(event));
                }
              });
              eventQueueRef.current = [];
            }
          }
          break;

        case 'session.avatar.connecting':
          if (data.server_sdp && pcRef.current) {
            const decodedSdp = atob(data.server_sdp);
            const remoteDesc = JSON.parse(decodedSdp);
            await pcRef.current.setRemoteDescription(remoteDesc);
            console.log(`[${getTimestamp()}] Avatar WebRTC established`);
            setIsReady(true);
            
            // Flush queued audio events
            if (eventQueueRef.current.length > 0) {
              console.log(`[${getTimestamp()}] Flushing ${eventQueueRef.current.length} queued audio events`);
              eventQueueRef.current.forEach((event) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify(event));
                }
              });
              eventQueueRef.current = [];
            }
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
          console.log(`[${getTimestamp()}] User speaking (interrupting)...`);
          // Microsoft's official pattern for WebSocket barge-in:
          // Stop client-side audio playback immediately
          // Server handles truncation with auto_truncate: true
          stopAudioPlayback();
          break;

        case 'input_audio_buffer.speech_stopped':
          console.log(`[${getTimestamp()}] User stopped speaking`);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          console.log(`[${getTimestamp()}] User said: "${data.transcript}"`);
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
            console.log(`[${getTimestamp()}] Assistant: "${data.transcript}"`);
          }
          break;

        case 'response.function_call_arguments.done':
          if (toolExecutor) {
            toolExecutor(data.name, data.arguments, data.call_id);
          }
          break;

        case 'error':
          console.error(`[${getTimestamp()}] API Error:`, data.error);
          setError(data.error?.message || 'Unknown API error');
          break;
      }
    },
    [onEvent, sendEvent, toolExecutor, playAudioChunk, stopAudioPlayback, videoStream, session]
  );

  /**
   * Connect to Voice Live API
   */
  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnectionState('connecting');

      // Build WebSocket URL
      let wsUrl: string;
      let isAgentMode = false;

      // Proxy mode: use proxy URL if provided
      if (connection.proxyUrl) {
        wsUrl = connection.proxyUrl;
        // Detect agent mode from URL parameters
        isAgentMode = wsUrl.includes('mode=agent');
        isAgentModeRef.current = isAgentMode;
        console.log(`[${getTimestamp()}] Connecting via proxy...`);
        console.log(`[${getTimestamp()}] URL: ${wsUrl.replace(/token=[^&]+/, 'token=***')}`);
        console.log(`[${getTimestamp()}] Mode: ${isAgentMode ? 'Agent Service' : 'Standard (Voice/Avatar)'}`);
      } else {
        // Direct connection mode
        const projectIdentifier = connection.projectName || connection.projectId;
        isAgentMode = !!(connection.agentId && projectIdentifier);
        isAgentModeRef.current = isAgentMode;

        if (isAgentMode) {
          // Agent Service mode - per Azure docs: use agent-id and agent-project-name
          wsUrl = `wss://${connection.resourceName}.services.ai.azure.com/voice-live/realtime?api-version=${
            connection.apiVersion || '2025-10-01'
          }&agent-id=${connection.agentId}&agent-project-name=${projectIdentifier}`;

          // Agent Service authentication: ONLY agent-access-token query parameter
          // Note: API key auth is explicitly NOT supported in Agent mode (server returns error)
          // Browser limitation: Can't set Authorization header, so token must go in query param
          if (connection.agentAccessToken) {
            wsUrl += `&agent-access-token=${encodeURIComponent(connection.agentAccessToken)}`;
          } else {
            throw new Error('agentAccessToken is required for Agent Service mode.');
          }
        } else {
          // Standard mode with model
          const model = connection.model || 'gpt-realtime'; // Default to best quality
          wsUrl = `wss://${connection.resourceName}.services.ai.azure.com/voice-live/realtime?api-version=${
            connection.apiVersion || '2025-10-01'
          }&model=${model}`;

          // Standard mode authentication: use api-key
          if (connection.apiKey) {
            wsUrl += `&api-key=${encodeURIComponent(connection.apiKey)}`;
          }
          // Note: Token auth via Authorization header would need different WebSocket setup
        }

        console.log(`[${getTimestamp()}] Connecting to Voice Live API...`);
        console.log(`[${getTimestamp()}] URL: ${wsUrl.replace(/api-key=[^&]+/, 'api-key=***').replace(/agent-access-token=[^&]+/, 'agent-access-token=***')}`);
        if (isAgentMode) {
          console.log(`[${getTimestamp()}] Agent: ${connection.agentId}, Project: ${projectIdentifier}`);
        } else {
          console.log(`[${getTimestamp()}] Model: ${connection.model || 'gpt-realtime'}`);
        }
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[${getTimestamp()}] WebSocket connected`);
        setConnectionState('connected');

        // Initialize AudioContext early on connection
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 24000 });
          console.log(`[${getTimestamp()}] AudioContext created`);
        }

        // Create MediaStreamDestination only for voice-only mode (not avatar)
        if (!audioStreamDestinationRef.current && !session?.avatar) {
          audioStreamDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
          setAudioStream(audioStreamDestinationRef.current.stream);
          console.log(`[${getTimestamp()}] Audio visualization stream created`);
        }

        // Don't send session.update yet - wait for session.created from Azure
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error(`[${getTimestamp()}] WebSocket error:`, error);
        setError('WebSocket connection error');
        setConnectionState('error');
      };

      ws.onclose = (event) => {
        console.log(`[${getTimestamp()}] WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}, Clean: ${event.wasClean}`);
        if (!event.wasClean) {
          console.error(`[${getTimestamp()}] WebSocket closed unexpectedly!`);
        }
        setConnectionState('disconnected');
        setIsReady(false);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      console.error(`[${getTimestamp()}] Connection error:`, err);
      setError(errorMessage);
      setConnectionState('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connection,
    session,
    handleMessage,
  ]);

  /**
   * Disconnect from Voice Live API
   */
  const disconnect = useCallback(() => {
    console.log(`[${getTimestamp()}] Disconnecting...`);

    // Stop microphone capture
    stopMic();

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
  }, [stopMic]);

  // Auto-connect if requested
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [autoConnect, connect]);

  // Auto-start microphone when session is ready
  useEffect(() => {
    if (isReady && autoStartMic && !isMicActive) {
      console.log(`[${getTimestamp()}] Starting microphone...`);
      startMic().catch((err) => {
        console.error(`[${getTimestamp()}] Microphone error:`, err);
      });
    }
  }, [isReady, autoStartMic, isMicActive, startMic]);

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
    isMicActive,
    error,
    connect,
    disconnect,
    startMic,
    stopMic,
    sendEvent,
    updateSession,
    getAudioPlaybackTime,
  };
}
