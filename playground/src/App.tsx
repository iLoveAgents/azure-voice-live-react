import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { VoiceOnlyBasic } from './pages/VoiceOnlyBasic';
import { AvatarAdvanced } from './pages/AvatarAdvanced';
import { FunctionCalling } from './pages/FunctionCalling';
import { AudioVisualizer } from './pages/AudioVisualizer';
import { VisemeExample } from './pages/VisemeExample';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/voice-basic" element={<VoiceOnlyBasic />} />
        <Route path="/avatar-advanced" element={<AvatarAdvanced />} />
        <Route path="/function-calling" element={<FunctionCalling />} />
        <Route path="/audio-visualizer" element={<AudioVisualizer />} />
        <Route path="/viseme" element={<VisemeExample />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
