# AGENTS.md

AI agent guidance for developing the Azure Voice Live React library.

## Project Purpose

Professional React library for Azure AI Foundry Voice Live API. TypeScript strict mode, zero hacks, production-ready code.

## Development Workflow

### Setup
```bash
# Install library dependencies
npm install

# Install example app dependencies (or use: npm run example:install)
cd example && npm install
```

### Two Development Modes

**Mode 1: Fast Development (Recommended for Daily Work)**
```bash
# From library root
npm run example

# Or from example directory
cd example && npm run dev
```

Uses Vite alias pointing to `../index.ts`:
- Edit library code, see changes instantly (hot reload)
- No build step needed
- Fastest iteration speed
- **Use this for feature development and bug fixes**

**Mode 2: Production Testing (Before Publishing)**
```bash
# From library root - builds then runs example against dist
npm run example:build-mode

# Or manually
npm run build
cd example && npm run dev:dist
```

Uses built output from `dist/`:
- Tests the actual package users will install
- Catches build-only issues
- Verifies exports and types work correctly
- **Use this before committing or publishing**

### Testing Changes
1. Edit library files in project root
2. Example app auto-reloads (dev mode) or restart server (dist mode)
3. Open http://localhost:3000 to test
4. Enter Azure credentials and test functionality

### Before Committing
```bash
# Build and verify no errors
npm run build

# Test against built output
npm run example:build-mode

# Optional: Test the actual npm package
npm run test:pack
```

## Project Structure

```
azure-voice-live-react/
├── index.ts              # Library exports (edit this when adding features)
├── types/                # TypeScript definitions
├── hooks/                # React hooks (useVoiceLive, useAudioCapture)
├── components/           # React components (AvatarDisplay)
├── services/             # WebSocket, WebRTC services
├── utils/                # Builders, presets, helpers
└── example/              # Test app (use this for development!)
    ├── vite.config.ts    # Alias configured here
    └── src/App.tsx       # Basic test UI
```

## Common Tasks

### Add New Feature
1. Create/edit files in project root
2. Export from `index.ts`
3. Test in example app
4. Update README.md
5. Run `npm run build` to verify

### Fix Bug
1. Reproduce in example app
2. Fix in library code
3. Verify fix in example app
4. Commit changes

### Add Configuration Option
1. Update types in `types/voice-live.types.ts`
2. Update builder/preset/helper as needed
3. Test in example app [App.tsx](example/src/App.tsx)
4. Document in README.md

## Coding Standards

- TypeScript strict mode (no `any`)
- Explicit return types on functions
- Comprehensive JSDoc on exports
- No hacks or workarounds
- Production-ready code only

## Publishing

```bash
npm run build
npm publish --access public
```

## Key Files

- [index.ts](index.ts) - All library exports
- [types/voice-live.types.ts](types/voice-live.types.ts) - Azure API types
- [hooks/useVoiceLive.ts](hooks/useVoiceLive.ts) - Main hook
- [example/src/App.tsx](example/src/App.tsx) - Test UI
- [README.md](README.md) - Public documentation

## Links

- **Azure Voice Live Docs**: https://learn.microsoft.com/azure/ai-services/openai/realtime-audio-reference
- **GitHub**: https://github.com/iLoveAgents/azure-voice-live-react
- **Demo Project**: https://github.com/iLoveAgents/azure-live-voice-avatar
