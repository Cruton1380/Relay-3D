// frontend/pages/index.jsx
import { AuthProvider } from '../auth/context/AuthProvider';
import AuthStatusBanner from '../components/shared/AuthStatusBanner';

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <AuthStatusBanner />
        <header className="app-header">
          <h1>Relay Platform</h1>
        </header>
        <main className="container">
          {/* Main app content will go here */}
          <p>Welcome to the Relay Platform</p>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;

