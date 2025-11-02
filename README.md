# @iloveagents/azure-voice-live-react

[![npm version](https://img.shields.io/npm/v/@iloveagents/azure-voice-live-react.svg)](https://www.npmjs.com/package/@iloveagents/azure-voice-live-react)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, production-ready React library for Azure Voice Live API with complete feature coverage and TypeScript support.

## Overview

Azure Voice Live enables real-time voice conversations with AI models through native audio streaming. This library provides a complete React implementation with full API coverage, optimized presets, and a fluent configuration API.

**Key Features:**

- ✅ **Complete API Coverage** - All Azure Voice Live parameters supported and typed
- ✅ **TypeScript First** - Comprehensive type definitions with full IntelliSense support
- ✅ **Production Ready** - Enterprise-grade code with proper error handling and validation
- ✅ **Optimized Presets** - 8 scenario-specific configurations for common use cases
- ✅ **Fluent API** - 25+ composable helper functions for streamlined configuration
- ✅ **React Hooks** - Modern hooks-based architecture (`useVoiceLive`, `useAudioCapture`)
- ✅ **Avatar Support** - Real-time avatar video with GPU-accelerated chroma key compositing
- ✅ **Audio Enhancements** - Built-in echo cancellation, noise suppression, and semantic VAD
- ✅ **Function Calling** - Complete tool support with async executor pattern
- ✅ **Zero Dependencies** - No external runtime dependencies (React only)

## Installation

```bash
npm install @iloveagents/azure-voice-live-react
```

Or using other package managers:

```bash
yarn add @iloveagents/azure-voice-live-react
pnpm add @iloveagents/azure-voice-live-react
```

## Security

⚠️ **Important**: Never commit API keys to version control!

**For Development:**

- Use environment variables (`.env` files)
- Add `.env` to `.gitignore`
- Example: `apiKey: process.env.VITE_AZURE_SPEECH_KEY`

**For Production:**

- Implement backend proxy with Microsoft Entra ID authentication
- Use managed identities for Azure-hosted applications
- Never expose API keys in client-side code

📖 **See [SECURITY.md](./SECURITY.md) for complete security best practices, authentication methods, and production deployment guidance.**

## Quick Start

### Basic Implementation

```tsx
import { useVoiceLive, AvatarDisplay } from '@iloveagents/azure-voice-live-react';

function VoiceAssistant() {
  const { videoStream, connect, disconnect, connectionState } = useVoiceLive({
    connection: {
      resourceName: 'your-azure-resource-name',
      apiKey: process.env.AZURE_VOICE_LIVE_KEY,
      model: 'gpt-realtime', // GPT-4o Realtime model (recommended)
    },
    session: {
      instructions: 'You are a helpful AI assistant.',
      voice: 'en-US-Ava:DragonHDLatestNeural',
    },
  });

  return (
    <div>
      <AvatarDisplay videoStream={videoStream} />
      <button onClick={connect} disabled={connectionState === 'connected'}>
        Connect
      </button>
      <button onClick={disconnect} disabled={connectionState === 'disconnected'}>
        Disconnect
      </button>
      <p>Status: {connectionState}</p>
    </div>
  );
}
```

## Architecture

### Core Components

```
@iloveagents/azure-voice-live-react
├── Hooks
│   ├── useVoiceLive()        - Main Voice Live API integration
│   └── useAudioCapture()     - Microphone capture with AudioWorklet
├── Components
│   └── AvatarDisplay         - Avatar video with chroma key support
├── Configuration
│   ├── Session Builder       - Type-safe configuration builder
│   ├── Presets              - 8 optimized scenario configurations
│   └── Helpers              - 25+ fluent configuration functions
└── Types
    └── Complete TypeScript definitions for Azure Voice Live API
```

## Configuration Presets

Pre-configured settings optimized for specific use cases:

### Available Presets

| Preset | Use Case | Key Optimizations |
|--------|----------|-------------------|
| **DEFAULT_PRESET** | General purpose applications | `gpt-realtime`, Azure Semantic VAD, 24kHz audio, best quality |
| **CALL_CENTER_PRESET** | Customer service & support | Deep noise suppression, filler word removal, barge-in enabled |
| **AUTOMOTIVE_PRESET** | In-vehicle voice assistants | Far-field noise reduction, patient turn detection, no interruptions |
| **EDUCATION_PRESET** | Teaching & tutoring | Extended silence tolerance, patient listening, no interruptions |
| **GAMING_PRESET** | Interactive gaming | Low latency, fast turn detection, immediate responses |
| **ACCESSIBILITY_PRESET** | Accessibility applications | Clear articulation, slower speech rate, very patient listening |
| **MULTILINGUAL_PRESET** | Multi-language support | Multilingual semantic VAD, 10+ language support |
| **HIGH_PERFORMANCE_PRESET** | Cost optimization | `gpt-realtime-mini`, 16kHz audio, lighter processing |

### Using Presets

```tsx
import { useVoiceLive, createCallCenterConfig } from '@iloveagents/azure-voice-live-react';

const config = createCallCenterConfig({
  connection: {
    resourceName: 'your-resource-name',
    apiKey: process.env.AZURE_VOICE_LIVE_KEY,
  },
  session: {
    instructions: 'You are a professional customer service representative.',
  },
});

const { videoStream, connect } = useVoiceLive(config);
```

**Quick Preset Functions:**
- `createCallCenterConfig()` - Customer service optimization
- `createAutomotiveConfig()` - In-vehicle assistant optimization
- `createEducationConfig()` - Educational application optimization
- `createGamingConfig()` - Gaming interaction optimization
- `createAccessibilityConfig()` - Accessibility optimization
- `createMultilingualConfig()` - Multi-language optimization

## Configuration API

### Fluent Helper Functions

Build custom configurations using composable helper functions:

```tsx
import {
  useVoiceLive,
  withHDVoice,
  withSemanticVAD,
  withEchoCancellation,
  withDeepNoiseReduction,
  compose
} from '@iloveagents/azure-voice-live-react';

// Compose multiple configuration helpers
const enhanceAudio = compose(
  withEchoCancellation,
  withDeepNoiseReduction,
  (config) => withSemanticVAD({
    threshold: 0.5,
    removeFillerWords: true,
    interruptResponse: true,
  }, config),
  (config) => withHDVoice('en-US-Ava:DragonHDLatestNeural', {
    temperature: 0.9,
    rate: '1.1'
  }, config)
);

const { videoStream, connect } = useVoiceLive({
  connection: {
    resourceName: 'your-resource-name',
    apiKey: process.env.AZURE_VOICE_LIVE_KEY,
  },
  session: enhanceAudio({
    instructions: 'You are a helpful assistant.',
  }),
});
```

### Available Helper Functions

**Voice Configuration:**
- `withVoice(voice, config)` - Configure voice (string or VoiceConfig)
- `withHDVoice(name, options, config)` - Configure HD voice with temperature/rate control
- `withCustomVoice(name, config)` - Configure custom trained voice

**Avatar Configuration:**
- `withAvatar(character, style, options, config)` - Configure avatar character and style
- `withGreenScreen(color, config)` - Add chroma key background
- `withBackgroundImage(url, config)` - Add custom background image
- `withAvatarCrop(crop, config)` - Configure video cropping for portrait mode

**Turn Detection:**
- `withSemanticVAD(options, config)` - Azure Semantic VAD (recommended)
- `withMultilingualVAD(languages, options, config)` - Multi-language semantic VAD
- `withEndOfUtterance(options, config)` - Advanced end-of-utterance detection
- `withoutTurnDetection(config)` - Disable automatic turn detection (manual mode)

**Audio Enhancements:**
- `withEchoCancellation(config)` - Enable server-side echo cancellation
- `withoutEchoCancellation(config)` - Disable echo cancellation
- `withDeepNoiseReduction(config)` - Azure deep noise suppression
- `withNearFieldNoiseReduction(config)` - Near-field noise reduction
- `withoutNoiseReduction(config)` - Disable noise reduction
- `withSampleRate(rate, config)` - Set sample rate (16000 or 24000 Hz)

**Output Features:**
- `withViseme(config)` - Enable viseme data for lip-sync animation
- `withWordTimestamps(config)` - Enable word-level audio timestamps
- `withTranscription(options, config)` - Enable input audio transcription
- `withoutTranscription(config)` - Disable transcription

**Function Calling:**
- `withTools(tools, config)` - Add function tools
- `withToolChoice(choice, config)` - Set tool choice behavior ('auto', 'none', 'required')

**Composition:**
- `compose(...fns)` - Compose multiple configuration functions

## API Reference

### `useVoiceLive(config)` Hook

Main hook for Azure Voice Live API integration.

**Parameters:**

```typescript
interface UseVoiceLiveConfig {
  // Connection configuration
  connection: {
    resourceName: string;      // Azure AI Foundry resource name
    apiKey: string;            // Azure API key
    model?: string;            // Model name (default: 'gpt-realtime')
    apiVersion?: string;       // API version (default: '2025-10-01')
  };

  // Session configuration (optional)
  session?: VoiceLiveSessionConfig;

  // Auto-connect on mount (default: false)
  autoConnect?: boolean;

  // Event handler for all Voice Live events
  onEvent?: (event: VoiceLiveEvent) => void;

  // Tool executor for function calling
  toolExecutor?: (toolCall: ToolCall) => Promise<any>;
}
```

**Returns:**

```typescript
interface UseVoiceLiveReturn {
  // Connection state
  connectionState: 'disconnected' | 'connecting' | 'connected';

  // Media streams
  videoStream: MediaStream | null;      // Avatar video stream (WebRTC)
  audioStream: MediaStream | null;      // Avatar audio stream

  // Connection methods
  connect: () => Promise<void>;         // Establish connection
  disconnect: () => void;                // Close connection

  // Communication methods
  sendEvent: (event: any) => void;      // Send custom event to API
  sendText: (text: string) => void;     // Send text message
  sendAudio: (audio: ArrayBuffer) => void; // Send audio chunk (PCM16)
}
```

### `AvatarDisplay` Component

Component for rendering avatar video with optional chroma key compositing.

**Props:**

```typescript
interface AvatarDisplayProps {
  videoStream: MediaStream | null;

  // Chroma key settings
  enableChromaKey?: boolean;            // Enable green screen removal
  chromaKeyColor?: string;              // Key color (default: '#00FF00')
  chromaKeySimilarity?: number;         // Color similarity (0-1, default: 0.4)
  chromaKeySmoothness?: number;         // Edge smoothness (0-1, default: 0.1)

  // Styling
  className?: string;
  style?: React.CSSProperties;

  // Callbacks
  onVideoReady?: () => void;            // Called when video is ready
}
```

### `useAudioCapture()` Hook

Hook for capturing microphone audio with AudioWorklet processing.

**Returns:**

```typescript
interface UseAudioCaptureReturn {
  isCapturing: boolean;                 // Capture state
  startCapture: () => Promise<void>;    // Start capturing
  stopCapture: () => void;              // Stop capturing
  onAudioData: (callback: (data: ArrayBuffer) => void) => void; // Audio data callback
}
```

## Session Configuration

The `session` parameter supports all Azure Voice Live API options:

```typescript
interface VoiceLiveSessionConfig {
  // System instructions
  instructions?: string;

  // Model parameters
  temperature?: number;                  // Response creativity (0-1)
  maxResponseOutputTokens?: number;      // Maximum response length

  // Voice configuration
  voice?: string | VoiceConfig;

  // Turn detection
  turnDetection?: TurnDetectionConfig | null;

  // Audio enhancements
  inputAudioEchoCancellation?: EchoCancellationConfig | null;
  inputAudioNoiseReduction?: NoiseReductionConfig | null;
  inputAudioSamplingRate?: 16000 | 24000;

  // Avatar configuration
  avatar?: AvatarConfig;

  // Function calling
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required';

  // Output configuration
  animation?: AnimationConfig;           // Viseme output
  outputAudioTimestampTypes?: TimestampType[]; // Word timestamps

  // Input transcription
  inputAudioTranscription?: TranscriptionConfig | null;

  // Additional parameters...
}
```

For complete type definitions, see the TypeScript types included with the package.

## Advanced Examples

### Avatar with Green Screen

```tsx
import {
  useVoiceLive,
  AvatarDisplay,
  withAvatar,
  withGreenScreen,
  compose
} from '@iloveagents/azure-voice-live-react';

const configureAvatar = compose(
  (config) => withAvatar('lisa', 'casual-standing', {
    resolution: { width: 1920, height: 1080 },
    bitrate: 2000000,
  }, config),
  (config) => withGreenScreen('#00FF00FF', config)
);

function AvatarApp() {
  const { videoStream, connect } = useVoiceLive({
    connection: {
      resourceName: process.env.AZURE_RESOURCE_NAME,
      apiKey: process.env.AZURE_API_KEY,
    },
    session: configureAvatar({
      instructions: 'You are a helpful assistant.',
    }),
  });

  return <AvatarDisplay videoStream={videoStream} enableChromaKey />;
}
```

### Function Calling

```tsx
import { useVoiceLive, withTools } from '@iloveagents/azure-voice-live-react';

const weatherTool = {
  type: 'function',
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or zip code'
      }
    },
    required: ['location']
  }
};

function WeatherAssistant() {
  const executeTool = async (toolCall: ToolCall) => {
    if (toolCall.name === 'get_weather') {
      const { location } = toolCall.arguments;
      // Fetch weather data
      const weather = await fetchWeather(location);
      return weather;
    }
  };

  const { videoStream, connect } = useVoiceLive({
    connection: {
      resourceName: process.env.AZURE_RESOURCE_NAME,
      apiKey: process.env.AZURE_API_KEY,
    },
    session: withTools([weatherTool], {
      instructions: 'You are a weather assistant with access to real-time weather data.',
    }),
    toolExecutor: executeTool,
  });

  return <AvatarDisplay videoStream={videoStream} />;
}
```

### Event Handling

```tsx
import { useVoiceLive } from '@iloveagents/azure-voice-live-react';

function EventMonitor() {
  const handleEvent = (event: VoiceLiveEvent) => {
    switch (event.type) {
      case 'session.created':
        console.log('Session established');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        console.log('User said:', event.transcript);
        break;

      case 'response.audio_transcript.delta':
        console.log('Assistant saying:', event.delta);
        break;

      case 'response.done':
        console.log('Response complete');
        break;

      case 'error':
        console.error('Error occurred:', event.error);
        break;
    }
  };

  const { videoStream, connect } = useVoiceLive({
    connection: {
      resourceName: process.env.AZURE_RESOURCE_NAME,
      apiKey: process.env.AZURE_API_KEY,
    },
    session: {
      instructions: 'You are a helpful assistant.',
    },
    onEvent: handleEvent,
  });

  return <AvatarDisplay videoStream={videoStream} />;
}
```

## Best Practices

### 1. Use Recommended Defaults

The library defaults to optimal settings:
- **Model**: `gpt-realtime` (GPT-4o Realtime - best quality)
- **Turn Detection**: `azure_semantic_vad` (most reliable)
- **Sample Rate**: 24000 Hz (best quality)
- **Echo Cancellation**: Enabled
- **Noise Suppression**: Enabled

### 2. Enable Audio Enhancements

For production deployments, always enable audio enhancements:

```tsx
const enhanceAudio = compose(
  withEchoCancellation,
  withDeepNoiseReduction,
  (config) => withSemanticVAD({ threshold: 0.5 }, config)
);
```

### 3. Use Azure Semantic VAD

Azure Semantic VAD provides superior turn detection compared to simple volume-based detection:

```tsx
withSemanticVAD({
  threshold: 0.5,                  // Detection threshold
  removeFillerWords: true,         // Remove "um", "uh", etc.
  interruptResponse: true,         // Allow user interruptions
  endOfUtteranceDetection: {       // Advanced end-of-speech detection
    model: 'semantic_detection_v1',
    thresholdLevel: 'medium',
    timeoutMs: 1000,
  }
})
```

### 4. Handle Errors Properly

Implement robust error handling:

```tsx
onEvent: (event) => {
  if (event.type === 'error') {
    console.error('Voice Live error:', event.error);
    // Implement retry logic or user notification
  }
}
```

### 5. Secure API Keys

Never expose API keys in client-side code:

```tsx
// ❌ Bad - API key in code
const apiKey = 'your-api-key-here';

// ✅ Good - Use environment variables
const apiKey = process.env.AZURE_VOICE_LIVE_KEY;

// ✅ Better - Fetch from secure backend
const apiKey = await fetchApiKeyFromBackend();
```

### 6. Optimize for Use Case

Start with a preset matching your use case, then customize:

```tsx
const config = createCallCenterConfig({
  connection: { /* ... */ },
  session: {
    instructions: 'Your custom instructions...',
    // Preset handles: noise suppression, echo cancellation,
    // barge-in, filler word removal, etc.
  },
});
```

## TypeScript Support

Complete TypeScript definitions included for all APIs:

```typescript
import type {
  // Main types
  UseVoiceLiveConfig,
  UseVoiceLiveReturn,
  VoiceLiveSessionConfig,

  // Configuration types
  VoiceConfig,
  TurnDetectionConfig,
  AvatarConfig,

  // Model types
  VoiceLiveModel,
  TurnDetectionType,

  // Event types
  VoiceLiveEvent,

  // Tool types
  ToolDefinition,
  ToolCall,

  // And many more...
} from '@iloveagents/azure-voice-live-react';
```

## Requirements

### Peer Dependencies

- **React**: ≥16.8.0 (Hooks support required)
- **React DOM**: ≥16.8.0

### Browser Requirements

- Modern browser with WebRTC support
- WebAudio API support
- AudioWorklet support (for microphone capture)

### Azure Requirements

- Azure AI Foundry resource with Voice Live API enabled
- Deployed voice-enabled model (`gpt-realtime` or `gpt-realtime-mini`)
- Valid API key with appropriate permissions

## Azure Setup

1. **Create Azure AI Foundry Resource**
   - Navigate to [Azure Portal](https://portal.azure.com)
   - Create new AI Foundry resource
   - Note your resource name

2. **Enable Voice Live API**
   - In your AI Foundry resource, enable Voice Live API
   - Deploy a voice-enabled model (gpt-realtime recommended)

3. **Get API Key**
   - Navigate to Keys and Endpoint
   - Copy your API key
   - Store securely (use environment variables)

For detailed setup instructions, see [Azure Voice Live Documentation](https://learn.microsoft.com/azure/ai-services/speech-service/voice-live).

## Performance Considerations

### Bundle Size

The library has zero runtime dependencies (except React), resulting in minimal bundle impact:
- **Core**: ~50KB (minified + gzipped)
- **Full**: ~80KB (minified + gzipped, including all presets and helpers)

### Optimizations

- Tree-shakeable ES modules
- Code splitting friendly
- No heavy dependencies
- Lazy loading supported

### Sample Rate Recommendations

- **24000 Hz**: Best audio quality (recommended for production)
- **16000 Hz**: Lower bandwidth, acceptable quality

## Troubleshooting

### Common Issues

**Issue**: Connection fails with authentication error
- **Solution**: Verify API key and resource name are correct

**Issue**: No audio from avatar
- **Solution**: Check browser audio permissions and autoplay policies

**Issue**: Avatar video not displaying
- **Solution**: Ensure WebRTC is supported and not blocked by firewall

**Issue**: Echo or feedback
- **Solution**: Enable echo cancellation with `withEchoCancellation`

**Issue**: Premature turn detection
- **Solution**: Increase `silenceDurationMs` in turn detection config

For more help, see [GitHub Issues](https://github.com/iloveagents/azure-voice-live-react/issues).

## Demo Application

A complete demo application is available showing real-world usage of all library features. See the [demo repository](../../) for examples.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT © [iloveagents](https://github.com/iloveagents)

## Support

- **Issues**: [GitHub Issues](https://github.com/iloveagents/azure-voice-live-react/issues)
- **Discussions**: [GitHub Discussions](https://github.com/iloveagents/azure-voice-live-react/discussions)
- **Documentation**: [API Reference](https://github.com/iloveagents/azure-voice-live-react#readme)

## Acknowledgments

Built for Azure Voice Live API. For official Microsoft documentation, visit:
- [Azure Voice Live Overview](https://learn.microsoft.com/azure/ai-services/speech-service/voice-live)
- [Voice Live API Reference](https://learn.microsoft.com/azure/ai-services/speech-service/voice-live-api-reference)
- [Azure AI Foundry](https://learn.microsoft.com/azure/ai-studio/)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

**Made with ❤️ by [iloveagents](https://github.com/iloveagents)**
