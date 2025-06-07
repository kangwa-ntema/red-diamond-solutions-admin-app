import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils'; // Imports functions for authentication token management
import './ViewClientPage.css'; // Imports the CSS file for styling this component
import { toast } from 'react-toastify'; // Imports toast for displaying non-blocking notifications

/**
 * ViewClientPage Component
 * This component displays the detailed information of a single client.
 * It fetches client data from the backend based on the ID from the URL,
 * handles loading and error states, and provides options to edit or delete the client.
 */
const ViewClientPage = () => {
    // useParams hook to extract the 'id' parameter from the URL
    // e.g., if the URL is /clients/123, 'id' will be '123'
    const { id } = useParams();
    // useNavigate hook to programmatically navigate to different routes
    const navigate = useNavigate();
    // Access the backend URL from environment variables for API calls
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // State variable to store the fetched client data
    const [client, setClient] = useState(null);
    // State variable to manage the loading status during API calls
    const [loading, setLoading] = useState(true);
    // State variable to store any error messages encountered during data fetching
    const [error, setError] = useState(null);

    /**
     * useEffect hook to fetch single client details when the component mounts
     * or when 'id', 'navigate', or 'BACKEND_URL' dependencies change.
     */
    useEffect(() => {
        /**
         * Asynchronous function to fetch client details from the backend.
         */
        const fetchClientDetails = async () => {
            setLoading(true); // Set loading to true before starting the fetch operation
            setError(null);   // Clear any previous errors

            const token = getToken(); // Retrieve the authentication token
            console.log(token);
            // If no token is found, log an error, clear auth data, and redirect to the login page
            if (!token) {
                console.error('No authentication token found. Redirecting to login.');
                clearAuthData(); // Clears any stored authentication data
                navigate('/'); // Redirects to the login route
                return; // Exit the function
            }

            try {
                // Make a GET request to the backend API to fetch client details by ID
                const response = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json', // Specify content type as JSON
                        'Authorization': `Bearer ${token}` // Include the JWT token in the Authorization header
                    },
                    credentials: 'include', // Ensures cookies (if any) are sent with the request
                });

                // Handle 401 Unauthorized response (e.g., expired token)
                if (response.status === 401) {
                    console.error('Authentication expired or invalid. Logging out.');
                    clearAuthData(); // Clear authentication data
                    navigate('/'); // Redirect to login
                    return;
                }
                // Handle 404 Not Found response (client with the given ID doesn't exist)
                if (response.status === 404) {
                    setError("Client not found."); // Set a user-friendly error message
                    setLoading(false); // Stop loading
                    return;
                }
                // Handle other non-OK responses (e.g., 500 Internal Server Error)
                if (!response.ok) {
                    const errorData = await response.json(); // Attempt to parse error message from response body
                    throw new Error(errorData.message || 'Failed to fetch client details.'); // Throw an error
                }

                const data = await response.json(); // Parse the JSON response body
                setClient(data.client); // Update the 'client' state with the fetched client data
            } catch (err) {
                console.error("Error fetching client details:", err); // Log the error to the console
                setError(err.message || "Failed to load client details."); // Set error state for display
            } finally {
                setLoading(false); // Set loading to false once the fetch operation is complete (success or error)
            }
        };

        fetchClientDetails(); // Call the fetch function when the component renders or dependencies change
    }, [id, navigate, BACKEND_URL]); // Dependencies array for useEffect

    /**
     * Asynchronous function to handle client deletion.
     * It prompts the user for confirmation and then sends a DELETE request to the backend.
     */
    const handleDelete = async () => {
        // Show a confirmation dialog to the user
        if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
            const token = getToken(); // Retrieve the authentication token

            // If no token, show an error and redirect to login
            if (!token) {
                toast.error("Authentication required to delete client."); // Display a toast notification
                navigate('/login');
                return;
            }

            try {
                // Send a DELETE request to the backend API to delete the client by ID
                const response = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                });

                // If the deletion was successful
                if (response.ok) {
                    toast.success("Client deleted successfully!"); // Display success toast
                    navigate('/clientsDashboard'); // Redirect back to the main clients list
                }
                // If authentication failed or unauthorized
                else if (response.status === 401 || response.status === 403) {
                    toast.error("Authentication expired or unauthorized. Please log in again.");
                    clearAuthData();
                    navigate('/');
                }
                // Handle other errors during deletion
                else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete client.');
                }
            } catch (err) {
                console.error("Error deleting client:", err);
                toast.error(`Error deleting client: ${err.message}`); // Display error toast
            }
        }
    };

    /**
     * Function to handle navigation to the edit client page.
     */
    const handleEdit = () => {
        navigate(`/clients/edit/${id}`); // Navigate to the edit client route for the current client ID
    };

    // --- Render Logic ---

    // Display a loading message while client data is being fetched
    if (loading) {
        return <div className="viewClientLoading">Loading client details...</div>;
    }

    // Display an error message if data fetching failed
    if (error) {
        return <div className="viewClientError" style={{ color: "red" }}>Error: {error}</div>;
    }

    // Display a "Client not found" message if no client data is available after loading
    if (!client) {
        return <div className="viewClientNotFound">Client not found.</div>;
    }

    // Render the client details once the data is successfully fetched
    return (
        <div className="viewClientContainer">
            <div className="viewClientContent">
                {/* Link to navigate back to the clients list */}
                <Link to="/clientsDahsboard" className="viewClientBackLink">
                    {"<"} Back to Clients List
                </Link>
                <h1 className="viewClientHeadline">Client Details</h1>
                <div className="clientDetailsCard">
                    {/* Display client's name */}
                    <h2>{client.name}</h2>
                    {/* Display client's email */}
                    <p><strong>Email:</strong> {client.email}</p>
                    {/* Display client's primary phone, or 'N/A' if not provided */}
                    <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
                    {/* Display client's secondary phone, or 'N/A' if not provided */}
                    <p><strong>Secondary Phone:</strong> {client.secondaryPhone || 'N/A'}</p>
                    {/* Display client's NRC, or 'N/A' if not provided */}
                    <p><strong>NRC:</strong> {client.nrc || 'N/A'}</p>
                    {/* Display client's registration date, formatted as a local date string */}
                    <p><strong>Date Registered:</strong> {new Date(client.dateRegistered).toLocaleDateString()}</p>
                    {/* Conditionally render address details if an address exists */}
                    {client.address && (
                        <div className="clientAddressDetails">
                            <p><strong>Address:</strong></p>
                            <p>{client.address}</p> {/* Assuming address is a single string field */}
                        </div>
                    )}
                    <div className="clientActions">
                        {/* Button to navigate to the edit client page */}
                        <button onClick={handleEdit} className="editBtn">Edit Client</button>
                        {/* Button to trigger the client deletion process */}
                        <button onClick={handleDelete} className="deleteBtn">Delete Client</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewClientPage;