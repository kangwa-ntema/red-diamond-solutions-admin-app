import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getToken, clearAuthData } from "../utils/authUtils";
/* import "./CustomersDashboard.css"; */ // Ensure this CSS file exists
/* import "./ClientDashboard.css"; */ // Added for general styling consistency if needed

const CustomersDashboard = () => {
    const [customers, setCustomers] = useState([]);
    const [overallSummary, setOverallSummary] = useState({
        totalCustomers: 0, // Now directly from backend
        activeCustomers: 0, // New field from backend
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // State to manage the active filter ('all', 'active', or 'inactive')

    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const fetchCustomerData = useCallback(async (statusFilter = 'all') => {
        setLoading(true);
        setError(null);

        const token = getToken();

        if (!token) {
            console.error("CustomersDashboard: No authentication token found. Redirecting to login.");
            clearAuthData();
            navigate("/login");
            return;
        }

        try {
            let url = `${BACKEND_URL}/api/customers`;
            if (statusFilter === 'active') {
                url += '?status=active'; // Append query parameter for active customers
            } else if (statusFilter === 'inactive') {
                url += '?status=inactive'; // Append query parameter for inactive customers
            }

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.status === 401 || response.status === 403) {
                console.error("CustomersDashboard: Authentication expired or invalid. Logging out.");
                clearAuthData();
                navigate("/login");
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch customer data.");
            }

            const { customers, overallSummary } = await response.json();
            setCustomers(customers);
            setOverallSummary(overallSummary);

        } catch (err) {
            console.error("CustomersDashboard: Error fetching customer data:", err);
            setError(err.message || "Network error or server unavailable.");
        } finally {
            setLoading(false);
        }
    }, [navigate, BACKEND_URL]);

    useEffect(() => {
        fetchCustomerData(filterStatus);
    }, [fetchCustomerData, filterStatus]);

    // handleEdit and handleDelete functions are no longer directly used in the JSX,
    // but they are kept here in case you want to re-introduce them later.
    const handleEdit = (customerId) => {
        navigate(`/customers/edit/${customerId}`);
    };

    const handleDelete = async (customerId) => {
        if (window.confirm('Are you sure you want to delete this customer? This will also affect their associated loans.')) {
            const token = getToken();
            if (!token) {
                alert("Authentication required to delete a customer.");
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${BACKEND_URL}/api/customers/${customerId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                });

                if (response.ok) {
                    alert('Customer deleted successfully!');
                    fetchCustomerData(filterStatus); // Re-fetch data to update the list with current filter
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
                setError(err.message || "Failed to delete customer.");
            }
        }
    };

    if (loading) {
        return <div>Loading customers...</div>;
    }

    if (error) {
        return <div style={{ color: "red" }}>Error: {error}</div>;
    }

    return (
        <div>
            <Link to="/dashboard">
                {"<"} Back to Main Dashboard
            </Link>

            <h1>Customers Overview</h1>

            {/* Overall Customer Summary Section */}
            <div>
                <h2>Overall Customer Summary</h2>
                <div>
                    <div>
                        <h3>Total Customers</h3>
                        <p>{overallSummary.totalCustomers}</p>
                    </div>
                    <div>
                        <h3>Active Customers</h3>
                        <p>{overallSummary.activeCustomers}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons (Add New Customer, Add Loan) */}
            <div>
                <Link to="/customers/add">
                    <button>Add New Customer</button>
                </Link>
                <Link to="/loans/add">
                    <button>Add Loan</button>
                </Link>
            </div>

            {/* Filter Buttons */}
            <div>
                <button
                    onClick={() => setFilterStatus('all')}
                >
                    All Customers
                </button>
                <button
                    onClick={() => setFilterStatus('active')}
                >
                    Active Customers
                </button>
                <button
                    onClick={() => setFilterStatus('inactive')}
                >
                    Inactive Customers
                </button>
            </div>

            {/* Detailed Customers List Section */}
            <div>
                <h2>Customers List</h2>
                {customers.length === 0 ? (
                    <p>No customers found matching the current filter. Add a new customer!</p>
                ) : (
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Total Loans</th>
                                    <th>Actions</th> {/* Only View Details remains */}
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>{customer._id.substring(0, 8)}...</td>
                                        <td>{customer.name}</td>
                                        <td>{customer.email}</td>
                                        <td>{customer.phone || 'N/A'}</td>
                                        {/* Status based on hasActiveLoan from backend */}
                                        <td>{customer.hasActiveLoan ? 'Active (has loan)' : 'Inactive (no active loan)'}</td>
                                        <td>{customer.totalLoans || 0}</td>
                                        <td>
                                            <Link to={`/customers/${customer._id}`}>
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomersDashboard;