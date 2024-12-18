import React, { ComponentType } from 'react';
import { Route, Navigate } from 'react-router-dom';

const ProtectedRoute = ({ component: Component, ...rest }: { component: ComponentType<any> }) => {
  const isAuthenticated = true; // Replace with actual authentication logic

  return (
    <Route
      {...rest}
      element={isAuthenticated ? <Component /> : <Navigate to="/login" />}
    />
  );
};

export default ProtectedRoute;