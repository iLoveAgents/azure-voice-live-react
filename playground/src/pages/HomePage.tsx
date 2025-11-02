import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div>
      <h1>Azure Voice Live React - Examples</h1>
      <p>Simple examples for Azure AI Voice Live API</p>
      <ul>
        <li><Link to="/voice-basic">Voice Chat - Simple</Link></li>
        <li><Link to="/avatar-advanced">Avatar - Advanced Config</Link></li>
      </ul>
    </div>
  );
}
