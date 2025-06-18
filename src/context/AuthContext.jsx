// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, logoutUser } from '../services/api'; // Make sure this path is correct

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
        const checkStoredUser = () => {
            try {
                // Attempt to retrieve user data from localStorage
                // This helps in persisting the user's view of being logged in across page refreshes.
                // The actual session validity is still managed by the httpOnly cookie on the backend.
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                }
            } catch (e) {
                console.error("Failed to parse stored user data:", e);
                // Clear localStorage if data is corrupted
                localStorage.removeItem('currentUser');
                setUser(null);
            } finally {
                setLoading(false); // Finished initial loading check
            }
        };

        checkStoredUser();
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
            // Store user data in localStorage for persistence
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
            await logoutUser(); // Call the backend logout endpoint
            setUser(null); // Clear user state
            localStorage.removeItem('currentUser'); // Clear localStorage
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