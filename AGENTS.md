# AGENTS.md

AI agent guidance for developing the Azure Voice Live React library.

## Project Purpose

Professional React library for Azure AI Foundry Voice Live API. TypeScript strict mode, zero hacks, production-ready code.

## Quick Start

```bash
# Install all dependencies (including playground workspace)
npm install

# Start development
npm run dev
```

## Development Workflow

### Primary Commands

```bash
npm run dev          # Start playground in dev mode (hot reload)
npm run dev:dist     # Test built package (before publishing)
npm run build        # Build library
npm run test         # Run tests
npm run lint         # Check code quality
npm run format       # Format code
```

### Two Development Modes

**Dev Mode (Fast Iteration)**
```bash
npm run dev
```

- Uses source code via Vite alias (`../index.ts`)
- Hot reload - changes reflect instantly
- No build step needed
- **Use for daily development**

**Dist Mode (Production Testing)**
```bash
npm run dev:dist
```

- Builds library then runs playground against `dist/`
- Tests actual package users will install
- Catches build-only issues
- **Use before committing**

### Before Committing

```bash
npm run build        # Verify build works
npm run test         # Run tests
npm run lint         # Check code quality
npm run dev:dist     # Test built output
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
