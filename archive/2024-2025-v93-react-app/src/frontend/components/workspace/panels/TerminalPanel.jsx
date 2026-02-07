/**
 * Terminal Panel - Command Interface
 * Basic terminal stub for development commands
 */
import React, { useState, useRef, useEffect } from 'react';

const TerminalPanel = ({ panel, globeState, setGlobeState, layout, updatePanel }) => {
  const [history, setHistory] = useState([
    { type: 'system', content: 'BASE MODEL 1 Terminal v1.0.0' },
    { type: 'system', content: 'Type "help" for available commands' }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const commands = {
    help: () => [
      { type: 'output', content: 'Available commands:' },
      { type: 'output', content: '  help - Show this help message' },
      { type: 'output', content: '  clear - Clear terminal' },
      { type: 'output', content: '  status - Show system status' },
      { type: 'output', content: '  channels - List active channels' },
      { type: 'output', content: '  zoom <mode> - Change zoom mode' },
      { type: 'output', content: '  layers - Show active layers' },
      { type: 'output', content: '  vote <id> - Cast a vote' }
    ],
    clear: () => {
      setHistory([]);
      return [];
    },
    status: () => [
      { type: 'output', content: `Current Zoom: ${globeState.currentZoom.name}` },
      { type: 'output', content: `Camera Distance: ${globeState.cameraDistance}u` },
      { type: 'output', content: `Selected Channel: ${globeState.selectedChannel?.name || 'None'}` },
      { type: 'output', content: `Float Mode: ${globeState.floatMode ? 'Enabled' : 'Disabled'}` }
    ],
    channels: () => [
      { type: 'output', content: 'Active Channels:' },
      { type: 'output', content: '  1. Sustainable Cities (23,374 votes)' },
      { type: 'output', content: '  2. Tech Innovation (18,293 votes)' },
      { type: 'output', content: '  3. Community Health (15,847 votes)' }
    ],
    layers: () => [
      { type: 'output', content: 'Active Layers:' },
      { type: 'output', content: '  • Channel Towers' },
      { type: 'output', content: '  • Country Boundaries' },
      { type: 'output', content: '  • Voting Activity' }
    ]
  };

  const executeCommand = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Add command to history
    setHistory(prev => [...prev, { type: 'command', content: `$ ${trimmed}` }]);

    // Parse command
    const [cmd, ...args] = trimmed.split(' ');
    
    if (commands[cmd]) {
      const output = commands[cmd](args);
      if (output.length > 0) {
        setHistory(prev => [...prev, ...output]);
      }
    } else if (cmd.startsWith('zoom')) {
      const mode = args[0];
      if (mode) {
        setHistory(prev => [...prev, 
          { type: 'output', content: `Changing zoom to: ${mode}` }
        ]);
      } else {
        setHistory(prev => [...prev, 
          { type: 'error', content: 'Usage: zoom <search|development|channel|region|proximity|map>' }
        ]);
      }
    } else if (cmd.startsWith('vote')) {
      const id = args[0];
      if (id) {
        setHistory(prev => [...prev, 
          { type: 'output', content: `Voting on item: ${id}` }
        ]);
      } else {
        setHistory(prev => [...prev, 
          { type: 'error', content: 'Usage: vote <candidate-id>' }
        ]);
      }
    } else {
      setHistory(prev => [...prev, 
        { type: 'error', content: `Command not found: ${cmd}` }
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when panel is clicked
  const handlePanelClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="terminal-panel"
      onClick={handlePanelClick}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Monaco, "Lucida Console", monospace',
        fontSize: '11px',
        background: '#000000',
        color: '#00ff00'
      }}
    >
      {/* Terminal Output */}
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          background: '#000000'
        }}
      >
        {history.map((line, index) => (
          <div
            key={index}
            style={{
              marginBottom: '2px',
              color: line.type === 'command' ? '#ffff00' :
                     line.type === 'error' ? '#ff4444' :
                     line.type === 'system' ? '#00aaff' :
                     '#00ff00'
            }}
          >
            {line.content}
          </div>
        ))}
      </div>

      {/* Input Line */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        background: '#111111',
        borderTop: '1px solid #333333'
      }}>
        <span style={{ color: '#ffff00', marginRight: '4px' }}>$</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#00ff00',
            fontFamily: 'inherit',
            fontSize: 'inherit'
          }}
          placeholder="Enter command..."
          autoFocus
        />
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '2px 8px',
        background: '#222222',
        borderTop: '1px solid #333333',
        fontSize: '9px',
        color: '#888888',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>BASE MODEL 1</span>
        <span>{history.length} lines</span>
      </div>
    </div>
  );
};

export default TerminalPanel;
