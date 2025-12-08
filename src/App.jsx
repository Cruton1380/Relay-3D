/**
 * RELAY INTEGRATION - V40 FRONTEND + CURSORNEW SECURITY BACKEND
 * 
 * Complete integration with:
 * - V40 channel generator, voting interface, candidate cubes
 * - CursorNew secure blockchain/hashgraph backend
 * - Integrated into RelayCodeBase-Integrated
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import workspace components from modern frontend
import RelayMainApp from './frontend/components/main/RelayMainApp.jsx';
import { ModeProvider } from './frontend/context/ModeContext.jsx';
import { WindowManagementProvider } from './frontend/context/WindowManagementContext.jsx';

// Error boundary for debugging
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Integration Error:', error, errorInfo);
    console.error('Full error details:', {
      error: error.toString(),
      stack: error.stack,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontSize: '16px' }}>
          <h2>V40 + CursorNew Integration Error</h2>
          <p>Error loading integrated system:</p>
          <pre style={{ backgroundColor: '#2a2a2a', padding: '10px', fontSize: '12px' }}>{this.state.error?.message}</pre>
          <details>
            <summary>Full Stack Trace</summary>
            <pre style={{ backgroundColor: '#2a2a2a', padding: '10px', fontSize: '10px' }}>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Reload Integration
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Integrated system component
const IntegratedSystem = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      overflow: 'hidden'
    }}>
      <ModeProvider>
        <WindowManagementProvider>
          <RelayMainApp />
        </WindowManagementProvider>
      </ModeProvider>
    </div>
  );
};

// Clean integration app with V40 frontend + CursorNew backend
const App = () => {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <div style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}>
          <Routes>
            <Route path="/" element={<IntegratedSystem />} />
            <Route path="*" element={<IntegratedSystem />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppErrorBoundary>
  );
};

export default App;
