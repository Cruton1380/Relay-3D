/**
 * JURY REVIEW DASHBOARD
 * Secure interface for jurors to review flagged accounts and make decisions
 * Supports encrypted deliberation and anonymized evidence presentation
 */

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Eye, MessageSquare, Vote, Clock, MapPin, Users, AlertTriangle } from 'lucide-react';

const JuryReviewDashboard = ({ caseId, jurorId, onVoteSubmit, onDeliberationMessage }) => {
  const [caseData, setCaseData] = useState(null);
  const [jurorStatus, setJurorStatus] = useState('reviewing');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [deliberationMessages, setDeliberationMessages] = useState([]);
  const [votingDecision, setVotingDecision] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [encryptedChannel, setEncryptedChannel] = useState(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    loadCaseData();
    initializeEncryptedChannel();
    startDeliberationTimer();
  }, [caseId, jurorId]);

  const loadCaseData = async () => {
    try {
      const response = await fetch(`/api/jury/case/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${jurorId}`,
          'X-Jury-Access': 'encrypted'
        }
      });
      
      const data = await response.json();
      setCaseData(data);
      
      console.log(`[JURY_DASHBOARD] Loaded case data for ${caseId}`);
    } catch (error) {
      console.error('[JURY_DASHBOARD] Failed to load case data:', error);
    }
  };

  const initializeEncryptedChannel = async () => {
    // Initialize end-to-end encrypted deliberation channel
    const channel = await createEncryptedChannel(caseId, jurorId);
    setEncryptedChannel(channel);
    
    // Listen for deliberation messages
    channel.onMessage = (encryptedMessage) => {
      const decryptedMessage = decryptDeliberationMessage(encryptedMessage);
      setDeliberationMessages(prev => [...prev, decryptedMessage]);
    };
  };

  const startDeliberationTimer = () => {
    // Calculate time remaining for deliberation
    const deliberationDeadline = caseData?.deliberationDeadline || Date.now() + 24 * 60 * 60 * 1000;
    const remaining = deliberationDeadline - Date.now();
    setTimeRemaining(remaining);
    
    // Update timer every minute
    const timer = setInterval(() => {
      const newRemaining = deliberationDeadline - Date.now();
      setTimeRemaining(newRemaining);
      
      if (newRemaining <= 0) {
        clearInterval(timer);
        handleDeliberationTimeout();
      }
    }, 60000);
    
    return () => clearInterval(timer);
  };

  const handleEvidenceSelect = (evidenceItem) => {
    setSelectedEvidence(evidenceItem);
  };

  const handleDeliberationSubmit = async () => {
    const message = messageInputRef.current?.value;
    if (!message || !encryptedChannel) return;

    const encryptedMessage = await encryptDeliberationMessage(message, caseId);
    await encryptedChannel.send(encryptedMessage);
    
    messageInputRef.current.value = '';
  };

  const handleVoteSubmit = async (decision) => {
    setVotingDecision(decision);
    
    const voteData = {
      caseId,
      jurorId,
      decision,
      timestamp: Date.now(),
      evidenceReviewed: caseData?.evidence?.map(e => e.id) || [],
      deliberationParticipation: deliberationMessages.length > 0
    };
    
    await onVoteSubmit(voteData);
    setJurorStatus('voted');
    
    console.log(`[JURY_DASHBOARD] Vote submitted: ${decision}`);
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return 'Expired';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const renderEvidencePanel = () => {
    if (!caseData?.evidence) return null;

    return (
      <div className=\"bg-white rounded-lg shadow-md p-6\">\n        <h3 className=\"text-lg font-semibold mb-4 flex items-center\">\n          <Eye className=\"w-5 h-5 mr-2\" />\n          Anonymized Evidence\n        </h3>\n        \n        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n          {caseData.evidence.map((evidence, index) => (\n            <div \n              key={evidence.id}\n              className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${\n                selectedEvidence?.id === evidence.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'\n              }`}\n              onClick={() => handleEvidenceSelect(evidence)}\n            >\n              <div className=\"flex items-center justify-between mb-2\">\n                <span className=\"font-medium text-sm\">{evidence.type}</span>\n                <span className={`px-2 py-1 rounded text-xs ${\n                  evidence.severity === 'high' ? 'bg-red-100 text-red-800' :\n                  evidence.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :\n                  'bg-green-100 text-green-800'\n                }`}>\n                  {evidence.severity}\n                </span>\n              </div>\n              \n              <p className=\"text-sm text-gray-600 mb-2\">{evidence.description}</p>\n              \n              <div className=\"flex items-center text-xs text-gray-500\">\n                <MapPin className=\"w-3 h-3 mr-1\" />\n                {evidence.location?.region || 'Regional'}\n                <Clock className=\"w-3 h-3 ml-3 mr-1\" />\n                {new Date(evidence.timestamp).toLocaleDateString()}\n              </div>\n            </div>\n          ))}\n        </div>\n        \n        {selectedEvidence && (\n          <div className=\"mt-6 p-4 bg-gray-50 rounded-lg\">\n            <h4 className=\"font-medium mb-2\">Evidence Details</h4>\n            <div className=\"text-sm space-y-2\">\n              <div><strong>Type:</strong> {selectedEvidence.type}</div>\n              <div><strong>Detected:</strong> {new Date(selectedEvidence.timestamp).toLocaleString()}</div>\n              <div><strong>Confidence:</strong> {selectedEvidence.confidence}%</div>\n              <div><strong>Related Accounts:</strong> {selectedEvidence.relatedAccounts || 'None detected'}</div>\n              <div><strong>Pattern Analysis:</strong> {selectedEvidence.patternAnalysis}</div>\n              \n              {selectedEvidence.metadata && (\n                <div className=\"mt-3\">\n                  <strong>Technical Metadata:</strong>\n                  <pre className=\"mt-1 p-2 bg-white rounded text-xs overflow-x-auto\">\n                    {JSON.stringify(selectedEvidence.metadata, null, 2)}\n                  </pre>\n                </div>\n              )}\n            </div>\n          </div>\n        )}\n      </div>\n    );\n  };

  const renderDeliberationPanel = () => {\n    return (\n      <div className=\"bg-white rounded-lg shadow-md p-6\">\n        <h3 className=\"text-lg font-semibold mb-4 flex items-center\">\n          <MessageSquare className=\"w-5 h-5 mr-2\" />\n          Encrypted Deliberation\n          <span className=\"ml-auto text-sm font-normal text-gray-500\">\n            End-to-end encrypted\n          </span>\n        </h3>\n        \n        <div className=\"bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4\">\n          {deliberationMessages.length === 0 ? (\n            <p className=\"text-gray-500 text-center py-8\">No messages yet. Start the deliberation.</p>\n          ) : (\n            deliberationMessages.map((message, index) => (\n              <div key={index} className=\"mb-3 p-3 bg-white rounded shadow-sm\">\n                <div className=\"flex items-center justify-between mb-1\">\n                  <span className=\"text-sm font-medium\">Juror #{message.jurorNumber}</span>\n                  <span className=\"text-xs text-gray-500\">\n                    {new Date(message.timestamp).toLocaleTimeString()}\n                  </span>\n                </div>\n                <p className=\"text-sm\">{message.content}</p>\n              </div>\n            ))\n          )}\n        </div>\n        \n        <div className=\"flex space-x-2\">\n          <input\n            ref={messageInputRef}\n            type=\"text\"\n            placeholder=\"Share your thoughts with fellow jurors...\"\n            className=\"flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500\"\n            onKeyPress={(e) => e.key === 'Enter' && handleDeliberationSubmit()}\n            disabled={jurorStatus === 'voted'}\n          />\n          <button\n            onClick={handleDeliberationSubmit}\n            disabled={jurorStatus === 'voted'}\n            className=\"px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed\"\n          >\n            Send\n          </button>\n        </div>\n        \n        <div className=\"mt-3 text-xs text-gray-500\">\n          <Shield className=\"w-3 h-3 inline mr-1\" />\n          All messages are end-to-end encrypted and automatically deleted after case resolution.\n        </div>\n      </div>\n    );\n  };

  const renderVotingPanel = () => {\n    if (jurorStatus === 'voted') {\n      return (\n        <div className=\"bg-green-50 border border-green-200 rounded-lg p-6\">\n          <h3 className=\"text-lg font-semibold text-green-800 mb-2 flex items-center\">\n            <Vote className=\"w-5 h-5 mr-2\" />\n            Vote Submitted\n          </h3>\n          <p className=\"text-green-700\">\n            Thank you for your service. Your decision: <strong>{votingDecision}</strong>\n          </p>\n          <p className=\"text-sm text-green-600 mt-2\">\n            You will receive a civic contribution badge once the case is resolved.\n          </p>\n        </div>\n      );\n    }\n\n    return (\n      <div className=\"bg-white rounded-lg shadow-md p-6\">\n        <h3 className=\"text-lg font-semibold mb-4 flex items-center\">\n          <Vote className=\"w-5 h-5 mr-2\" />\n          Cast Your Vote\n        </h3>\n        \n        <div className=\"space-y-4\">\n          <div className=\"text-sm text-gray-600 mb-4\">\n            After reviewing the evidence and participating in deliberation, please cast your vote:\n          </div>\n          \n          <div className=\"grid grid-cols-1 gap-3\">\n            <button\n              onClick={() => handleVoteSubmit('no_action')}\n              className=\"p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left transition-colors\"\n            >\n              <div className=\"flex items-center\">\n                <div className=\"w-4 h-4 rounded-full bg-green-500 mr-3\"></div>\n                <div>\n                  <div className=\"font-medium text-green-800\">✅ No Action</div>\n                  <div className=\"text-sm text-green-600\">False positive - restore account immediately</div>\n                </div>\n              </div>\n            </button>\n            \n            <button\n              onClick={() => handleVoteSubmit('reverify')}\n              className=\"p-4 border border-yellow-200 rounded-lg hover:bg-yellow-50 text-left transition-colors\"\n            >\n              <div className=\"flex items-center\">\n                <div className=\"w-4 h-4 rounded-full bg-yellow-500 mr-3\"></div>\n                <div>\n                  <div className=\"font-medium text-yellow-800\">🟡 Physical Re-verification</div>\n                  <div className=\"text-sm text-yellow-600\">Send user to proximity location verification</div>\n                </div>\n              </div>\n            </button>\n            \n            <button\n              onClick={() => handleVoteSubmit('escalate')}\n              className=\"p-4 border border-red-200 rounded-lg hover:bg-red-50 text-left transition-colors\"\n            >\n              <div className=\"flex items-center\">\n                <div className=\"w-4 h-4 rounded-full bg-red-500 mr-3\"></div>\n                <div>\n                  <div className=\"font-medium text-red-800\">❌ Escalate for Suspension</div>\n                  <div className=\"text-sm text-red-600\">Serious anomaly detected - escalate to admin review</div>\n                </div>\n              </div>\n            </button>\n          </div>\n        </div>\n        \n        <div className=\"mt-6 p-3 bg-blue-50 rounded-lg\">\n          <div className=\"flex items-center text-blue-800\">\n            <AlertTriangle className=\"w-4 h-4 mr-2\" />\n            <span className=\"text-sm font-medium\">Remember:</span>\n          </div>\n          <ul className=\"text-sm text-blue-700 mt-1 ml-6 space-y-1\">\n            <li>• Focus on protecting genuine users from false positives</li>\n            <li>• Physical verification is preferred over suspension</li>\n            <li>• Your decision contributes to community trust</li>\n          </ul>\n        </div>\n      </div>\n    );\n  };

  if (!caseData) {\n    return (\n      <div className=\"flex items-center justify-center h-64\">\n        <div className=\"text-center\">\n          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4\"></div>\n          <p className=\"text-gray-600\">Loading case data...</p>\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"max-w-6xl mx-auto p-6\">\n      {/* Header */}\n      <div className=\"bg-white rounded-lg shadow-md p-6 mb-6\">\n        <div className=\"flex items-center justify-between\">\n          <div>\n            <h1 className=\"text-2xl font-bold text-gray-900\">\n              Jury Review Dashboard\n            </h1>\n            <p className=\"text-gray-600\">\n              Case #{caseData.caseId} • {caseData.caseType} • Region: {caseData.region}\n            </p>\n          </div>\n          \n          <div className=\"text-right\">\n            <div className=\"flex items-center text-sm text-gray-500 mb-1\">\n              <Clock className=\"w-4 h-4 mr-1\" />\n              {formatTimeRemaining(timeRemaining)}\n            </div>\n            <div className=\"flex items-center text-sm text-gray-500\">\n              <Users className=\"w-4 h-4 mr-1\" />\n              {caseData.jurySize} jurors selected\n            </div>\n          </div>\n        </div>\n        \n        <div className=\"mt-4 flex items-center space-x-4\">\n          <span className={`px-3 py-1 rounded-full text-sm ${\n            jurorStatus === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :\n            jurorStatus === 'deliberating' ? 'bg-blue-100 text-blue-800' :\n            'bg-green-100 text-green-800'\n          }`}>\n            {jurorStatus === 'reviewing' ? 'Reviewing Evidence' :\n             jurorStatus === 'deliberating' ? 'In Deliberation' :\n             'Vote Submitted'}\n          </span>\n          \n          <span className=\"text-sm text-gray-500\">\n            Juror ID: #{caseData.jurorNumber} (anonymized)\n          </span>\n        </div>\n      </div>\n\n      {/* Main Content */}\n      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n        {/* Left Column */}\n        <div className=\"space-y-6\">\n          {renderEvidencePanel()}\n        </div>\n        \n        {/* Right Column */}\n        <div className=\"space-y-6\">\n          {renderDeliberationPanel()}\n          {renderVotingPanel()}\n        </div>\n      </div>\n    </div>\n  );\n};\n\n// Helper functions for encryption (mock implementations)\nconst createEncryptedChannel = async (caseId, jurorId) => {\n  // Mock encrypted channel - would use actual E2E encryption\n  return {\n    send: async (message) => {\n      console.log(`[ENCRYPTED_CHANNEL] Sending message for case ${caseId}`);\n    },\n    onMessage: null\n  };\n};\n\nconst encryptDeliberationMessage = async (message, caseId) => {\n  // Mock encryption - would use actual E2E encryption\n  return {\n    encryptedContent: btoa(message), // Mock encryption\n    timestamp: Date.now(),\n    caseId\n  };\n};\n\nconst decryptDeliberationMessage = (encryptedMessage) => {\n  // Mock decryption - would use actual E2E decryption\n  return {\n    content: atob(encryptedMessage.encryptedContent),\n    timestamp: encryptedMessage.timestamp,\n    jurorNumber: Math.floor(Math.random() * 9) + 1 // Mock juror number\n  };\n};\n\nexport default JuryReviewDashboard;"
  },
  {
    "filePath": "c:\\Users\\eitana\\Desktop\\RelayCodeBase\\frontend\\components\\juryReviewDashboard.jsx"
  }
]

Let me fix the file creation:

<function_calls>
<invoke name="create_file">
<parameter name="content">/**
 * JURY REVIEW DASHBOARD
 * Secure interface for jurors to review flagged accounts and make decisions
 * Supports encrypted deliberation and anonymized evidence presentation
 */

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Eye, MessageSquare, Vote, Clock, MapPin, Users, AlertTriangle } from 'lucide-react';

const JuryReviewDashboard = ({ caseId, jurorId, onVoteSubmit, onDeliberationMessage }) => {
  const [caseData, setCaseData] = useState(null);
  const [jurorStatus, setJurorStatus] = useState('reviewing');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [deliberationMessages, setDeliberationMessages] = useState([]);
  const [votingDecision, setVotingDecision] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [encryptedChannel, setEncryptedChannel] = useState(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    loadCaseData();
    initializeEncryptedChannel();
    startDeliberationTimer();
  }, [caseId, jurorId]);

  const loadCaseData = async () => {
    try {
      const response = await fetch(`/api/jury/case/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${jurorId}`,
          'X-Jury-Access': 'encrypted'
        }
      });
      
      const data = await response.json();
      setCaseData(data);
      
      console.log(`[JURY_DASHBOARD] Loaded case data for ${caseId}`);
    } catch (error) {
      console.error('[JURY_DASHBOARD] Failed to load case data:', error);
    }
  };

  const initializeEncryptedChannel = async () => {
    // Initialize end-to-end encrypted deliberation channel
    const channel = await createEncryptedChannel(caseId, jurorId);
    setEncryptedChannel(channel);
    
    // Listen for deliberation messages
    channel.onMessage = (encryptedMessage) => {
      const decryptedMessage = decryptDeliberationMessage(encryptedMessage);
      setDeliberationMessages(prev => [...prev, decryptedMessage]);
    };
  };

  const startDeliberationTimer = () => {
    // Calculate time remaining for deliberation
    const deliberationDeadline = caseData?.deliberationDeadline || Date.now() + 24 * 60 * 60 * 1000;
    const remaining = deliberationDeadline - Date.now();
    setTimeRemaining(remaining);
    
    // Update timer every minute
    const timer = setInterval(() => {
      const newRemaining = deliberationDeadline - Date.now();
      setTimeRemaining(newRemaining);
      
      if (newRemaining <= 0) {
        clearInterval(timer);
        handleDeliberationTimeout();
      }
    }, 60000);
    
    return () => clearInterval(timer);
  };

  const handleEvidenceSelect = (evidenceItem) => {
    setSelectedEvidence(evidenceItem);
  };

  const handleDeliberationSubmit = async () => {
    const message = messageInputRef.current?.value;
    if (!message || !encryptedChannel) return;

    const encryptedMessage = await encryptDeliberationMessage(message, caseId);
    await encryptedChannel.send(encryptedMessage);
    
    messageInputRef.current.value = '';
  };

  const handleVoteSubmit = async (decision) => {
    setVotingDecision(decision);
    
    const voteData = {
      caseId,
      jurorId,
      decision,
      timestamp: Date.now(),
      evidenceReviewed: caseData?.evidence?.map(e => e.id) || [],
      deliberationParticipation: deliberationMessages.length > 0
    };
    
    await onVoteSubmit(voteData);
    setJurorStatus('voted');
    
    console.log(`[JURY_DASHBOARD] Vote submitted: ${decision}`);
  };

  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return 'Expired';
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const renderEvidencePanel = () => {
    if (!caseData?.evidence) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Anonymized Evidence
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caseData.evidence.map((evidence, index) => (
            <div 
              key={evidence.id}
              className={`border rounded-lg p-4 cursor-pointer hover:bg-blue-50 ${
                selectedEvidence?.id === evidence.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => handleEvidenceSelect(evidence)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{evidence.type}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  evidence.severity === 'high' ? 'bg-red-100 text-red-800' :
                  evidence.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {evidence.severity}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{evidence.description}</p>
              
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="w-3 h-3 mr-1" />
                {evidence.location?.region || 'Regional'}
                <Clock className="w-3 h-3 ml-3 mr-1" />
                {new Date(evidence.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        
        {selectedEvidence && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Evidence Details</h4>
            <div className="text-sm space-y-2">
              <div><strong>Type:</strong> {selectedEvidence.type}</div>
              <div><strong>Detected:</strong> {new Date(selectedEvidence.timestamp).toLocaleString()}</div>
              <div><strong>Confidence:</strong> {selectedEvidence.confidence}%</div>
              <div><strong>Related Accounts:</strong> {selectedEvidence.relatedAccounts || 'None detected'}</div>
              <div><strong>Pattern Analysis:</strong> {selectedEvidence.patternAnalysis}</div>
              
              {selectedEvidence.metadata && (
                <div className="mt-3">
                  <strong>Technical Metadata:</strong>
                  <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedEvidence.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDeliberationPanel = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Encrypted Deliberation
          <span className="ml-auto text-sm font-normal text-gray-500">
            End-to-end encrypted
          </span>
        </h3>
        
        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
          {deliberationMessages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No messages yet. Start the deliberation.</p>
          ) : (
            deliberationMessages.map((message, index) => (
              <div key={index} className="mb-3 p-3 bg-white rounded shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Juror #{message.jurorNumber}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))
          )}
        </div>
        
        <div className="flex space-x-2">
          <input
            ref={messageInputRef}
            type="text"
            placeholder="Share your thoughts with fellow jurors..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleDeliberationSubmit()}
            disabled={jurorStatus === 'voted'}
          />
          <button
            onClick={handleDeliberationSubmit}
            disabled={jurorStatus === 'voted'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        
        <div className="mt-3 text-xs text-gray-500">
          <Shield className="w-3 h-3 inline mr-1" />
          All messages are end-to-end encrypted and automatically deleted after case resolution.
        </div>
      </div>
    );
  };

  const renderVotingPanel = () => {
    if (jurorStatus === 'voted') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center">
            <Vote className="w-5 h-5 mr-2" />
            Vote Submitted
          </h3>
          <p className="text-green-700">
            Thank you for your service. Your decision: <strong>{votingDecision}</strong>
          </p>
          <p className="text-sm text-green-600 mt-2">
            You will receive a civic contribution badge once the case is resolved.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Vote className="w-5 h-5 mr-2" />
          Cast Your Vote
        </h3>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            After reviewing the evidence and participating in deliberation, please cast your vote:
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleVoteSubmit('no_action')}
              className="p-4 border border-green-200 rounded-lg hover:bg-green-50 text-left transition-colors"
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-3"></div>
                <div>
                  <div className="font-medium text-green-800">✅ No Action</div>
                  <div className="text-sm text-green-600">False positive - restore account immediately</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleVoteSubmit('reverify')}
              className="p-4 border border-yellow-200 rounded-lg hover:bg-yellow-50 text-left transition-colors"
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-3"></div>
                <div>
                  <div className="font-medium text-yellow-800">🟡 Physical Re-verification</div>
                  <div className="text-sm text-yellow-600">Send user to proximity location verification</div>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => handleVoteSubmit('escalate')}
              className="p-4 border border-red-200 rounded-lg hover:bg-red-50 text-left transition-colors"
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-3"></div>
                <div>
                  <div className="font-medium text-red-800">❌ Escalate for Suspension</div>
                  <div className="text-sm text-red-600">Serious anomaly detected - escalate to admin review</div>
                </div>
              </div>
            </button>
          </div>
        </div>
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center text-blue-800">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Remember:</span>
          </div>
          <ul className="text-sm text-blue-700 mt-1 ml-6 space-y-1">
            <li>• Focus on protecting genuine users from false positives</li>
            <li>• Physical verification is preferred over suspension</li>
            <li>• Your decision contributes to community trust</li>
          </ul>
        </div>
      </div>
    );
  };

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading case data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Jury Review Dashboard
            </h1>
            <p className="text-gray-600">
              Case #{caseData.caseId} • {caseData.caseType} • Region: {caseData.region}
            </p>
          </div>
          
          <div className="text-right">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Clock className="w-4 h-4 mr-1" />
              {formatTimeRemaining(timeRemaining)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              {caseData.jurySize} jurors selected
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            jurorStatus === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
            jurorStatus === 'deliberating' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {jurorStatus === 'reviewing' ? 'Reviewing Evidence' :
             jurorStatus === 'deliberating' ? 'In Deliberation' :
             'Vote Submitted'}
          </span>
          
          <span className="text-sm text-gray-500">
            Juror ID: #{caseData.jurorNumber} (anonymized)
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {renderEvidencePanel()}
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {renderDeliberationPanel()}
          {renderVotingPanel()}
        </div>
      </div>
    </div>
  );
};

// Helper functions for encryption (mock implementations)
const createEncryptedChannel = async (caseId, jurorId) => {
  // Mock encrypted channel - would use actual E2E encryption
  return {
    send: async (message) => {
      console.log(`[ENCRYPTED_CHANNEL] Sending message for case ${caseId}`);
    },
    onMessage: null
  };
};

const encryptDeliberationMessage = async (message, caseId) => {
  // Mock encryption - would use actual E2E encryption
  return {
    encryptedContent: btoa(message), // Mock encryption
    timestamp: Date.now(),
    caseId
  };
};

const decryptDeliberationMessage = (encryptedMessage) => {
  // Mock decryption - would use actual E2E decryption
  return {
    content: atob(encryptedMessage.encryptedContent),
    timestamp: encryptedMessage.timestamp,
    jurorNumber: Math.floor(Math.random() * 9) + 1 // Mock juror number
  };
};

export default JuryReviewDashboard;
