import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { VoiceOnlyBasic } from './pages/VoiceOnlyBasic';
import { AvatarAdvanced } from './pages/AvatarAdvanced';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/voice-basic" element={<VoiceOnlyBasic />} />
        <Route path="/avatar-advanced" element={<AvatarAdvanced />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
