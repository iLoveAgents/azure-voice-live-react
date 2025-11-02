import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { HomePage } from './pages/HomePage';
import { VoiceOnlyBasic } from './pages/VoiceOnlyBasic';
import { VoiceAdvanced } from './pages/VoiceAdvanced';
import { VoiceProxy } from './pages/VoiceProxy';
import { AvatarBasic } from './pages/AvatarBasic';
import { AvatarAdvanced } from './pages/AvatarAdvanced';
import { AvatarProxy } from './pages/AvatarProxy';
import { FunctionCalling } from './pages/FunctionCalling';
import { AudioVisualizer } from './pages/AudioVisualizer';
import { VisemeExample } from './pages/VisemeExample';
import AgentService from './pages/AgentService';

// MSAL configuration for Agent Service authentication
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // Use sessionStorage for better security
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  const [msalInitialized, setMsalInitialized] = useState(false);

  useEffect(() => {
    // Initialize MSAL before using it
    msalInstance.initialize().then(() => {
      setMsalInitialized(true);
    });
  }, []);

  if (!msalInitialized) {
    return <div style={{ padding: '2rem' }}>Initializing authentication...</div>;
  }

  return (
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/voice-basic" element={<VoiceOnlyBasic />} />
          <Route path="/voice-advanced" element={<VoiceAdvanced />} />
          <Route path="/voice-proxy" element={<VoiceProxy />} />
          <Route path="/avatar-basic" element={<AvatarBasic />} />
          <Route path="/avatar-advanced" element={<AvatarAdvanced />} />
          <Route path="/avatar-proxy" element={<AvatarProxy />} />
          <Route path="/agent-service" element={<AgentService />} />
          <Route path="/function-calling" element={<FunctionCalling />} />
          <Route path="/audio-visualizer" element={<AudioVisualizer />} />
          <Route path="/viseme" element={<VisemeExample />} />
        </Routes>
      </BrowserRouter>
    </MsalProvider>
  );
}

export default App;
