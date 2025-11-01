# Azure Voice Live React - Example App

This is a basic test application for the `@iloveagents/azure-voice-live-react` library.

## Purpose

This example demonstrates:
- Using the `createCallCenterConfig` preset
- Connecting to Azure AI Foundry Voice Live API
- Displaying avatar video stream
- Managing connection state with `useVoiceLive` hook

## Running the Example

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

4. Enter your Azure credentials:
   - Azure Resource Name (from Azure AI Foundry portal)
   - API Key (from Azure AI Foundry portal)
   - Custom instructions (optional)

5. Click "Connect" to start the Voice Live session

## Testing the Library

This example app uses a Vite alias that points directly to the parent library source code (`../index.ts`). This means:

- Changes to the library code are reflected immediately (hot reload)
- No need to build or publish the library for testing
- You can test library features in a real React application

## Configuration

The example uses the `createCallCenterConfig` preset which includes:
- Semantic VAD for turn detection
- Echo cancellation and noise reduction
- HD voice quality
- Optimized for customer service scenarios

You can modify the configuration in [src/App.tsx](src/App.tsx) to test other presets or custom configurations.

## Requirements

- Valid Azure AI Foundry account
- Azure Voice Live API access
- Modern browser with WebRTC support
