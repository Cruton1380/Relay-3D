import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';

/**
 * PreviewProtectedRoute component that allows preview mode without authentication
 * If preview=true is in URL params, allows access without auth
 * Otherwise, requires authentication like ProtectedRoute
 */
const PreviewProtectedRoute = ({ children }) => {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  // If in preview mode, allow access without authentication
  if (isPreview) {
    return children;
  }

  // Otherwise, require authentication
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
};

export default PreviewProtectedRoute; 