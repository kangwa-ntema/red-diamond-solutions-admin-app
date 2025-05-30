import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils'; // Assuming authUtils.js exists
import './ViewClientPage.css'; // Optional: for styling this page

const ViewClientPage = () => {
    const { id } = useParams(); // Get the customer ID from the URL (e.g., /customers/123)
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Single Customer Details ---
    useEffect(() => {
        const fetchCustomerDetails = async () => {
            setLoading(true);
            setError(null);
            const token = getToken();
            
            if (!token) {
                console.error('No authentication token found. Redirecting to login.');
                clearAuthData();
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/customers/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                });

                if (response.status === 401) {
                    console.error('Authentication expired or invalid. Logging out.');
                    clearAuthData();
                    navigate('/login');
                    return;
                }
                if (response.status === 404) {
                    setError("Customer not found.");
                    setLoading(false);
                    return;
                }
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch customer details.');
                }

                const data = await response.json();
                setCustomer(data);

            } catch (err) {
                console.error("Error fetching customer details:", err);
                setError(err.message || "Failed to load customer details.");
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerDetails();
    }, [id, navigate, BACKEND_URL]); // Re-fetch if ID changes, or navigate/backend URL changes

    // --- Handle Delete (moved here from Customers.jsx) ---
    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            const token = getToken();
            if (!token) {
                alert("Authentication required to delete customer.");
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/customers/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    alert("Customer deleted successfully!");
                    navigate('/customers'); // Redirect back to the main customers list
                } else if (response.status === 401 || response.status === 403) {
                    alert("Authentication expired or unauthorized. Please log in again.");
                    clearAuthData();
                    navigate('/login');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete customer.');
                }
            } catch (err) {
                console.error("Error deleting customer:", err);
                alert(`Error deleting customer: ${err.message}`);
            }
        }
    };

    // --- Handle Edit (will navigate to EditCustomerPage) ---
    const handleEdit = () => {
        navigate(`/customers/edit/${id}`);
    };

    // --- Render Logic ---
    if (loading) {
        return <div className="view-client-loading">Loading client details...</div>;
    }

    if (error) {
        return <div className="view-client-error" style={{ color: "red" }}>Error: {error}</div>;
    }

    if (!customer) {
        return <div className="view-client-not-found">Client not found.</div>;
    }

    return (
        <div className="view-client-container">
            <Link to="/customers" className="back-to-list-btn">
                {"<"} Back to Clients List
            </Link>
            <h1 className="view-client-headline">Client Details</h1>
            <div className="client-details-card">
                <h2>{customer.name}</h2>
                <p><strong>Email:</strong> {customer.email}</p>
                <p><strong>Phone:</strong> {customer.phone}</p>
                {customer.address && (
                    <div className="client-address-details">
                        <p><strong>Address:</strong></p>
                        <p>{customer.address.street}</p>
                        <p>{customer.address.city}, {customer.address.state} {customer.address.zip}</p>
                        <p>{customer.address.country}</p>
                    </div>
                )}
                <div className="client-actions">
                    <button onClick={handleEdit} className="edit-btn">Edit Client</button>
                    <button onClick={handleDelete} className="delete-btn">Delete Client</button>
                </div>
            </div>
        </div>
    );
};

export default ViewClientPage;