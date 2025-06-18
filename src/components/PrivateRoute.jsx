// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Make sure this path is correct

/**
 * @component PrivateRoute
 * @description A component that acts as a guard for routes.
 * It checks if the user is authenticated and, optionally, if they have required roles.
 * Redirects to /loginForm if not authenticated, or to /unauthorized if role is insufficient.
 * Renders nested routes via <Outlet /> if conditions are met.
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - An array of roles that are permitted to access the route.
 * If not provided, any authenticated user can access.
 */
const PrivateRoute = ({ allowedRoles }) => {
    // Access authentication state and functions from AuthContext
    const { user, loading, isAuthenticated, hasRole } = useAuth();

    // Show a loading indicator while the authentication status is being determined.
    // This prevents flashing unauthorized content or incorrect redirects.
    if (loading) {
        // You can replace this with a more sophisticated loading spinner component if you have one
        return <div style={{ textAlign: 'center', padding: '50px' }}>Loading authentication...</div>; 
    }

    // If the user is not authenticated after the loading period,
    // redirect them to the login page. The `replace` prop prevents adding
    // the current unauthorized route to the history stack.
    if (!isAuthenticated) {
        return <Navigate to="/loginForm" replace />; // Redirect to your existing login form
    }

    // If `allowedRoles` are specified (meaning this route requires specific roles),
    // check if the authenticated user has any of those roles.
    if (allowedRoles && !hasRole(allowedRoles)) {
        // User is authenticated but does not have the necessary permissions.
        // Redirect to an unauthorized access page.
        return <Navigate to="/unauthorized" replace />;
    }

    // If all checks pass (authenticated and authorized),
    // render the nested routes/components that this PrivateRoute is wrapping.
    return <Outlet />;
};

export default PrivateRoute;