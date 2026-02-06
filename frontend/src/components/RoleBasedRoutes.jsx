import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RoleBasedRoutes({ children }) {
  const { user } = useAuth();
  const userRole = user?.role;

  // Role-based route redirects
  const getRoleBasedRoute = () => {
    switch (userRole) {
      case 'doctor':
        return '/doctor-dashboard';
      case 'staff':
        return '/staff-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/dashboard';
    }
  };

  // If user is logged in and trying to access root, redirect to role-specific dashboard
  if (window.location.pathname === '/' && user) {
    return <Navigate to={getRoleBasedRoute()} replace />;
  }

  // Render children if no redirect needed
  return <>{children}</>;
}
