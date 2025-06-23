// src/services/axiosInstance.js
import axios from 'axios';
import { toast } from 'react-toastify';

// IMPORTANT: Configure this baseURL to match your backend server's URL.
// This API_BASE_URL should point to the root of your backend, e.g., 'http://localhost:5000'.
// It's recommended to use an environment variable for this (e.g., VITE_BACKEND_URL for Vite).
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'; // Fallback for development

// Store the navigation function globally for use in interceptors.
// This is typically set once in your root App component's useEffect.
let navigate;
export const setNavigationFunction = (navFunction) => {
    navigate = navFunction;
};

// Create an Axios instance with base URL and credentials
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Crucial for sending and receiving httpOnly cookies
});

// --- Axios Interceptors ---

// Response interceptor to handle 401 Unauthorized errors globally
// This will automatically redirect to login if a 401 is received,
// implying the session has expired or is invalid.
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('401 Unauthorized response received by API interceptor. Session likely expired.');
            toast.error("Your session has expired or is invalid. Please log in again.");
            // Use the global navigate function to redirect to the login page
            if (navigate) {
                navigate('/loginForm', { replace: true });
            } else {
                // Fallback for cases where navigate might not be set yet (e.g., initial load)
                window.location.href = '/loginForm';
            }
        }
        return Promise.reject(error); // Re-throw the error for component-specific handling
    }
);

// --- Helper function for consistent error handling ---
// This function will throw an error with a more specific message for components to catch.
export const handleApiError = (error, defaultMessage) => {
    if (error.response && error.response.data && error.response.data.message) {
        // If backend provides a specific error message
        throw new Error(error.response.data.message);
    }
    if (error.message) {
        // Axios error message (e.g., network error)
        throw new Error(error.message);
    }
    // Generic fallback message
    throw new Error(defaultMessage);
};

export default api; // Export the configured Axios instance
