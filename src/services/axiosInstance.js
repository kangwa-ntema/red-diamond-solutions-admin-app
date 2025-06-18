import axios from 'axios';
import { toast } from 'react-toastify';

// IMPORTANT: Configure this baseURL to match your backend server's URL.
// This API_BASE_URL should point to the root of your backend, e.g., 'http://localhost:5000'.
// It's recommended to use an environment variable for this.
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL; // Using Vite's env variable prefix

// Create an Axios instance with base URL and credentials
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Crucial for sending and receiving httpOnly cookies
});

// Response interceptor to handle 401 Unauthorized errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('401 Unauthorized response received by API interceptor. Session likely expired.');
            toast.error("Your session has expired or is invalid. Please log in again.");
            // You might want to trigger a logout event here if your AuthContext isn't watching for it.
            // A simple way is to dispatch a custom event or, better, let AuthContext try `verifyToken`
            // periodically or on route changes, which will fail if the cookie is bad.
        }
        return Promise.reject(error); // Re-throw the error for component-specific handling
    }
);

export default api; // Export the configured Axios instance