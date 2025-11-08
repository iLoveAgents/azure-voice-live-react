# AGENTS.md

AI agent guidance for developing the Azure Voice Live React library.

## Project Overview

Professional React library for Azure AI Foundry Voice Live API integration. Provides hooks and components for real-time voice/avatar conversations with OpenAI's real-time API.

**Tech Stack:** React 18, TypeScript 5.9 (strict mode), Vite, tsup, Vitest
**Target:** Production-ready code with zero hacks or workarounds

## Quick Start

```bash
# Install all dependencies (library + playground workspace)
npm install

# Start playground (frontend)
npm run dev

# Start backend proxy (separate terminal, for secure proxy examples)
cd playground/backend && npm install && npm start
```

## Build and Test Commands

```bash
# Setup
npm install          # Install all dependencies (library + playground workspace)

# Development
npm run dev          # Start playground in dev mode (hot reload)
npm run dev:dist     # Test built package (validates production build)

# Quality checks
npm run build        # Build library (creates dist/)
npm run test         # Run Vitest tests
npm run lint         # ESLint validation
npm run format       # Prettier formatting

# Before committing - run all checks
npm run build && npm run test && npm run lint && npm run dev:dist
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

## Project Structure

```txt
azure-voice-live-react/
├── index.ts              # Library exports
├── hooks/                # React hooks (useVoiceLive, useAudioCapture)
├── components/           # React components (VoiceLiveAvatar)
├── utils/                # Utilities (sessionBuilder, presets, helpers)
├── types/                # TypeScript type definitions
└── playground/           # Development workspace
    ├── src/pages/        # Example implementations
    └── backend/          # WebSocket proxy (optional)
```

## Testing Instructions

- All tests use **Vitest** with TypeScript support
- Run `npm run test` from root to execute all tests
- Test files follow `*.test.ts` pattern (e.g., `configHelpers.test.ts`)
- Add tests for any new utility functions or builders
- Test coverage expected for all exported utilities

### Manual Testing in Playground

1. Start dev mode: `npm run dev`
2. Navigate to relevant example page in browser (<http://localhost:5173>)
3. Test with actual Azure Voice Live API connection
4. For proxy examples, start backend: `cd playground/backend && npm start`

## Common Tasks

### Adding New Features

1. Create/edit files in project root (hooks/, components/, utils/, types/)
2. Export from `index.ts` (required for package users)
3. Add TypeScript types in `types/voiceLive.ts` if needed
4. Test in playground (create example page if needed)
5. Update README.md with usage examples
6. Run `npm run build` and `npm run dev:dist` to verify

### Fixing Bugs

1. Reproduce issue in playground first
2. Add test case if applicable (`*.test.ts`)
3. Fix in library code (never in playground)
4. Verify fix in playground and tests
5. Run all quality checks before committing

### Modifying Configuration/API

1. Update types in `types/voiceLive.ts`
2. Update `utils/sessionBuilder.ts` for wire format conversion
3. Update `presets/index.ts` if needed for common scenarios
4. Test in playground examples (especially VoiceOnlyBasic.tsx)
5. Document changes in README.md

## Code Style Guidelines

- **TypeScript:** Strict mode enabled, no `any` unless intentional (wire format conversions)
- **Functions:** Explicit return types required
- **Documentation:** JSDoc comments on all exported functions/types
- **Quality:** Production-ready code only, no hacks or workarounds
- **Formatting:** Prettier (2 spaces, single quotes, semicolons)
- **Linting:** ESLint with strict rules, must pass before commit

## Security Considerations

- **API Keys:** Never commit Azure API keys or secrets
- **Backend Proxy:** Use `playground/backend` for production scenarios
- **MSAL Authentication:** Examples in `playground/src/pages/*ProxyMSAL.tsx`
- **.env Files:** Always in `.gitignore`, use `.env.example` templates

## Publishing Workflow

```bash
# Pre-publish checklist
npm run build        # Ensure clean build
npm run test         # All tests pass
npm run lint         # No linting errors
npm run dev:dist     # Validate built package works

# Publish (maintainers only)
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
