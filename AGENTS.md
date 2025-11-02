# AGENTS.md

AI agent guidance for developing the Azure Voice Live React library.

## Project Purpose

Professional React library for Azure AI Foundry Voice Live API. TypeScript strict mode, zero hacks, production-ready code.

## Quick Start

```bash
# Install all dependencies (library + playground workspace)
npm install

# Start playground (frontend)
npm run dev

# Start backend proxy (separate terminal, for secure proxy examples)
cd playground/backend && npm install && npm start
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

#### Dev Mode (Fast Iteration)

```bash
npm run dev
```

- Uses source code via Vite alias (`../index.ts`)
- Hot reload - changes reflect instantly
- No build step needed
- Use for daily development

#### Dist Mode (Production Testing)

```bash
npm run dev:dist
```

- Builds library then runs playground against `dist/`
- Tests actual package users will install
- Catches build-only issues
- Use before committing

### Backend Proxy (Optional)

For secure proxy examples (Voice/Avatar/Agent with MSAL):

```bash
cd playground/backend
npm install
cp .env.example .env
# Edit .env with your Azure credentials
npm start
```

The proxy runs on `ws://localhost:8080` and secures API keys server-side.

### Before Committing

```bash
npm run build        # Verify build works
npm run test         # Run tests
npm run lint         # Check code quality
npm run dev:dist     # Test built output
```

## Project Structure

```txt
azure-voice-live-react/
├── index.ts              # Library exports (edit this when adding features)
├── types/                # TypeScript definitions
├── hooks/                # React hooks (useVoiceLive, useAudioCapture)
├── components/           # React components (AvatarDisplay)
├── services/             # WebSocket, WebRTC services
├── utils/                # Builders, presets, helpers
└── playground/           # Development workspace (npm workspace)
    ├── vite.config.ts    # Configured with dev/dist modes
    ├── src/              # Playground examples
    │   ├── App.tsx       # Router and MSAL setup
    │   └── pages/        # Example implementations
    └── backend/          # WebSocket proxy server
        ├── server.js     # Generic proxy for all scenarios
        ├── .env.example  # Configuration template
        └── README.md     # Proxy documentation
```

## Common Tasks

### Add New Feature

1. Create/edit files in project root
2. Export from `index.ts`
3. Test in playground
4. Update README.md
5. Run `npm run build` to verify

### Fix Bug

1. Reproduce in playground
2. Fix in library code
3. Verify fix in playground
4. Commit changes

### Add Configuration Option

1. Update types in `types/voiceLive.ts`
2. Update builder/preset/helper as needed
3. Test in playground [App.tsx](playground/src/App.tsx)
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
- [types/voiceLive.ts](types/voiceLive.ts) - Azure API types
- [hooks/useVoiceLive.ts](hooks/useVoiceLive.ts) - Main hook
- [playground/src/App.tsx](playground/src/App.tsx) - Router setup
- [playground/backend/server.js](playground/backend/server.js) - Proxy server
- [README.md](README.md) - Public documentation

## Links

- Azure Voice Live Docs: <https://learn.microsoft.com/azure/ai-services/openai/realtime-audio-reference>
- GitHub: <https://github.com/iLoveAgents/azure-voice-live-react>
- Demo Project: <https://github.com/iLoveAgents/azure-live-voice-avatar>
