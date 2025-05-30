import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils';
/* import './AddLoanPage.css'; */ // CSS import commented out

const AddLoanPage = () => {
    // Get today's date in ISO-MM-DD format for default start date
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        customer: '',
        loanAmount: '',
        interestRate: '',
        loanTerm: '',
        termUnit: 'months',
        startDate: today, // Default to today's date
        dueDate: '', // This will be calculated
        paymentsMade: 0,
        balanceDue: '',
        totalRepaymentAmount: '',
        status: 'pending',
        description: '',
        // --- New Collateral Fields ---
        collateralType: '',
        collateralValue: '',
        collateralDescription: ''
    });
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // --- Fetch Customers and Loans for Filtering ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const token = getToken();

            if (!token) {
                console.error("AddLoanPage: No authentication token found. Redirecting to login.");
                clearAuthData();
                navigate('/login');
                return;
            }

            try {
                // 1. Fetch all customers
                const customersResponse = await fetch(`${BACKEND_URL}/api/customers`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                });
                if (customersResponse.status === 401 || customersResponse.status === 403) {
                    clearAuthData();
                    navigate('/login');
                    return;
                }
                if (!customersResponse.ok) {
                    const errorData = await customersResponse.json(); // Capture error details
                    console.error("Error fetching customers response:", errorData); // Log specific error
                    throw new Error(errorData.message || 'Failed to fetch customers.');
                }
                const allCustomersData = await customersResponse.json();
                const allCustomers = allCustomersData.customers; // Assuming backend returns { customers: [...] }

                // 2. Fetch all loans to identify customers with existing loans
                const loansResponse = await fetch(`${BACKEND_URL}/api/loans`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                });
                if (loansResponse.status === 401 || loansResponse.status === 403) {
                    clearAuthData();
                    navigate('/login');
                    return;
                }
                if (!loansResponse.ok) {
                    const errorData = await loansResponse.json(); // Capture error details
                    console.error("Error fetching loans response:", errorData); // Log specific error
                    throw new Error(errorData.message || 'Failed to fetch loan data.');
                }
                const loansData = await loansResponse.json();
                const existingLoans = loansData.loans; // Assuming backend returns { loans: [...] }

                // Create a Set of customer IDs that already have a loan
                const customersWithExistingLoans = new Set();
                existingLoans.forEach(loan => {
                    // Handle both populated customer objects and raw customer IDs
                    if (loan.customer && typeof loan.customer === 'object' && loan.customer._id) {
                        customersWithExistingLoans.add(loan.customer._id.toString());
                    } else if (typeof loan.customer === 'string') {
                        customersWithExistingLoans.add(loan.customer);
                    }
                });

                // 3. Filter customers: only include those WITHOUT an existing loan
                const filteredCustomers = allCustomers.filter(customer =>
                    !customersWithExistingLoans.has(customer._id.toString())
                );

                setCustomers(filteredCustomers);

            } catch (err) {
                console.error("AddLoanPage: Error in fetchData:", err); // General error log
                setError(err.message || "Network error or server unavailable.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, BACKEND_URL]); // Dependencies remain the same

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // --- Calculate Total Repayment Amount, Balance Due, AND Due Date ---
    useEffect(() => {
        const loanAmount = parseFloat(formData.loanAmount);
        const interestRate = parseFloat(formData.interestRate);
        const loanTerm = parseInt(formData.loanTerm);
        const startDate = formData.startDate; // Get start date string

        let calculatedTotalRepaymentAmount = '';
        let calculatedBalanceDue = '';
        let calculatedDueDate = '';

        // Calculate Total Repayment Amount and Balance Due
        if (!isNaN(loanAmount) && !isNaN(interestRate) && !isNaN(loanTerm) && loanTerm > 0) {
            const totalInterest = loanAmount * (interestRate / 100) * (loanTerm / (formData.termUnit === 'years' ? 1 : formData.termUnit === 'months' ? 12 : formData.termUnit === 'weeks' ? 52 : 365));
            calculatedTotalRepaymentAmount = (loanAmount + totalInterest).toFixed(2);
            calculatedBalanceDue = calculatedTotalRepaymentAmount; // Initially balanceDue is totalRepaymentAmount
        }

        // Calculate Due Date based on Start Date, Loan Term, and Term Unit
        if (startDate && loanTerm > 0) {
            const start = new Date(startDate);
            let dueDate = new Date(startDate); // Start with the start date

            switch (formData.termUnit) {
                case 'days':
                    dueDate.setDate(start.getDate() + loanTerm);
                    break;
                case 'weeks':
                    dueDate.setDate(start.getDate() + loanTerm * 7);
                    break;
                case 'months':
                    dueDate.setMonth(start.getMonth() + loanTerm);
                    // Adjust day if month overflowed (e.g., Jan 31 + 1 month = Feb 28/29)
                    if (dueDate.getDate() !== start.getDate()) {
                        dueDate.setDate(0); // Set to last day of previous month
                    }
                    break;
                case 'years':
                    dueDate.setFullYear(start.getFullYear() + loanTerm);
                     // Adjust day if month overflowed (e.g., Feb 29 in leap year + 1 year = Feb 28)
                     if (dueDate.getMonth() !== start.getMonth()) {
                        dueDate.setDate(0); // Set to last day of previous month
                    }
                    break;
                default:
                    break;
            }
            calculatedDueDate = dueDate.toISOString().split('T')[0]; // Format to ISO-MM-DD
        }


        setFormData(prevData => ({
            ...prevData,
            totalRepaymentAmount: calculatedTotalRepaymentAmount,
            balanceDue: calculatedBalanceDue,
            dueDate: calculatedDueDate // Update the due date
        }));
    }, [formData.loanAmount, formData.interestRate, formData.loanTerm, formData.termUnit, formData.startDate]); // Added startDate to dependencies

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
            const response = await fetch(`${BACKEND_URL}/api/loans`, {
                method: 'POST',
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
                console.error("Error adding loan response:", errorData); // Log specific error
                throw new Error(errorData.message || 'Failed to add loan.');
            }

            const data = await response.json();
            console.log('Loan added successfully:', data);
            setSuccessMessage('Loan added successfully!');
            // Optionally clear form or redirect
            setFormData({
                customer: '',
                loanAmount: '',
                interestRate: '',
                loanTerm: '',
                termUnit: 'months',
                startDate: today, // Reset to today's date
                dueDate: '', // Will be recalculated
                paymentsMade: 0,
                balanceDue: '',
                totalRepaymentAmount: '',
                status: 'pending',
                description: '',
                collateralType: '', // Clear new fields
                collateralValue: '',
                collateralDescription: ''
            });
            setTimeout(() => {
                navigate('/loans'); // Redirect to loans list after a short delay
            }, 1500);
        } catch (err) {
            console.error("AddLoanPage: Error in handleSubmit:", err); // General error log
            setError(err.message || "Network error or server unavailable.");
        }
    };

    if (loading) {
        return <div>Loading customers...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    if (customers.length === 0 && !loading) {
        return <div>No available customers found. All customers currently have an active loan or there are no customers.</div>;
    }

    return (
        <div>
            <Link to="/loans">
                {"<"} Back to Loans Overview
            </Link>
            <h1>Add New Loan</h1>

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
                        readOnly // Made readOnly since it's calculated
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
                        readOnly
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
                        readOnly
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
                        readOnly
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

                <button type="submit">Add Loan</button>
            </form>
        </div>
    );
};

export default AddLoanPage;
