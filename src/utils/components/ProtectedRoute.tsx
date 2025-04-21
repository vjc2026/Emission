import React, { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';

export interface ProtectedRouteProps {
  component: ComponentType<any>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component }) => {
  const isAuthenticated = true; // Replace with actual authentication logic

  return isAuthenticated ? <Component /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
