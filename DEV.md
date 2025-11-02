# Development Guide

Guide for developing and contributing to the `@iloveagents/azure-voice-live-react` library.

## Quick Start

```bash
# Install all dependencies (library + playground workspace)
npm install

# Start development with hot reload
npm run dev
```

Open <http://localhost:3000> and enter your Azure credentials to test.

### Optional: Start Backend Proxy

For testing secure proxy examples (Voice/Avatar/Agent with MSAL):

```bash
# In a separate terminal
cd playground/backend
npm install
cp .env.example .env
# Edit .env with your Azure credentials
npm start
```

The proxy runs on `ws://localhost:8080` and enables testing of secure authentication patterns.

## Development Workflow

This project uses **npm workspaces** with a monorepo structure. The playground is a workspace for development and testing.

### Two Development Modes

#### Dev Mode (Fast Iteration)

```bash
npm run dev
```

- Uses source code directly via Vite alias (`../index.ts`)
- Hot reload - changes reflect instantly
- No build step needed
- Use this for daily development

#### Dist Mode (Production Testing)

```bash
npm run dev:dist
```

- Builds library to `dist/` then runs playground
- Tests the actual package users will install
- Catches build-only issues
- Use this before committing

### Development Loop

1. Make changes to library code in project root
2. Test instantly - Playground auto-reloads (dev mode)
3. Run tests - `npm run test`
4. Check linting - `npm run lint`
5. Test built output - `npm run dev:dist`
6. Commit changes

### Before Committing

```bash
# Build and verify no errors
npm run build

# Run tests
npm run test

# Check code quality
npm run lint

# Format code
npm run format

# Test against built output
npm run dev:dist
```

## Project Structure

```txt
azure-voice-live-react/
├── index.ts                    # Main library exports
├── package.json                # npm package configuration (with workspaces)
├── tsconfig.json              # TypeScript strict mode config
├── tsup.config.ts             # Build config (ESM + CJS)
├── vitest.config.ts           # Test configuration
├── .eslintrc.json             # ESLint configuration
├── .prettierrc.json           # Prettier configuration
│
├── types/                     # TypeScript definitions
│   └── voiceLive.ts          # Azure Voice Live API types
│
├── hooks/                     # React hooks
│   ├── useVoiceLive.ts       # Main hook
│   └── useAudioCapture.ts    # Audio capture
│
├── components/                # React components
│   └── VoiceLiveAvatar.tsx     # Avatar display
│
├── services/                  # Core services
│   ├── websocket.service.ts  # WebSocket management
│   └── webrtc.service.ts     # WebRTC handling
│
├── utils/                     # Utilities
│   ├── sessionBuilder.ts     # Fluent builder
│   ├── presets.ts            # Scenario presets
│   ├── configHelpers.ts      # Configuration helpers
│   ├── configHelpers.test.ts # Tests
│   └── audioUtils.ts         # Audio utilities
│
└── playground/                # Development workspace (npm workspace)
    ├── vite.config.ts         # Configured with dev/dist modes
    ├── src/                   # Playground examples
    │   ├── App.tsx            # Router and MSAL setup
    │   └── pages/             # Example implementations
    └── backend/               # WebSocket proxy server
        ├── server.js          # Generic proxy for all scenarios
        ├── .env.example       # Configuration template
        └── README.md          # Proxy documentation
```

## Common Tasks

### Adding a New Feature

1. Create/edit files in project root
2. Export from `index.ts`
3. Test in playground (`npm run dev`)
4. Update [README.md](README.md)
5. Build and test (`npm run dev:dist`)
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
4. Test in playground

### Fixing a Bug

1. Reproduce in playground
2. Fix in library code
3. Verify fix in playground
4. Test built output
5. Commit

## Available Scripts

From library root:

```bash
npm run dev          # Start playground in dev mode (hot reload)
npm run dev:dist     # Build library + start playground in dist mode
npm run build        # Build library to dist/
npm run build:watch  # Build library in watch mode
npm run type-check   # Run TypeScript compiler
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint code
npm run lint:fix     # Lint and auto-fix
npm run format       # Format code with Prettier
npm run format:check # Check formatting
npm run test:pack    # Test actual npm package (.tgz)
```

From playground directory (rarely needed):

```bash
npm run dev       # Dev mode (source alias)
npm run dev:dist  # Dist mode (built output)
npm run build     # Build playground app
```

From playground/backend directory:

```bash
npm install       # Install proxy dependencies
npm start         # Start proxy server on port 8080
```

## Coding Standards

- **TypeScript strict mode** - No `any` types
- **Explicit return types** - All public functions
- **JSDoc comments** - All exported APIs
- **No hacks** - Production-ready code only
- **React hooks only** - No class components
- **Minimal emoji usage** - Professional documentation

## Publishing

### Pre-publish Checklist

1. Build successfully: `npm run build`
2. Run tests: `npm run test`
3. Check linting: `npm run lint`
4. Test dist output: `npm run dev:dist`
5. Update version in package.json
6. Test pack: `npm run test:pack`
7. Verify README.md is up to date

### Publish to npm

```bash
npm publish --access public
```

## Testing

### Manual Testing with Playground

The playground is the primary testing tool:

1. Start in dev mode: `npm run dev`
2. Enter Azure credentials
3. Test connection, audio, avatar
4. Verify all features work

### Testing Built Package

Test the actual package before publishing:

```bash
# Option 1: Use dist mode
npm run dev:dist

# Option 2: Test pack (.tgz)
npm run test:pack
```

### Automated Tests

Run unit tests with Vitest:

```bash
npm run test         # Run once
npm run test:watch   # Watch mode
```

## Resources

- **Main README**: [README.md](README.md) - Library usage documentation
- **Agent Guide**: [AGENTS.md](AGENTS.md) - AI agent development guide
- **Playground**: [playground/README.md](playground/README.md) - Playground documentation
- **Backend Proxy**: [playground/backend/README.md](playground/backend/README.md) - Proxy documentation
- **Azure Docs**: <https://learn.microsoft.com/azure/ai-services/openai/realtime-audio-reference>

## Support

For questions or issues:

- Check [README.md](README.md) for usage documentation
- Review playground implementation
- Consult Azure Voice Live API docs
- Create GitHub issue with reproduction steps
