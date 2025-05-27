import "./Customers.css";
import React, { useState, useEffect } from "react"; // Ensure React is imported
import { useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from '../utils/authUtils'; // Import your auth utility functions

const CustomersPage = () => { // Renamed from CustomersPage back to Customers
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // This function will fetch your customer data with the Authorization header
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
            setError(err.message || "Network error or server unavailable."); // Set error state
        } finally {
            setLoading(false); // End loading state
        }
    };

    // Use useEffect to call fetchCustomerData when the component mounts
    useEffect(() => {
        fetchCustomerData();
    }, [navigate]); // Add navigate to dependency array for useEffect

    // --- Render Logic ---
    if (loading) {
        return <div>Loading customers...</div>;
    }

    if (error) {
        return <div style={{ color: "red" }}>Error: {error}</div>;
    }

    return (
        <div className="customers-container">
            <div>
                <Link className="redirectButton" to="/dashboard">
                    {" "}
                    {"<"} Back to Dashboard
                </Link>
            </div>

            <section className="customersSection">
                <h1>Clients List</h1>

                {customers.length === 0 ? (
                    <p>No clients found. Add a new customer!</p>
                ) : (
                    <ul className="customer-list">
                        {customers.map((customer) => (
                            <li key={customer._id} className="customer-item">
                                <h3>{customer.name}</h3>
                                <p>Email: {customer.email}</p>
                                <p>Phone: {customer.phone}</p>
                                {customer.address && (
                                    <p>
                                        Address: {customer.address.street}, {customer.address.city},{" "}
                                        {customer.address.state}, {customer.address.zip},{" "}
                                        {customer.address.country}
                                    </p>
                                )}
                                {/* Add buttons for Edit/Delete later */}
                                {/* <button onClick={() => handleEdit(customer._id)}>Edit</button> */}
                                {/* <button onClick={() => handleDelete(customer._id)}>Delete</button> */}
                            </li>
                        ))}
                    </ul>
                )}
                <Link to="/customers/add">
                    <button className="add-customer-btn">Add New Client</button>
                </Link>
            </section>
        </div>
    );
};

export default CustomersPage; // Ensure the export matches the component name