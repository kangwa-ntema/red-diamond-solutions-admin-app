import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils'; // Assuming authUtils.js exists
// import './EditCustomerPage.css'; // Don't forget to import your CSS if you have one

const EditCustomerPage = () => {
    const { id } = useParams(); // Get the customer ID from the URL
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [customer, setCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: ''
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false); // For form submission state

    // --- Fetch Customer Details on Component Mount ---
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

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch customer details.');
                }

                const data = await response.json();
                // Ensure address sub-fields are initialized if they might be missing
                setCustomer({
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: {
                        street: data.address?.street || '',
                        city: data.address?.city || '',
                        state: data.address?.state || '',
                        zip: data.address?.zip || '',
                        country: data.address?.country || ''
                    }
                });

            } catch (err) {
                console.error("Error fetching customer details:", err);
                setError(err.message || "Failed to load customer details.");
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerDetails();
    }, [id, navigate, BACKEND_URL]); // Re-fetch if ID changes, or navigate/backend URL changes

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('address.')) {
            const addressField = name.split('.')[1];
            setCustomer(prevCustomer => ({
                ...prevCustomer,
                address: {
                    ...prevCustomer.address,
                    [addressField]: value
                }
            }));
        } else {
            setCustomer(prevCustomer => ({
                ...prevCustomer,
                [name]: value
            }));
        }
    };

    // --- Handle Form Submission (Update Customer) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const token = getToken();

        if (!token) {
            alert("Authentication required to update customer.");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/customers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(customer), // Send the updated customer object
            });

            if (response.ok) {
                alert("Customer updated successfully!");
                navigate('/customers'); // Navigate back to the customers list
            } else if (response.status === 401 || response.status === 403) {
                alert("Authentication expired or unauthorized. Please log in again.");
                clearAuthData();
                navigate('/login');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update customer.');
            }
        } catch (err) {
            console.error("Error updating customer:", err);
            alert(`Error updating customer: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (loading) {
        return <div>Loading customer details...</div>;
    }

    if (error) {
        return <div style={{ color: "red" }}>Error: {error}</div>;
    }

    return (
        <div className="edit-customer-container">
            <Link to="/customers" className="back-to-customers-btn">
                {"<"} Back to Clients
            </Link>
            <h1>Edit Client: {customer.name}</h1>
            <form onSubmit={handleSubmit} className="edit-customer-form">
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={customer.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={customer.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Phone:</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={customer.phone}
                        onChange={handleChange}
                    />
                </div>

                {/* Address Fields */}
                <h3>Address:</h3>
                <div className="form-group">
                    <label htmlFor="address.street">Street:</label>
                    <input
                        type="text"
                        id="address.street"
                        name="address.street"
                        value={customer.address.street}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="address.city">City:</label>
                    <input
                        type="text"
                        id="address.city"
                        name="address.city"
                        value={customer.address.city}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="address.state">State:</label>
                    <input
                        type="text"
                        id="address.state"
                        name="address.state"
                        value={customer.address.state}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="address.zip">Zip Code:</label>
                    <input
                        type="text"
                        id="address.zip"
                        name="address.zip"
                        value={customer.address.zip}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="address.country">Country:</label>
                    <input
                        type="text"
                        id="address.country"
                        name="address.country"
                        value={customer.address.country}
                        onChange={handleChange}
                    />
                </div>

                <button type="submit" disabled={submitting} className="update-customer-btn">
                    {submitting ? 'Updating...' : 'Update Client'}
                </button>
            </form>
        </div>
    );
};

export default EditCustomerPage;