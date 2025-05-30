import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils';
/* import './EditLoanPage.css'; */ // CSS import commented out

const EditLoanPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [formData, setFormData] = useState({
        customer: '',
        loanAmount: '',
        interestRate: '',
        loanTerm: '',
        termUnit: '',
        startDate: '',
        dueDate: '',
        paymentsMade: '',
        balanceDue: '',
        totalRepaymentAmount: '',
        status: '',
        description: '',
        collateralType: '',
        collateralValue: '',
        collateralDescription: ''
    });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- Fetch Customers and Loan Data ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const token = getToken();

            if (!token) {
                clearAuthData();
                navigate('/login');
                return;
            }

            try {
                // Fetch Customers
                const customersResponse = await fetch(`${BACKEND_URL}/api/customers`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                });
                if (!customersResponse.ok) {
                    throw new Error('Failed to fetch customers.');
                }
                const customersData = await customersResponse.json();
                setCustomers(customersData.customers); // Access .customers array

                // Fetch Loan by ID
                const loanResponse = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                });

                if (loanResponse.status === 401 || loanResponse.status === 403) {
                    clearAuthData();
                    navigate('/login');
                    return;
                }

                if (!loanResponse.ok) {
                    throw new Error('Failed to fetch loan data.');
                }
                const loanData = await loanResponse.json();

                // Format dates for input fields
                const formattedStartDate = loanData.startDate ? new Date(loanData.startDate).toISOString().split('T')[0] : '';
                const formattedDueDate = loanData.dueDate ? new Date(loanData.dueDate).toISOString().split('T')[0] : '';

                // Ensure customer is an ID string (if populated as object)
                const customerId = loanData.customer?._id || loanData.customer;

                setFormData({
                    customer: customerId,
                    loanAmount: loanData.loanAmount || '',
                    interestRate: loanData.interestRate || '',
                    loanTerm: loanData.loanTerm || '',
                    termUnit: loanData.termUnit || 'months',
                    startDate: formattedStartDate,
                    dueDate: formattedDueDate,
                    paymentsMade: loanData.paymentsMade || 0,
                    balanceDue: loanData.balanceDue || '',
                    totalRepaymentAmount: loanData.totalRepaymentAmount || '',
                    status: loanData.status || 'pending',
                    description: loanData.description || '',
                    collateralType: loanData.collateralType || '',
                    collateralValue: loanData.collateralValue || '',
                    collateralDescription: loanData.collateralDescription || ''
                });

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || "Network error or server unavailable.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate, BACKEND_URL]);

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // --- Removed automatic calculation useEffect for dueDate, totalRepaymentAmount, and balanceDue ---
    // These fields are now fully editable by the user, loaded from existing loan data.

    // --- Handle Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const token = getToken();
        if (!token) {
            clearAuthData();
            navigate('/login');
            return;
        }

        // Basic validation
        if (!formData.customer || !formData.loanAmount || !formData.interestRate || !formData.loanTerm || !formData.dueDate) {
            setError('Please fill in all required fields (Customer, Loan Amount, Interest Rate, Loan Term, Due Date).');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/loans/${id}`, {
                method: 'PUT', // Use PUT for updates
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update loan.');
            }

            const data = await response.json();
            console.log('Loan updated successfully:', data);
            setSuccessMessage('Loan updated successfully!');
            setTimeout(() => {
                navigate(`/loans/${id}`); // Redirect back to loan details page
            }, 1500);
        } catch (err) {
            console.error("Error updating loan:", err);
            setError(err.message || "Network error or server unavailable.");
        }
    };

    if (loading) {
        return <div>Loading loan data...</div>;
    }

    if (error && !successMessage) {
        return <div style={{ color: "red" }}>Error: {error}</div>;
    }

    // If no loan data is found after loading, and no error, display not found
    if (!formData.customer && !loading && !error) {
        return <div>Loan not found or invalid ID.</div>;
    }

    return (
        <div>
            <Link to="/loans">
                {"<"} Back to Loans Overview
            </Link>
            <h1>Edit Loan</h1>

            {error && <div style={{ color: 'red' }}>{error}</div>}
            {successMessage && <div style={{ color: 'green' }}>{successMessage}</div>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="customer">Customer:</label>
                    <select
                        id="customer"
                        name="customer"
                        value={formData.customer}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a Customer</option>
                        {customers.map(customer => (
                            <option key={customer._id} value={customer._id}>
                                {customer.name} ({customer.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="loanAmount">Loan Amount (ZMW):</label>
                    <input
                        type="number"
                        id="loanAmount"
                        name="loanAmount"
                        value={formData.loanAmount}
                        onChange={handleChange}
                        step="0.01"
                        min="0.01"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="interestRate">Interest Rate (%):</label>
                    <input
                        type="number"
                        id="interestRate"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="loanTerm">Loan Term:</label>
                    <input
                        type="number"
                        id="loanTerm"
                        name="loanTerm"
                        value={formData.loanTerm}
                        onChange={handleChange}
                        min="1"
                        required
                    />
                    <select
                        id="termUnit"
                        name="termUnit"
                        value={formData.termUnit}
                        onChange={handleChange}
                    >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="startDate">Start Date:</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="dueDate">Due Date:</label>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="paymentsMade">Payments Made (ZMW):</label>
                    <input
                        type="number"
                        id="paymentsMade"
                        name="paymentsMade"
                        value={formData.paymentsMade}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                    />
                </div>

                <div>
                    <label htmlFor="totalRepaymentAmount">Calculated Total Repayment (ZMW):</label>
                    <input
                        type="text"
                        id="totalRepaymentAmount"
                        name="totalRepaymentAmount"
                        value={formData.totalRepaymentAmount}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="balanceDue">Calculated Balance Due (ZMW):</label>
                    <input
                        type="text"
                        id="balanceDue"
                        name="balanceDue"
                        value={formData.balanceDue}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="status">Status:</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                    >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="overdue">Overdue</option>
                        <option value="default">Default</option>
                        <option value="paid">Paid</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        maxLength="500"
                    ></textarea>
                </div>

                {/* --- Collateral Details Section --- */}
                <h2>Collateral Details (Optional)</h2>
                <div>
                    <label htmlFor="collateralType">Collateral Type:</label>
                    <input
                        type="text"
                        id="collateralType"
                        name="collateralType"
                        value={formData.collateralType}
                        onChange={handleChange}
                        placeholder="e.g., Vehicle, Property, Jewelry"
                    />
                </div>
                <div>
                    <label htmlFor="collateralValue">Collateral Estimated Value (ZMW):</label>
                    <input
                        type="number"
                        id="collateralValue"
                        name="collateralValue"
                        value={formData.collateralValue}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        placeholder="e.g., 15000.00"
                    />
                </div>
                <div>
                    <label htmlFor="collateralDescription">Collateral Description:</label>
                    <textarea
                        id="collateralDescription"
                        name="collateralDescription"
                        value={formData.collateralDescription}
                        onChange={handleChange}
                        rows="3"
                        maxLength="500"
                        placeholder="e.g., 2015 Toyota Corolla, VIN: ABC123..., Color: Blue"
                    ></textarea>
                </div>

                <button type="submit">Update Loan</button>
            </form>
        </div>
    );
};

export default EditLoanPage;
