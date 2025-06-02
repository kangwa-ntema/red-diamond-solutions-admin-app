import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Import useLocation
import { getToken, clearAuthData } from '../utils/authUtils';
import './AddLoanPage.css'; // Import the new CSS file

const AddLoanPage = () => {
    // Get today's date in ISO-MM-DD format for default start date
    const today = new Date().toISOString().split('T')[0];
    const location = useLocation(); // Hook to access the location object, including state
    const { loanDataToRenew } = location.state || {}; // Destructure loanDataToRenew from state

    const [formData, setFormData] = useState({
        customer: '',
        loanAmount: '',
        interestRate: '',
        loanTerm: '',
        termUnit: 'months',
        startDate: today, // Default to today's date
        dueDate: '', // This will be calculated by frontend then sent
        paymentsMade: 0, // This will be managed by backend, but set to 0 initially
        balanceDue: '', // This will be calculated by frontend then sent
        totalRepaymentAmount: '', // This will be calculated by frontend then sent
        interestAmount: '', // New field: To store the calculated interest amount
        status: 'pending', // Default status
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

    // --- Initialize form data with renewal data if present ---
    useEffect(() => {
        if (loanDataToRenew) {
            setFormData(prevData => ({
                ...prevData, // Keep existing defaults if not overridden
                ...loanDataToRenew, // Override with renewal data
                // Ensure paymentsMade is reset for a new loan, even if it was in loanDataToRenew
                paymentsMade: 0,
                // These will be recalculated by the calculation useEffect
                balanceDue: '',
                totalRepaymentAmount: '',
                interestAmount: '',
                dueDate: '',
            }));
        }
    }, [loanDataToRenew]); // Run once when component mounts and loanDataToRenew is available

    // --- Fetch Customers (only those without active loans) ---
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
                // Fetch all customers that do NOT have an active loan
                // If we are renewing, we might need to fetch all customers, or specifically allow
                // the customer of the renewed loan to be selected even if they have an active loan.
                // For now, keeping the 'no_active_loan' filter, but be aware this might need adjustment
                // if a customer can have multiple active loans (e.g., renewed loan becomes active).
                const customersResponse = await fetch(`${BACKEND_URL}/api/customers?status=no_active_loan`, {
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
                    const errorData = await customersResponse.json();
                    console.error("Error fetching customers response:", errorData);
                    throw new Error(errorData.message || 'Failed to fetch customers.');
                }
                const allCustomersData = await customersResponse.json();
                const availableCustomers = allCustomersData.customers; // Assuming backend returns { customers: [...] }

                setCustomers(availableCustomers);

            } catch (err) {
                console.error("AddLoanPage: Error in fetchData:", err);
                setError(err.message || "Network error or server unavailable.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, BACKEND_URL]);

    // --- Handle Form Field Changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // --- Calculate Interest Amount, Total Repayment Amount, Balance Due, AND Due Date ---
    useEffect(() => {
        const loanAmount = parseFloat(formData.loanAmount);
        const interestRate = parseFloat(formData.interestRate);
        const loanTerm = parseInt(formData.loanTerm);
        const startDate = formData.startDate; // Get start date string

        let calculatedTotalRepaymentAmount = '';
        let calculatedBalanceDue = '';
        let calculatedDueDate = '';
        let calculatedInterestAmount = ''; // Variable for calculated interest

        // Calculate Interest Amount, Total Repayment Amount and Balance Due
        // This assumes the interestRate is a direct percentage of the loan amount.
        if (!isNaN(loanAmount) && !isNaN(interestRate)) {
            calculatedInterestAmount = (loanAmount * (interestRate / 100)).toFixed(2);
            calculatedTotalRepaymentAmount = (loanAmount + parseFloat(calculatedInterestAmount)).toFixed(2);
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

        // Only update if values have meaningfully changed to avoid infinite loops
        // and prevent updates if the component is still initializing from renewal data
        if (
            formData.totalRepaymentAmount !== calculatedTotalRepaymentAmount ||
            formData.balanceDue !== calculatedBalanceDue ||
            formData.dueDate !== calculatedDueDate ||
            formData.interestAmount !== calculatedInterestAmount
        ) {
            setFormData(prevData => ({
                ...prevData,
                totalRepaymentAmount: calculatedTotalRepaymentAmount,
                balanceDue: calculatedBalanceDue,
                dueDate: calculatedDueDate, // Update the due date
                interestAmount: calculatedInterestAmount // Update interestAmount in state
            }));
        }
    }, [formData.loanAmount, formData.interestRate, formData.loanTerm, formData.termUnit, formData.startDate, formData.totalRepaymentAmount, formData.balanceDue, formData.dueDate, formData.interestAmount]);

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
        if (!formData.customer || !formData.loanAmount || !formData.interestRate || !formData.loanTerm || !formData.startDate) {
            setError('Please fill in all required fields (Customer, Loan Amount, Interest Rate, Loan Term, Start Date).');
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
                console.error("Error adding loan response:", errorData);
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
                dueDate: '', // Will be recalculated by backend
                paymentsMade: 0, // Will be managed by backend
                balanceDue: '', // Will be recalculated by backend
                totalRepaymentAmount: '', // Will be recalculated by backend
                interestAmount: '', // Reset interest amount too
                status: 'pending',
                description: '',
                collateralType: '',
                collateralValue: '',
                collateralDescription: ''
            });
            setTimeout(() => {
                navigate('/loans'); // Redirect to loans list after a short delay
            }, 1500);
        } catch (err) {
            console.error("AddLoanPage: Error in handleSubmit:", err);
            setError(err.message || "Network error or server unavailable.");
        }
    };

    if (loading) {
        return <div className="addLoanPageContainer addLoanLoading">Loading customers...</div>;
    }

    if (error) {
        return <div className="addLoanPageContainer addLoanErrorMessage">Error: {error}</div>;
    }

    // This check needs to be careful when renewing, as the customer might be pre-selected.
    // If loanDataToRenew has a customer, we should allow the form to render even if
    // that customer isn't in the initial `customers` list (e.g., if they have an active loan).
    // For now, keeping the original logic, but it's a point to consider for refinement.
    if (customers.length === 0 && !loading && !loanDataToRenew?.customer) {
        return <div className="addLoanPageContainer addLoanErrorMessage">No eligible customers found to add a loan for. All customers may already have an active loan, or there are no customers registered.</div>;
    }

    return (
        <div className="addLoanPageContainer">
            <div className="addLoanPageContent">
                <Link to="/loans" className="addLoanBackLink">
                    {"<"} Back to Loans Overview
                </Link>
                <h1 className="addLoanHeadline">Add New Loan</h1>

                {error && <div className="addLoanErrorMessage">{error}</div>}
                {successMessage && <div className="addLoanSuccessMessage">{successMessage}</div>}

                <form onSubmit={handleSubmit} className="addLoanForm">
                    <div className="addLoanFormGroup">
                        <label htmlFor="customer">Customer:</label>
                        <select
                            id="customer"
                            name="customer"
                            value={formData.customer}
                            onChange={handleChange}
                            className="addLoanSelect"
                            required
                        >
                            <option value="">Select a Customer</option>
                            {/* Render the pre-selected customer if renewing and they are not in the fetched list */}
                            {loanDataToRenew?.customer && !customers.some(c => c._id === loanDataToRenew.customer) && (
                                <option key={loanDataToRenew.customer} value={loanDataToRenew.customer}>
                                    {/* You might need to fetch customer name/email if not in loanDataToRenew */}
                                    {`Pre-selected Customer ID: ${loanDataToRenew.customer}`}
                                </option>
                            )}
                            {customers.map(customer => (
                                <option key={customer._id} value={customer._id}>
                                    {customer.name} ({customer.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="loanAmount">Loan Amount (ZMW):</label>
                        <input
                            type="number"
                            id="loanAmount"
                            name="loanAmount"
                            value={formData.loanAmount}
                            onChange={handleChange}
                            className="addLoanInput"
                            step="0.01"
                            min="0.01"
                            required
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="interestRate">Interest Rate (% Direct):</label>
                        <input
                            type="number"
                            id="interestRate"
                            name="interestRate"
                            value={formData.interestRate}
                            onChange={handleChange}
                            className="addLoanInput"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="interestAmount">Calculated Interest Amount (ZMW):</label>
                        <input
                            type="text"
                            id="interestAmount"
                            name="interestAmount"
                            value={formData.interestAmount}
                            className="addLoanInput"
                            readOnly
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="loanTerm">Loan Term:</label>
                        <input
                            type="number"
                            id="loanTerm"
                            name="loanTerm"
                            value={formData.loanTerm}
                            onChange={handleChange}
                            className="addLoanInput"
                            min="1"
                            required
                        />
                        <select
                            id="termUnit"
                            name="termUnit"
                            value={formData.termUnit}
                            onChange={handleChange}
                            className="addLoanSelect"
                        >
                            <option value="days">Days</option>
                            <option value="weeks">Weeks</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                        </select>
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="startDate">Start Date:</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="addLoanInput"
                            required
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="dueDate">Due Date (Calculated):</label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            className="addLoanInput"
                            readOnly
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="paymentsMade">Payments Made (ZMW):</label>
                        <input
                            type="number"
                            id="paymentsMade"
                            name="paymentsMade"
                            value={formData.paymentsMade}
                            onChange={handleChange}
                            className="addLoanInput"
                            step="0.01"
                            min="0"
                            readOnly
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="totalRepaymentAmount">Calculated Total Repayment (ZMW):</label>
                        <input
                            type="text"
                            id="totalRepaymentAmount"
                            name="totalRepaymentAmount"
                            value={formData.totalRepaymentAmount}
                            onChange={handleChange}
                            className="addLoanInput"
                            readOnly
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="balanceDue">Calculated Balance Due (ZMW):</label>
                        <input
                            type="text"
                            id="balanceDue"
                            name="balanceDue"
                            value={formData.balanceDue}
                            onChange={handleChange}
                            className="addLoanInput"
                            readOnly
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="status">Status:</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="addLoanSelect"
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="overdue">Overdue</option>
                            <option value="default">Default</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="description">Description (Optional):</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="addLoanTextarea"
                            rows="3"
                            maxLength="500"
                            placeholder="e.g., Loan for business expansion, vehicle purchase, etc."
                        ></textarea>
                    </div>

                    {/* --- Collateral Details Section --- */}
                    <section className="collateralSection">
                        <h2 className="collateralHeadline">Collateral Details (Optional)</h2>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralType">Collateral Type:</label>
                            <input
                                type="text"
                                id="collateralType"
                                name="collateralType"
                                value={formData.collateralType}
                                onChange={handleChange}
                                className="addLoanInput"
                                placeholder="e.g., Vehicle, Property, Jewelry"
                            />
                        </div>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralValue">Collateral Estimated Value (ZMW):</label>
                            <input
                                type="number"
                                id="collateralValue"
                                name="collateralValue"
                                value={formData.collateralValue}
                                onChange={handleChange}
                                className="addLoanInput"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 15000.00"
                            />
                        </div>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralDescription">Collateral Description:</label>
                            <textarea
                                id="collateralDescription"
                                name="collateralDescription"
                                value={formData.collateralDescription}
                                onChange={handleChange}
                                className="addLoanTextarea"
                                rows="3"
                                maxLength="500"
                                placeholder="e.g., 2015 Toyota Corolla, VIN: ABC123..., Color: Blue"
                            ></textarea>
                        </div>
                    </section>

                    <button type="submit" className="addLoanSubmitBtn">Add Loan</button>
                </form>
            </div>
        </div>
    );
};

export default AddLoanPage;
