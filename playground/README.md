# Playground

Development workspace for the `@iloveagents/azure-voice-live-react` library.

## Quick Start

From library root:

```bash
npm run dev
```

Open <http://localhost:3000> and enter your Azure credentials.

## Purpose

This playground is used for library development and testing. It demonstrates:

- Using `createCallCenterConfig` preset
- Connecting to Azure Voice Live API
- Displaying avatar video stream
- Managing connection with `useVoiceLive` hook

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
