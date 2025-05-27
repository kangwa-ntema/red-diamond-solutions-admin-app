import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { getToken, clearAuthData } from '../utils/authUtils'; // Import your auth utility functions
// import { fetchCustomersFromApi } from '../services/customerService'; // If you're using a separate service file

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize the navigate hook

    // Ensure your .env.production on Netlify has VITE_BACKEND_URL set
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // This function will fetch your customer data
    const fetchCustomerData = async () => {
        setLoading(true); // Start loading state
        setError(null); // Clear previous errors

        const token = getToken(); // Get the token from localStorage

        if (!token) {
            // If no token is found, the user is not authenticated or token was cleared
            console.error('No authentication token found. Redirecting to login.');
            clearAuthData(); // Ensure all auth data is cleared
            navigate('/login'); // Redirect to your login page
            return; // Stop execution
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/customers`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // *** CRITICAL: ADD THE AUTHORIZATION HEADER ***
                    'Authorization': `Bearer ${token}`
                },
                // Keep credentials: 'include' if your backend also sets HTTP-only cookies
                // It allows the browser to send cookies, but the header is the primary method now.
                credentials: 'include',
            });

            if (response.status === 401) {
                // If the server responds with 401 (Unauthorized),
                // it means the token is expired or invalid. Log out the user.
                console.error('Authentication expired or invalid. Logging out.');
                clearAuthData(); // Clear token from localStorage
                navigate('/login'); // Redirect to login page
                return; // Stop execution
            }

            if (!response.ok) {
                // If the response is not OK (e.g., 500 Server Error, 400 Bad Request)
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch customer data.');
            }

            const data = await response.json();
            setCustomers(data); // Set the fetched customer data

        } catch (err) {
            console.error("Error fetching customer data:", err);
            setError(err.message || "Failed to load customers."); // Set error state
        } finally {
            setLoading(false); // End loading state
        }
    };

    // Use useEffect to call fetchCustomerData when the component mounts
    useEffect(() => {
        fetchCustomerData();
    }, []); // The empty dependency array ensures this runs only once when the component mounts

    // --- Render Logic ---
    if (loading) {
        return <div className="customers-loading">Loading customers...</div>;
    }

    if (error) {
        return <div className="customers-error">Error: {error}</div>;
    }

    return (
        <section className="customers-page-container">
            <h1 className="customers-page-headline">Clients Overview</h1>
            <div className="customers-list">
                {customers.length === 0 ? (
                    <p>No customers found.</p>
                ) : (
                    customers.map((customer) => (
                        <div key={customer._id} className="customer-card">
                            <h3>{customer.name}</h3>
                            <p>Email: {customer.email}</p>
                            <p>Phone: {customer.phone}</p>
                            <p>Address: {customer.address}</p>
                            {/* Add actions like View Details, Edit, Delete here */}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default CustomersPage;