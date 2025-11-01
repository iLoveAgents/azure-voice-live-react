# Development Guide

Guide for developing and contributing to the `@iloveagents/azure-voice-live-react` library.

## Quick Start

```bash
# Install dependencies
npm install

# Install example app dependencies
npm run example:install

# Start development with hot reload
npm run example
```

Open http://localhost:3000 and enter your Azure credentials to test.

## Development Workflow

### Two Development Modes

**Mode 1: Fast Development (Recommended)**

```bash
npm run example
```

- Uses source code directly via Vite alias (`../index.ts`)
- Hot reload - changes reflect instantly
- No build step needed
- **Use this for feature development and bug fixes**

**Mode 2: Production Testing (Before Publishing)**

```bash
npm run example:build-mode
```

- Builds library to `dist/` then runs example
- Tests the actual package users will install
- Catches build-only issues
- **Use this before committing or publishing**

### Development Loop

1. **Make changes** to library code in project root
2. **Test instantly** - Example app auto-reloads (dev mode)
3. **Verify build** - Run `npm run build` to check for errors
4. **Test built output** - Run `npm run example:build-mode`
5. **Commit** changes

### Before Committing

```bash
# Build and verify no errors
npm run build

# Test against built output
npm run example:build-mode

# Optional: Test actual npm package
npm run test:pack
```

## Project Structure

```
azure-voice-live-react/
├── index.ts                    # Main library exports
├── package.json                # npm package configuration
├── tsconfig.json              # TypeScript strict mode config
├── tsup.config.ts             # Build config (ESM + CJS)
│
├── types/                     # TypeScript definitions
│   └── voice-live.types.ts   # Azure Voice Live API types
│
├── hooks/                     # React hooks
│   ├── useVoiceLive.ts       # Main hook
│   └── useAudioCapture.ts    # Audio capture
│
├── components/                # React components
│   └── AvatarDisplay.tsx     # Avatar display
│
├── services/                  # Core services
│   ├── websocket.service.ts  # WebSocket management
│   └── webrtc.service.ts     # WebRTC handling
│
├── utils/                     # Utilities
│   ├── sessionBuilder.ts     # Fluent builder
│   ├── presets.ts            # Scenario presets
│   ├── configHelpers.ts      # Configuration helpers
│   └── audioUtils.ts         # Audio utilities
│
└── example/                   # Development test app
    ├── vite.config.ts         # Configured with alias
    └── src/App.tsx            # Test UI
```

## Common Tasks

### Adding a New Feature

1. Create/edit files in project root
2. Export from `index.ts`
3. Test in example app (`npm run example`)
4. Update [README.md](README.md)
5. Build and test (`npm run example:build-mode`)
6. Commit changes

### Adding a Configuration Helper

1. Add function to [utils/configHelpers.ts](utils/configHelpers.ts)
2. Ensure proper TypeScript types
3. Export from [index.ts](index.ts)
4. Test with `compose()` function
5. Document in [README.md](README.md) API reference

### Adding a Preset

1. Define preset function in [utils/presets.ts](utils/presets.ts)
2. Export from [index.ts](index.ts)
3. Add to README.md presets table
4. Test in example app

### Fixing a Bug

1. Reproduce in example app
2. Fix in library code
3. Verify fix in example app
4. Test built output
5. Commit

## Available Scripts

From library root:

```bash
npm run build              # Build library to dist/
npm run dev                # Build in watch mode
npm run type-check         # Run TypeScript compiler
npm run test:pack          # Test actual npm package
npm run example            # Start example in dev mode
npm run example:install    # Install example dependencies
npm run example:build-mode # Build then test dist output
```

From example directory:

```bash
npm run dev       # Dev mode (source alias)
npm run dev:dist  # Dist mode (built output)
npm run build     # Build example app
```

## Coding Standards

- **TypeScript strict mode** - No `any` types
- **Explicit return types** - All public functions
- **JSDoc comments** - All exported APIs
- **No hacks** - Production-ready code only
- **React hooks only** - No class components

## Publishing

### Pre-publish Checklist

1. Build successfully: `npm run build`
2. Test dist output: `npm run example:build-mode`
3. Update version in package.json
4. Test pack: `npm run test:pack`
5. Verify README.md is up to date

### Publish to npm

```bash
npm publish --access public
```

## Testing

### Manual Testing with Example App

The example app is the primary testing tool:

1. Start in dev mode: `npm run example`
2. Enter Azure credentials
3. Test connection, audio, avatar
4. Verify all features work

### Testing Built Package

Test the actual package before publishing:

```bash
# Option 1: Use dist mode
npm run example:build-mode

# Option 2: Test pack (.tgz)
npm run test:pack
```

## Resources

- **Main README**: [README.md](README.md) - Library usage documentation
- **Agent Guide**: [AGENTS.md](AGENTS.md) - AI agent development guide
- **Example App**: [example/README.md](example/README.md) - Example app documentation
- **Azure Docs**: https://learn.microsoft.com/azure/ai-services/openai/realtime-audio-reference

## Support

For questions or issues:
- Check [README.md](README.md) for usage documentation
- Review example app implementation
- Consult Azure Voice Live API docs
- Create GitHub issue with reproduction steps
