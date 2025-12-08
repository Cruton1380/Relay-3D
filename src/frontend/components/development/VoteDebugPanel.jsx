/**
 * Frontend Vote Debug Panel
 * Add this to HomePage to help debug vote button issues
 */

import React, { useState } from 'react';

const VoteDebugPanel = ({ userVotes, voteCounts, onTestVote }) => {
  const [testChannel, setTestChannel] = useState('sustainable-cities');
  const [testCandidate, setTestCandidate] = useState('oriazoulay768');
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message) => {
    setDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectVote = async () => {
    addDebugLog(`Testing direct vote: ${testChannel} -> ${testCandidate}`);
    
    try {
      const response = await fetch('http://localhost:3002/api/vote/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: testChannel,
          candidateId: testCandidate,
          userId: 'demo-user-1',
          action: 'vote'
        })
      });

      const result = await response.json();
      addDebugLog(`Direct vote result: ${JSON.stringify(result)}`);
    } catch (error) {
      addDebugLog(`Direct vote error: ${error.message}`);
    }
  };

  const testParentVote = () => {
    addDebugLog(`Testing parent vote handler: ${testChannel} -> ${testCandidate}`);
    if (onTestVote) {
      onTestVote(testChannel, testCandidate);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '300px',
      maxWidth: '350px',
      maxHeight: '300px',
      overflow: 'auto',
      zIndex: 1000,
      fontSize: '12px',
      fontFamily: 'monospace',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Vote Debug Panel</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current State:</strong><br/>
        User Votes: {JSON.stringify(userVotes)}<br/>
        Vote Counts: {Object.keys(voteCounts).length} entries
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Channel ID"
          value={testChannel}
          onChange={(e) => setTestChannel(e.target.value)}
          style={{ width: '100%', marginBottom: '5px', padding: '4px' }}
        />
        <input
          type="text"
          placeholder="Candidate ID"
          value={testCandidate}
          onChange={(e) => setTestCandidate(e.target.value)}
          style={{ width: '100%', marginBottom: '5px', padding: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={testDirectVote}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            marginRight: '5px',
            cursor: 'pointer'
          }}
        >
          Test Direct Vote
        </button>
        <button
          onClick={testParentVote}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Parent Vote
        </button>
      </div>

      <div style={{ 
        background: '#f8f9fa', 
        padding: '8px', 
        borderRadius: '4px',
        maxHeight: '150px',
        overflow: 'auto'
      }}>
        <strong>Debug Log:</strong><br/>
        {debugLog.map((log, index) => (
          <div key={index} style={{ fontSize: '10px', color: '#666' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteDebugPanel;
