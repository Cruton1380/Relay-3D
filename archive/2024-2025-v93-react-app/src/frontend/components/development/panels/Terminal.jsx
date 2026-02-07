import React, { useState, useEffect, useRef } from 'react';
import './Terminal.css';

const Terminal = () => {
  const [history, setHistory] = useState([
    { type: 'output', content: 'Relay Development Terminal v1.0.0' },
    { type: 'output', content: 'Type "help" for available commands.' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    // Auto-focus terminal input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = (command) => {
    const cmd = command.trim().toLowerCase();
    
    // Add command to history
    setHistory(prev => [...prev, { type: 'command', content: `$ ${command}` }]);
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Execute command
    let output = '';
    
    switch (cmd) {
      case 'help':
        output = `Available commands:
  help          - Show this help message
  clear         - Clear terminal
  ls            - List files in current directory
  pwd           - Show current directory
  ps            - Show running processes
  status        - Show system status
  logs          - Show recent logs
  test          - Run test suite
  build         - Build project
  deploy        - Deploy application
  git status    - Git repository status
  npm start     - Start development server
  npm test      - Run tests
  npm build     - Build for production`;
        break;
      
      case 'clear':
        setHistory([]);
        return;
      
      case 'ls':
        output = `src/
  backend/
    routes/
    services/
    utils/
  frontend/
    components/
    pages/
    hooks/
package.json
README.md
vite.config.js`;
        break;
      
      case 'pwd':
        output = '/workspace/relay-codebase';
        break;
      
      case 'ps':
        output = `PID    COMMAND
1234   node src/backend/server.mjs
5678   vite --port 5174
9012   nodemon src/backend/server.mjs`;
        break;
      
      case 'status':
        output = `System Status:
✓ Backend Server: Running (Port 3002)
✓ Frontend Server: Running (Port 5174)
✓ Database: Connected
✓ Blockchain: Synced (1218 blocks)
✓ WebSocket: Active connections: 0`;
        break;
      
      case 'logs':
        output = `[INFO] Server running on port 3002
[INFO] WebSocket server available at ws://localhost:3002
[INFO] Session vote counts restored
[INFO] Blockchain service created
[DEBUG] Vote processed successfully`;
        break;
      
      case 'test':
        output = `Running test suite...
✓ Vote button component tests (5 passed)
✓ Backend API tests (12 passed)
✓ Blockchain integration tests (8 passed)
✓ All tests passed! (25/25)`;
        break;
      
      case 'build':
        output = `Building for production...
✓ Analyzing bundle
✓ Optimizing assets
✓ Generating service worker
✓ Build complete! Output: dist/`;
        break;
      
      case 'git status':
        output = `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   src/frontend/components/development/WorkspaceLayout.jsx
  new file:   src/frontend/components/development/panels/

no changes added to commit`;
        break;
      
      case 'npm start':
        output = `Starting development servers...
✓ Backend server started on port 3002
✓ Frontend server started on port 5174
✓ Development environment ready`;
        break;
      
      default:
        if (cmd.startsWith('npm ') || cmd.startsWith('git ') || cmd.startsWith('node ')) {
          output = `Executing: ${command}...
Command executed successfully.`;
        } else {
          output = `Command not found: ${cmd}
Type 'help' for available commands.`;
        }
    }
    
    setHistory(prev => [...prev, { type: 'output', content: output }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (currentInput.trim()) {
        executeCommand(currentInput);
      }
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="terminal" onClick={handleTerminalClick}>
      <div className="terminal-header">
        <div className="terminal-controls">
          <span className="terminal-control close"></span>
          <span className="terminal-control minimize"></span>
          <span className="terminal-control maximize"></span>
        </div>
        <div className="terminal-title">Relay Terminal</div>
      </div>
      
      <div className="terminal-content" ref={terminalRef}>
        {history.map((entry, index) => (
          <div key={index} className={`terminal-line ${entry.type}`}>
            <pre>{entry.content}</pre>
          </div>
        ))}
        
        <div className="terminal-input-line">
          <span className="terminal-prompt">$ </span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyPress}
            className="terminal-input"
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;
