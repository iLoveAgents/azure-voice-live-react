# Playground

Development workspace for the `@iloveagents/azure-voice-live-react` library.

## Quick Start

1. **Set up environment variables** (one-time setup):

```bash
cd playground
cp .env.example .env
# Edit .env and add your Azure credentials
```

2. **Start development** (from library root):

```bash
npm run dev
```

3. Open <http://localhost:3001> - credentials auto-loaded from `.env`!

## Purpose

This playground is used for library development and testing. It demonstrates:

- **Voice Only Mode**: Audio-only conversation (lower bandwidth)
- **Voice + Avatar Mode**: Full audio + video with Lisa avatar
- Using `createCallCenterConfig` preset
- Managing connection with `useVoiceLive` hook

## Environment Variables

Create a `.env` file in the `playground/` directory:

```bash
# Required
VITE_AZURE_AI_FOUNDRY_RESOURCE=your-resource-name
VITE_AZURE_SPEECH_KEY=your-api-key

# Optional (for avatar mode)
VITE_AVATAR_CHARACTER=lisa
VITE_AVATAR_STYLE=casual-sitting
```

These values will auto-populate the form fields when you start the playground.

## Configuration

The playground uses `createCallCenterConfig` preset with:

- Semantic VAD for turn detection
- Echo cancellation and noise reduction
- HD voice quality

Edit [src/App.tsx](src/App.tsx) to test other presets or configurations.

## Development Modes

**Dev mode** (from library root):

```bash
npm run dev
```

- Uses source code via Vite alias
- Hot reload for instant feedback
- Use for daily development

**Dist mode** (from library root):

```bash
npm run dev:dist
```

- Tests built output from `../dist/`
- Use before committing changes

See [../DEV.md](../DEV.md) for complete development guide.

## Requirements

- Azure AI Foundry account with Voice Live API access
- Modern browser with WebRTC support
