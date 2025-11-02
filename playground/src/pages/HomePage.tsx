import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div>
      <h1>Azure Voice Live React - Examples</h1>
      <p>Simple examples for Azure AI Voice Live API</p>

      <h2 style={{ marginTop: '30px' }}>Voice Examples</h2>
      <ul>
        <li><Link to="/voice-basic">Voice Chat - Simple</Link></li>
        <li><Link to="/voice-advanced">Voice Chat - Advanced Config</Link></li>
        <li><Link to="/voice-proxy">Voice Chat - Secure Proxy [no auth]</Link></li>
        <li><Link to="/voice-proxy-msal">Voice Chat - Secure Proxy [MSAL]</Link></li>
      </ul>

      <h2 style={{ marginTop: '30px' }}>Avatar Examples</h2>
      <ul>
        <li><Link to="/avatar-basic">Avatar - Simple</Link></li>
        <li><Link to="/avatar-advanced">Avatar - Advanced</Link></li>
        <li><Link to="/avatar-proxy">Avatar - Secure Proxy [no auth]</Link></li>
        <li><Link to="/avatar-proxy-msal">Avatar - Secure Proxy [MSAL]</Link></li>
      </ul>

      <h2 style={{ marginTop: '30px' }}>Agent Service</h2>
      <ul>
        <li><Link to="/agent-service">Agent Service</Link></li>
      </ul>

      <h2 style={{ marginTop: '30px' }}>Advanced Features</h2>
      <ul>
        <li><Link to="/function-calling">Function Calling</Link></li>
        <li><Link to="/audio-visualizer">Audio Visualizer</Link></li>
        <li><Link to="/viseme">Viseme for Custom Avatar</Link></li>
      </ul>

      <footer style={{ marginTop: '50px', padding: '20px 0', borderTop: '1px solid #ddd', fontSize: '14px', color: '#666' }}>
        <p>
          <a href="https://iloveagents.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#0078d4', textDecoration: 'none' }}>
            iLoveAgents.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
