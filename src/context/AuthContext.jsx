// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
// Correct import path for authApi functions from the modular setup
import { loginUser, logoutUser, verifyToken } from '../services/api/authApi';

// Create a React Context for authentication
const AuthContext = createContext(null);

// AuthProvider component will wrap your application and manage the auth state
export const AuthProvider = ({ children }) => {
    // `user` state will store the authenticated user's object { id, username, role }
    const [user, setUser] = useState(null);
    // `loading` state indicates if the initial authentication check is in progress
    const [loading, setLoading] = useState(true);

    // useEffect to run once on component mount to check for a stored user session
    useEffect(() => {
        const checkSessionAndLoadUser = async () => {
            setLoading(true); // Start loading

            try {
                // Call the backend to verify the httpOnly cookie session
                const { isValid, user: verifiedUser } = await verifyToken();

                if (isValid && verifiedUser) {
                    setUser(verifiedUser); // Set user state from verified backend data
                    // Optionally, store user data in localStorage for display purposes
                    // BUT the source of truth for authentication is the backend session itself.
                    localStorage.setItem('currentUser', JSON.stringify(verifiedUser));
                } else {
                    // If session is not valid or no user returned, clear any stale data
                    setUser(null);
                    localStorage.removeItem('currentUser');
                }
            } catch (error) {
                // This catch block will primarily handle network errors or unexpected issues from verifyToken,
                // as 401s are typically handled by the axios interceptor.
                console.error("Failed to verify session during initial load:", error);
                setUser(null);
                localStorage.removeItem('currentUser');
            } finally {
                setLoading(false); // Finished initial loading check
            }
        };

        checkSessionAndLoadUser();
    }, []); // Empty dependency array means this runs only once on mount

    /**
     * Handles the login process by calling the backend API.
     * Updates the global user state and stores user data in localStorage.
     * @param {string} username - The username for login.
     * @param {string} password - The password for login.
     * @returns {Promise<boolean>} - True if login is successful, throws error otherwise.
     */
    const login = async (username, password) => {
        setLoading(true);
        try {
            const data = await loginUser(username, password);
            // On successful login, update user state with data from backend response
            setUser(data.user);
            // Store user data in localStorage for persistence (display only, not auth truth)
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            return true; // Indicate success
        } catch (error) {
            console.error("Login failed in AuthContext:", error);
            setUser(null); // Clear user state on failed login
            localStorage.removeItem('currentUser'); // Clear any stale data
            // It's important to re-throw the error so components using this can catch it
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handles the logout process by calling the backend API.
     * Clears the global user state and removes user data from localStorage.
     * @returns {Promise<void>}
     */
    const logout = async () => {
        setLoading(true);
        try {
            await logoutUser(); // Call the backend logout endpoint (clears httpOnly cookie)
            setUser(null); // Clear user state
            localStorage.removeItem('currentUser'); // Clear localStorage (for display persistence)
        } catch (error) {
            console.error("Logout failed in AuthContext:", error);
            // Even if backend logout fails, clear frontend state for a consistent UX
            setUser(null);
            localStorage.removeItem('currentUser');
            throw error; // Re-throw the error
        } finally {
            setLoading(false);
        }
    };

    /**
     * Helper function to check if the current user has any of the specified roles.
     * @param {string[]} roles - An array of roles to check against (e.g., ['admin', 'superadmin']).
     * @returns {boolean} - True if the user has at least one of the roles, false otherwise.
     */
    const hasRole = (roles) => {
        // Ensure user and user.role exist before checking
        if (!user || !user.role) {
            return false;
        }
        // Ensure roles is an array
        if (!Array.isArray(roles)) {
            console.warn("hasRole was called with a non-array argument for roles:", roles);
            return false;
        }
        return roles.includes(user.role);
    };

    // The value provided by the AuthContext to its consumers
    const value = {
        user, // Current user object
        loading, // Is authentication check ongoing?
        login, // Login function
        logout, // Logout function
        isAuthenticated: !!user, // Convenience boolean: true if a user object exists
        hasRole, // Role checking utility
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the AuthContext in any functional component
export const useAuth = () => {
    const context = useContext(AuthContext);
    // Throw an error if useAuth is used outside of an AuthProvider
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
