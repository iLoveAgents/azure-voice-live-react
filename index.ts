/**
 * Azure Voice Live API - React Library
 *
 * A comprehensive React library for integrating Azure Voice Live API with avatar support.
 * Designed to be portable and reusable across projects.
 *
 * @packageDocumentation
 */

// ==================== Hooks ====================
export { useAudioCapture } from './hooks/useAudioCapture';
export { useVoiceLive } from './hooks/useVoiceLive';

// ==================== Components ====================
export { VoiceLiveAvatar } from './components/VoiceLiveAvatar';

// ==================== Utilities ====================
export {
  createChromaKeyProcessor,
  DEFAULT_GREEN_SCREEN,
  type ChromaKeyProcessor,
} from './utils/chromaKey';

export {
  buildSessionConfig,
  validateConfig,
  DEFAULT_SESSION_CONFIG,
} from './utils/sessionBuilder';

export {
  arrayBufferToBase64,
  createAudioDataCallback,
} from './utils/audioHelpers';

export {
  // Voice helpers
  withVoice,
  withHDVoice,
  withCustomVoice,
  // Avatar helpers
  withAvatar,
  withGreenScreen,
  withBackgroundImage,
  withAvatarCrop,
  // Turn detection helpers
  withSemanticVAD,
  withMultilingualVAD,
  withEndOfUtterance,
  withoutTurnDetection,
  // Audio enhancement helpers
  withEchoCancellation,
  withoutEchoCancellation,
  withDeepNoiseReduction,
  withNearFieldNoiseReduction,
  withoutNoiseReduction,
  withSampleRate,
  // Output helpers
  withViseme,
  withWordTimestamps,
  // Transcription helpers
  withTranscription,
  withoutTranscription,
  // Function calling helpers
  withTools,
  withToolChoice,
  // Composition helper
  compose,
} from './utils/configHelpers';

// ==================== Presets ====================
export {
  VOICE_LIVE_PRESETS,
  DEFAULT_PRESET,
  CALL_CENTER_PRESET,
  AUTOMOTIVE_PRESET,
  EDUCATION_PRESET,
  GAMING_PRESET,
  ACCESSIBILITY_PRESET,
  MULTILINGUAL_PRESET,
  HIGH_PERFORMANCE_PRESET,
  createVoiceLiveConfig,
  createCallCenterConfig,
  createAutomotiveConfig,
  createEducationConfig,
  createGamingConfig,
  createAccessibilityConfig,
  createMultilingualConfig,
  type PresetName,
} from './presets';

// ==================== Types ====================
export type {
  // Event types
  VoiceLiveEvent,
  VoiceLiveSession,
  AvatarConfig,
  IceServerConfig,

  // Configuration types
  VoiceLiveConfig,
  AudioCaptureConfig,
  ChromaKeyConfig,

  // Hook return types
  AudioCaptureReturn,
  VoiceLiveReturn,
  ConnectionState,

  // Component props
  VoiceLiveAvatarProps,

  // Event handlers
  VoiceLiveEventHandler,
  ToolExecutor,
  ModalController,
  AudioDataCallback,

  // Utility types
  LogLevel,
  LoggerConfig,
} from './types';
