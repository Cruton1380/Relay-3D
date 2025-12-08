// frontend/components/biometrics/BiometricStatus.jsx
import React, { useEffect, useState } from 'react';
import { checkReverificationStatus } from '../../services/biometricAPI';

function BiometricStatus() {
  const [status, setStatus] = useState({
    reverificationNeeded: false,
    lastVerified: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await checkReverificationStatus();
        setStatus({
          reverificationNeeded: result.reverificationNeeded,
          lastVerified: result.lastVerified,
          loading: false,
          error: null
        });
      } catch (error) {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to check biometric status'
        }));
      }
    }

    checkStatus();
  }, []);

  if (status.loading) {
    return <div>Checking biometric status...</div>;
  }

  if (status.error) {
    return <div className="error">Error: {status.error}</div>;
  }

  return (
    <div className="biometric-status">
      <h3>Biometric Status</h3>
      {status.reverificationNeeded ? (
        <div className="warning">
          Biometric reverification needed
        </div>
      ) : (
        <div className="success">
          Biometric verification up to date
          {status.lastVerified && (
            <div className="text-sm">
              Last verified: {new Date(status.lastVerified).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BiometricStatus;

