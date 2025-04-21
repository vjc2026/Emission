import React, { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';

// Updated to work with Next.js and React Router v6
const ProtectedRoute = ({ component: Component, ...rest }: { component: ComponentType<any> }) => {
  const isAuthenticated = true; // Replace with actual authentication logic

  // Instead of using <Route>, directly return the component or Navigate
  return isAuthenticated ? <Component /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
