import React, { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ component: Component }: { component: ComponentType<any> }) => {
  const isAuthenticated = true; // Replace with actual authentication logic

  return isAuthenticated ? <Component /> : <Navigate to="/login" />;
};

export default ProtectedRoute;