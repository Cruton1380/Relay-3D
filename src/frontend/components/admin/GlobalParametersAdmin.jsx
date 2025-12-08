//frontend/js/components/GlobalParametersAdmin.js
import { useState, useEffect } from 'react';
import { 
  getAllParameters,
  voteOnParameter,
  getVotingStatus
} from "../../services/globalParametersAPI";

function GlobalParametersAdmin() {
  const [parameters, setParameters] = useState({});
  const [votingStatus, setVotingStatus] = useState({});
  const [activeParam, setActiveParam] = useState(null);
  const [proposedValue, setProposedValue] = useState('');
  
  useEffect(() => {
    fetchParameters();
  }, []);
  
  async function fetchParameters() {
    const response = await getAllParameters();
    if (response.success) {
      setParameters(response.parameters);
    }
  }
  
  async function fetchVotingStatus(paramName) {
    const response = await getVotingStatus(paramName);
    if (response.success) {
      setVotingStatus(prev => ({
        ...prev,
        [paramName]: response
      }));
    }
  }
  
  async function handleVote() {
    if (!activeParam) return;
    
    // Convert value to appropriate type
    let typedValue = proposedValue;
    if (typeof parameters[activeParam] === 'number') {
      typedValue = Number(proposedValue);
    } else if (typeof parameters[activeParam] === 'boolean') {
      typedValue = proposedValue === 'true';
    }
    
    const response = await voteOnParameter(activeParam, typedValue);
    if (response.success) {
      alert(`Vote recorded for ${activeParam}`);
      fetchVotingStatus(activeParam);
      if (response.action === 'parameter_changed') {
        fetchParameters();
      }
    } else {
      alert(`Error: ${response.error}`);
    }
  }
  
  function handleParamSelect(paramName) {
    setActiveParam(paramName);
    setProposedValue(parameters[paramName].toString());
    fetchVotingStatus(paramName);
  }
  
  return (
    <div className="global-parameters-admin">
      <h2>Global Parameters</h2>
      
      <div className="parameters-list">
        <h3>Current Parameters</h3>
        <table>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(parameters).map(([name, value]) => (
              <tr key={name} className={activeParam === name ? 'active' : ''}>
                <td>{name}</td>
                <td>{value.toString()}</td>
                <td>
                  <button onClick={() => handleParamSelect(name)}>
                    Propose Change
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {activeParam && (
        <div className="parameter-voting">
          <h3>Propose Change to {activeParam}</h3>
          <div className="current-value">
            Current value: {parameters[activeParam]}
          </div>
          
          <div className="propose-form">
            <label>
              Proposed value:
              <input 
                type={typeof parameters[activeParam] === 'number' ? 'number' : 'text'}
                value={proposedValue}
                onChange={e => setProposedValue(e.target.value)}
              />
            </label>
            <button onClick={handleVote}>Submit Vote</button>
          </div>
          
          {votingStatus[activeParam] && (
            <div className="voting-status">
              <h4>Voting Status</h4>
              <p>
                Total votes: {votingStatus[activeParam].votes} / 
                {votingStatus[activeParam].requiredVotes} required
              </p>
              
              <h4>Current Proposals</h4>
              <ul>
                {votingStatus[activeParam].proposals.map((prop, index) => (
                  <li key={index}>
                    Value: {prop.value.toString()} - 
                    Votes: {prop.votes} (Weighted: {prop.weightedVotes.toFixed(2)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalParametersAdmin;
