/**
 * Voice Live API Configuration Presets
 *
 * Pre-configured settings for common use cases.
 * Each preset is optimized for specific scenarios based on Microsoft's recommendations.
 *
 * @example
 * ```tsx
 * import { VOICE_LIVE_PRESETS, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
 *
 * // Use a preset directly
 * const config = createVoiceLiveConfig('callCenter', {
 *   connection: { resourceName: 'my-resource', apiKey: 'xxx' },
 * });
 *
 * // Or merge presets
 * const customConfig = {
 *   ...VOICE_LIVE_PRESETS.callCenter,
 *   session: {
 *     ...VOICE_LIVE_PRESETS.callCenter.session,
 *     instructions: 'Custom instructions',
 *   },
 * };
 * ```
 */

import type { VoiceLiveSessionConfig } from '../types/voiceLive';

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Default preset - Best quality with balanced settings
 *
 * Use for: General-purpose voice assistants
 * Model: gpt-realtime (best quality)
 * Features: All enhancements enabled, balanced responsiveness
 */
export const DEFAULT_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Let defaults from session builder apply
  // This gives you gpt-realtime + azure_semantic_vad + all enhancements
};

/**
 * Call Center preset
 *
 * Use for: Customer support, help desk, service agents
 * Optimized for: Clear audio in noisy environments, barge-in support
 * Features:
 * - Maximum noise suppression
 * - Echo cancellation (for speaker playback)
 * - Filler word removal (reduces false barge-ins)
 * - Interruption support
 */
export const CALL_CENTER_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Input audio: Maximum quality for noisy environments
  inputAudioSamplingRate: 24000,
  inputAudioEchoCancellation: {
    type: 'server_echo_cancellation',
  },
  inputAudioNoiseReduction: {
    type: 'azure_deep_noise_suppression',
  },

  // Turn detection: Fast, responsive with barge-in
  turnDetection: {
    type: 'azure_semantic_vad',
    threshold: 0.5,
    prefixPaddingMs: 300,
    speechDurationMs: 80,
    silenceDurationMs: 400, // Slightly faster response
    removeFillerWords: true, // Critical for reducing false barge-ins
    interruptResponse: true, // Allow customer to interrupt
    createResponse: true,
    autoTruncate: true,
    endOfUtteranceDetection: {
      model: 'semantic_detection_v1',
      thresholdLevel: 'medium',
      timeoutMs: 800, // Slightly faster
    },
  },

  // Voice: Clear, professional
  temperature: 0.7, // Slightly less variable for consistency
};

/**
 * Automotive Assistant preset
 *
 * Use for: In-car voice assistants, hands-free controls
 * Optimized for: Far-field microphones, road noise
 * Features:
 * - Far-field noise reduction
 * - Patient turn detection (driver shouldn't be interrupted)
 * - Natural pauses allowed
 */
export const AUTOMOTIVE_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Input audio: Far-field optimization
  inputAudioSamplingRate: 24000,
  inputAudioNoiseReduction: {
    type: 'azure_deep_noise_suppression',
  },

  // Turn detection: Patient, allows natural pauses
  turnDetection: {
    type: 'azure_semantic_vad',
    threshold: 0.6, // Higher threshold for road noise
    prefixPaddingMs: 400, // More padding for far-field
    speechDurationMs: 100,
    silenceDurationMs: 700, // Longer silence for natural pauses
    removeFillerWords: false, // Allow natural speech patterns
    interruptResponse: false, // Don't interrupt while driving
    createResponse: true,
    endOfUtteranceDetection: {
      model: 'semantic_detection_v1',
      thresholdLevel: 'low', // More patient
      timeoutMs: 1200,
    },
  },

  // Voice: Clear, slightly louder/energetic
  temperature: 0.8,
};

/**
 * Education/Tutor preset
 *
 * Use for: Learning companions, tutors, training assistants
 * Optimized for: Patient listening, thoughtful responses
 * Features:
 * - Very patient turn detection
 * - No interruptions (let student think)
 * - Natural conversation flow
 */
export const EDUCATION_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Input audio: Standard quality
  inputAudioSamplingRate: 24000,
  inputAudioEchoCancellation: {
    type: 'server_echo_cancellation',
  },
  inputAudioNoiseReduction: {
    type: 'azure_deep_noise_suppression',
  },

  // Turn detection: Very patient, no interruptions
  turnDetection: {
    type: 'azure_semantic_vad',
    threshold: 0.4, // Lower threshold (more sensitive)
    prefixPaddingMs: 400,
    speechDurationMs: 80,
    silenceDurationMs: 900, // Very long silence allowed (student thinking)
    removeFillerWords: false, // Allow natural student speech
    interruptResponse: false, // Never interrupt the student
    createResponse: true,
    endOfUtteranceDetection: {
      model: 'semantic_detection_v1',
      thresholdLevel: 'low', // Very patient
      timeoutMs: 1500, // Long timeout for thinking
    },
  },

  // Voice: Warm, encouraging
  temperature: 0.8,
};

/**
 * Gaming/Interactive preset
 *
 * Use for: Game NPCs, interactive experiences
 * Optimized for: Low latency, quick responses
 * Features:
 * - Fast turn detection
 * - Quick responses
 * - Interactive feel
 */
export const GAMING_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Input audio: Standard
  inputAudioSamplingRate: 24000,
  inputAudioNoiseReduction: {
    type: 'azure_deep_noise_suppression',
  },

  // Turn detection: Fast, responsive
  turnDetection: {
    type: 'azure_semantic_vad',
    threshold: 0.5,
    prefixPaddingMs: 200, // Minimal padding
    speechDurationMs: 60, // Quick detection
    silenceDurationMs: 300, // Short silence
    removeFillerWords: true,
    interruptResponse: true,
    createResponse: true,
    endOfUtteranceDetection: {
      model: 'semantic_detection_v1',
      thresholdLevel: 'high', // Quick decisions
      timeoutMs: 600, // Fast timeout
    },
  },

  // Voice: Energetic, variable
  temperature: 0.9,
};

/**
 * Accessibility preset
 *
 * Use for: Assistive technologies, accessibility tools
 * Optimized for: Clear speech, slower pace, very patient
 * Features:
 * - Crystal clear audio
 * - Slower speaking rate
 * - Very patient listening
 * - No interruptions
 */
export const ACCESSIBILITY_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Input audio: Maximum quality
  inputAudioSamplingRate: 24000,
  inputAudioEchoCancellation: {
    type: 'server_echo_cancellation',
  },
  inputAudioNoiseReduction: {
    type: 'azure_deep_noise_suppression',
  },

  // Turn detection: Very patient
  turnDetection: {
    type: 'azure_semantic_vad',
    threshold: 0.3, // Very sensitive
    prefixPaddingMs: 500,
    speechDurationMs: 80,
    silenceDurationMs: 1000, // Very long silence
    removeFillerWords: false,
    interruptResponse: false, // Never interrupt
    createResponse: true,
    endOfUtteranceDetection: {
      model: 'semantic_detection_v1',
      thresholdLevel: 'low', // Very patient
      timeoutMs: 2000, // Very long timeout
    },
  },

  // Voice: Clear, slower pace
  voice: {
    name: 'en-US-Ava:DragonHDLatestNeural',
    type: 'azure-standard',
    temperature: 0.6, // Very consistent
    rate: '0.9', // Slightly slower
  },
};

/**
 * Multi-language preset
 *
 * Use for: International applications, multi-language support
 * Optimized for: Multiple languages, global use
 * Features:
 * - Multilingual VAD
 * - Support for major languages
 */
export const MULTILINGUAL_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Input audio: Standard
  inputAudioSamplingRate: 24000,
  inputAudioEchoCancellation: {
    type: 'server_echo_cancellation',
  },
  inputAudioNoiseReduction: {
    type: 'azure_deep_noise_suppression',
  },

  // Turn detection: Multilingual VAD
  turnDetection: {
    type: 'azure_semantic_vad_multilingual',
    threshold: 0.5,
    prefixPaddingMs: 300,
    speechDurationMs: 80,
    silenceDurationMs: 500,
    removeFillerWords: true,
    languages: ['en', 'es', 'fr', 'de', 'it', 'ja', 'pt', 'zh', 'ko', 'hi'],
    interruptResponse: true,
    createResponse: true,
    endOfUtteranceDetection: {
      model: 'semantic_detection_v1_multilingual',
      thresholdLevel: 'default',
      timeoutMs: 1000,
    },
  },

  // Voice: Standard
  temperature: 0.8,
};

/**
 * High Performance preset
 *
 * Use for: When cost/performance matters more than quality
 * Model: gpt-realtime-mini (Basic tier)
 * Features: Faster, cheaper, still good quality
 */
export const HIGH_PERFORMANCE_PRESET: Partial<VoiceLiveSessionConfig> = {
  // Lighter audio processing
  inputAudioSamplingRate: 16000, // Lower sample rate
  inputAudioNoiseReduction: {
    type: 'near_field', // Lighter processing
  },

  // Fast turn detection
  turnDetection: {
    type: 'server_vad', // Simpler VAD
    threshold: 0.5,
    prefixPaddingMs: 200,
    silenceDurationMs: 300,
    createResponse: true,
  },

  // Standard voice
  temperature: 0.8,
};

/**
 * All presets exported as a constant object
 */
export const VOICE_LIVE_PRESETS = {
  default: DEFAULT_PRESET,
  callCenter: CALL_CENTER_PRESET,
  automotive: AUTOMOTIVE_PRESET,
  education: EDUCATION_PRESET,
  gaming: GAMING_PRESET,
  accessibility: ACCESSIBILITY_PRESET,
  multilingual: MULTILINGUAL_PRESET,
  highPerformance: HIGH_PERFORMANCE_PRESET,
} as const;

/**
 * Preset names type for better autocomplete
 */
export type PresetName = keyof typeof VOICE_LIVE_PRESETS;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Deep merge helper for configurations
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === null || sourceValue === undefined) {
      continue;
    }

    if (
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue) &&
      targetValue !== null
    ) {
      (result as any)[key] = deepMerge(targetValue, sourceValue);
    } else {
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Create a Voice Live config from a preset with custom overrides
 *
 * @param preset - Preset name or preset object
 * @param overrides - Custom configuration to merge
 * @returns Complete configuration ready for useVoiceLive
 *
 * @example
 * ```tsx
 * const config = createVoiceLiveConfig('callCenter', {
 *   connection: { resourceName: 'my-resource', apiKey: 'xxx' },
 *   session: { instructions: 'You are a support agent' },
 * });
 * ```
 */
export function createVoiceLiveConfig(
  preset: PresetName | Partial<VoiceLiveSessionConfig>,
  overrides: {
    connection?: any;
    session?: Partial<VoiceLiveSessionConfig>;
    toolExecutor?: any;
    autoConnect?: boolean;
    onEvent?: any;
  } = {}
): any {
  // Get preset
  const presetConfig =
    typeof preset === 'string' ? VOICE_LIVE_PRESETS[preset] : preset;

  // Merge session configs
  const mergedSession = overrides.session
    ? deepMerge(presetConfig, overrides.session)
    : presetConfig;

  return {
    connection: overrides.connection,
    session: mergedSession,
    toolExecutor: overrides.toolExecutor,
    autoConnect: overrides.autoConnect,
    onEvent: overrides.onEvent,
  };
}

/**
 * Quick helper to create call center config
 */
export function createCallCenterConfig(connection: any, overrides: any = {}) {
  return createVoiceLiveConfig('callCenter', {
    connection,
    ...overrides,
  });
}

/**
 * Quick helper to create automotive config
 */
export function createAutomotiveConfig(connection: any, overrides: any = {}) {
  return createVoiceLiveConfig('automotive', {
    connection,
    ...overrides,
  });
}

/**
 * Quick helper to create education config
 */
export function createEducationConfig(connection: any, overrides: any = {}) {
  return createVoiceLiveConfig('education', {
    connection,
    ...overrides,
  });
}

/**
 * Quick helper to create gaming config
 */
export function createGamingConfig(connection: any, overrides: any = {}) {
  return createVoiceLiveConfig('gaming', {
    connection,
    ...overrides,
  });
}

/**
 * Quick helper to create accessibility config
 */
export function createAccessibilityConfig(connection: any, overrides: any = {}) {
  return createVoiceLiveConfig('accessibility', {
    connection,
    ...overrides,
  });
}

/**
 * Quick helper to create multilingual config
 */
export function createMultilingualConfig(connection: any, overrides: any = {}) {
  return createVoiceLiveConfig('multilingual', {
    connection,
    ...overrides,
  });
}
