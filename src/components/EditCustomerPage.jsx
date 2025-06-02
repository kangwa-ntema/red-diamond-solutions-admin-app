import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils'; // Assuming authUtils.js exists
import './EditCustomerPage.css'; // Import the new CSS file

const EditCustomerPage = () => {
    const { id: customerId } = useParams(); // Get the customer ID from the URL
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        secondaryPhone: '',
        nrc: '',
        address: '',
        dateRegistered: ''
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
                const response = await fetch(`${BACKEND_URL}/api/customers/${customerId}`, {
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

                const responseData = await response.json();
                const customerData = responseData.customer; // Extract the actual customer object

                setFormData({
                    name: customerData.name || '',
                    email: customerData.email || '',
                    phone: customerData.phone || '',
                    secondaryPhone: customerData.secondaryPhone || '',
                    nrc: customerData.nrc || '',
                    address: customerData.address || '',
                    dateRegistered: customerData.dateRegistered ? new Date(customerData.dateRegistered).toISOString().split('T')[0] : ''
                });

            } catch (err) {
                console.error("Error fetching customer details:", err);
                setError(err.message || "Failed to load customer details.");
            } finally {
                setLoading(false);
            }
        };

        if (customerId) { // Only fetch if customerId is available
            fetchCustomerDetails();
        }
    }, [customerId, navigate, BACKEND_URL]); // Re-fetch if ID changes, or navigate/backend URL changes

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // --- Handle Form Submission (Update Customer) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        const token = getToken();

        if (!token) {
            alert("Authentication required to update client.");
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/customers/${customerId}`, { // Use customerId
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(formData), // Send the updated formData object
            });

            if (response.ok) {
                alert("Client updated successfully!");
                navigate(`/customers/${customerId}`); // Navigate back to the client dashboard
            } else if (response.status === 401 || response.status === 403) {
                alert("Authentication expired or unauthorized. Please log in again.");
                clearAuthData();
                navigate('/login');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update client.');
            }
        } catch (err) {
            console.error("Error updating client:", err);
            alert(`Error updating client: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    // --- Render Logic ---
    if (loading) {
        return <div className="editCustomerLoading">Loading client details...</div>;
    }

    if (error) {
        return <div className="editCustomerError" style={{ color: "red" }}>Error: {error}</div>;
    }

    return (
        <div className="editCustomerPageContainer">
            <div className="editCustomerPageContent"> {/* New wrapper div for content box */}
                <Link to="/customers" className="editCustomerBackLink">
                    {"<"} Back to Clients List
                </Link>
                <h1 className="editCustomerHeadline">Edit Client: {formData.name || customerId}</h1>
                <form onSubmit={handleSubmit} className="editCustomerForm">
                    <div className="editCustomerFormGroup">
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="editCustomerFormGroup">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="editCustomerFormGroup">
                        <label htmlFor="phone">Primary Phone:</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="editCustomerFormGroup">
                        <label htmlFor="secondaryPhone">Secondary Phone:</label>
                        <input
                            type="tel"
                            id="secondaryPhone"
                            name="secondaryPhone"
                            value={formData.secondaryPhone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="editCustomerFormGroup">
                        <label htmlFor="nrc">NRC:</label>
                        <input
                            type="text"
                            id="nrc"
                            name="nrc"
                            value={formData.nrc}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="editCustomerFormGroup">
                        <label htmlFor="address">Address:</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                        ></textarea>
                    </div>
                    <div className="editCustomerFormGroup">
                        <label htmlFor="dateRegistered">Date Registered:</label>
                        <input
                            type="date"
                            id="dateRegistered"
                            name="dateRegistered"
                            value={formData.dateRegistered}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="editCustomerActionButtons">
                        <button type="submit" disabled={submitting} className="editCustomerSubmitBtn">
                            {submitting ? 'Updating...' : 'Update Client'}
                        </button>
                        <button type="button" onClick={() => navigate(-1)} className="editCustomerCancelBtn">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCustomerPage;
