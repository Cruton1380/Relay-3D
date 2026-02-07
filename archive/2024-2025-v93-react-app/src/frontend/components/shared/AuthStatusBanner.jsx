// frontend/components/shared/AuthStatusBanner.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

function AuthStatusBanner() {
  const { isAuthenticated, authLevel, user } = useAuth();
  
  if (!isAuthenticated) {
    return null;
  }
  
  const authLevelLabel = {
    'basic': 'Basic Authentication',
    'elevated': 'Elevated Authentication',
    'strict': 'Strict Authentication',
    'none': 'Not Authenticated'
  }[authLevel] || 'Unknown Level';
  
  return (
    <div className="auth-status-banner">
      <div className="flex items-center justify-between bg-blue-100 p-2 text-sm">
        <div className="flex items-center">
          <div className="font-medium mr-2">Status:</div>
          <div className="auth-level">{authLevelLabel}</div>
        </div>
        {user && (
          <div className="user-info">
            <span className="font-medium">User:</span> {user}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthStatusBanner;

