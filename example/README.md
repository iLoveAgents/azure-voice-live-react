# Example App

Test application for the `@iloveagents/azure-voice-live-react` library.

## Quick Start

```bash
# Install dependencies
npm install

# Run example app
npm run dev
```

Open http://localhost:3000 and enter your Azure credentials.

## What This Demonstrates

- Using `createCallCenterConfig` preset
- Connecting to Azure Voice Live API
- Displaying avatar video stream
- Managing connection with `useVoiceLive` hook

## Configuration

The example uses `createCallCenterConfig` preset with:
- Semantic VAD for turn detection
- Echo cancellation and noise reduction
- HD voice quality

Edit [src/App.tsx](src/App.tsx) to test other presets or configurations.

## For Library Developers

This example is used for library development and testing:

- **Dev mode**: `npm run dev` - Uses source code via alias, hot reload
- **Dist mode**: `npm run dev:dist` - Tests built output from `../dist/`

See [../DEV.md](../DEV.md) for complete development guide.

## Requirements

- Azure AI Foundry account with Voice Live API access
- Modern browser with WebRTC support
