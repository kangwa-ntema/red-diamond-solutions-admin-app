import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getToken, clearAuthData } from '../utils/authUtils';
import './AddLoanPage.css';
import { toast } from 'react-toastify';

/**
 * @component AddLoanPage
 * @description This component allows administrators to add a new loan to a client.
 * It also supports renewing an existing loan by pre-populating certain fields
 * from a loan passed via navigation state. It handles fetching eligible clients,
 * calculating loan financials (interest, total repayment, balance due, due date),
 * and submitting the new loan data to the backend.
 */
const AddLoanPage = () => {
    const today = new Date().toISOString().split('T')[0];

    const location = useLocation();
    const { loanDataToRenew } = location.state || {};

    const [formData, setFormData] = useState({
        client: '',
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 0,
        termUnit: 'months',
        startDate: today,
        dueDate: '',
        paymentsMade: 0,
        balanceDue: '',
        totalRepaymentAmount: '',
        interestAmount: '',
        status: 'pending',
        description: '',
        collateralType: '',
        collateralValue: 0,
        collateralDescription: ''
    });

    // This will hold eligible clients for new loans, or just the renewed client for renewals
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /**
     * Effect to initialize form data if a loan is being renewed.
     * Also sets the initial client selection based on renewal.
     */
    useEffect(() => {
        if (loanDataToRenew) {
            setFormData(prevData => ({
                ...prevData,
                ...loanDataToRenew,
                // Ensure numeric fields are correctly parsed from loanDataToRenew if they come as strings.
                loanAmount: parseFloat(loanDataToRenew.loanAmount) || 0,
                interestRate: parseFloat(loanDataToRenew.interestRate) || 0,
                loanTerm: parseInt(loanDataToRenew.loanTerm) || 0,
                collateralValue: parseFloat(loanDataToRenew.collateralValue) || 0,
                // Reset fields for a *new* loan based on renewal (payments, balance, etc., start fresh)
                paymentsMade: 0,
                balanceDue: '',
                totalRepaymentAmount: '',
                interestAmount: '',
                dueDate: '',
            }));
            // If renewing, pre-select the client from the renewed loan's client ID.
            if (loanDataToRenew.client) {
                setFormData(prevData => ({
                    ...prevData,
                    client: loanDataToRenew.client // Assuming loanDataToRenew.client is the client's ObjectId
                }));

                // For renewal, set the clients array to only contain the client being renewed
                // This prevents other clients from showing up and pre-fills the selection
                const renewedClient = {
                    _id: loanDataToRenew.client,
                    name: loanDataToRenew.clientName || 'Unknown Client', // Use 'name' as per backend client object
                    email: loanDataToRenew.clientEmail || 'unknown@example.com',
                    // Add loan status from loanDataToRenew if available, might be useful for display or future logic
                    loanStatus: loanDataToRenew.status
                };
                setClients([renewedClient]);
            }
        }
    }, [loanDataToRenew]); // Dependency: Reruns if `loanDataToRenew` object changes

    /**
     * useCallback hook to memoize the client fetching function.
     * This function now fetches clients who do NOT have an 'active' loan using the new backend filter.
     */
    const fetchEligibleClients = useCallback(async () => {
        // Only fetch clients if not in renewal mode
        if (!loanDataToRenew) {
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
                // Now, fetch only eligible clients by using the new backend query parameter
                const clientsResponse = await fetch(`${BACKEND_URL}/api/clients?exclude_active_loan_clients=true`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include',
                });

                if (clientsResponse.status === 401 || clientsResponse.status === 403) {
                    clearAuthData();
                    navigate('/login');
                    toast.error('Authentication expired or unauthorized. Please log in again.');
                    return;
                }
                if (!clientsResponse.ok) {
                    const errorData = await clientsResponse.json();
                    console.error("Error fetching clients response:", errorData);
                    throw new Error(errorData.message || 'Failed to fetch clients.');
                }

                const allClientsData = await clientsResponse.json();
                // The backend now sends only clients without active loans, so no client-side filtering needed here.
                setClients(allClientsData.clients);

            } catch (err) {
                console.error("AddLoanPage: Error in fetchEligibleClients:", err);
                setError(err.message || "Network error or server unavailable.");
                toast.error(`Error fetching clients: ${err.message || "Network error"}`);
            } finally {
                setLoading(false);
            }
        } else {
            // If in renewal mode, loading is false because client data is already set from loanDataToRenew
            setLoading(false);
        }
    }, [navigate, BACKEND_URL, loanDataToRenew]); // Dependencies: Re-run if `BACKEND_URL`, or `loanDataToRenew` changes

    /**
     * useEffect to trigger client fetching when the component mounts or `loanDataToRenew` changes.
     * This will call `fetchEligibleClients` only if not renewing.
     */
    useEffect(() => {
        fetchEligibleClients();
    }, [fetchEligibleClients]); // Dependency: fetchEligibleClients function

    /**
     * Handles changes to form input fields.
     * Updates the `formData` state dynamically based on the input's `name` attribute.
     * Special handling for 'number' type inputs to ensure they are parsed correctly
     * (either as a float or `null` if the input is empty).
     * @param {Object} e - The event object from the input change.
     */
    const handleChange = (e) => {
        const { name, value, type } = e.target;

        setFormData(prevData => {
            let newValue = value;
            if (type === "number") {
                newValue = value === '' ? null : parseFloat(value);
            }
            return {
                ...prevData,
                [name]: newValue
            };
        });
    };

    /**
     * useEffect hook to calculate loan financials (interest amount, total repayment, balance due, due date)
     * whenever relevant form fields (loanAmount, interestRate, loanTerm, termUnit, startDate) change.
     * This provides real-time feedback to the user on calculated values.
     */
    useEffect(() => {
        const loanAmount = parseFloat(formData.loanAmount);
        const interestRate = parseFloat(formData.interestRate);
        const loanTerm = parseInt(formData.loanTerm);
        const startDate = formData.startDate;

        let calculatedTotalRepaymentAmount = '';
        let calculatedBalanceDue = '';
        let calculatedDueDate = '';
        let calculatedInterestAmount = '';

        if (!isNaN(loanAmount) && loanAmount > 0 && !isNaN(interestRate) && !isNaN(loanTerm) && loanTerm > 0) {
            calculatedInterestAmount = (loanAmount * (interestRate / 100) * loanTerm).toFixed(2);
            calculatedTotalRepaymentAmount = (loanAmount + parseFloat(calculatedInterestAmount)).toFixed(2);
            calculatedBalanceDue = calculatedTotalRepaymentAmount;
        }

        if (startDate && loanTerm > 0 && !isNaN(loanTerm)) {
            const start = new Date(startDate);
            let dueDate = new Date(startDate);

            switch (formData.termUnit) {
                case 'days':
                    dueDate.setDate(start.getDate() + loanTerm);
                    break;
                case 'weeks':
                    dueDate.setDate(start.getDate() + loanTerm * 7);
                    break;
                case 'months':
                    dueDate.setMonth(start.getMonth() + loanTerm);
                    // Handle month overflow (e.g., adding 1 month to Jan 31 should result in Feb 28/29, not March 3)
                    if (dueDate.getDate() !== start.getDate()) {
                        dueDate.setDate(0); // Set to last day of previous month, then add to current month
                    }
                    break;
                case 'years':
                    dueDate.setFullYear(start.getFullYear() + loanTerm);
                    // Handle leap year/month overflow for years
                    if (dueDate.getMonth() !== start.getMonth()) {
                        dueDate.setDate(0); // Set to last day of previous month, then add to current month
                    }
                    break;
                default:
                    break;
            }
            calculatedDueDate = dueDate.toISOString().split('T')[0];
        }

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
                dueDate: calculatedDueDate,
                interestAmount: calculatedInterestAmount
            }));
        }
    }, [
        formData.loanAmount,
        formData.interestRate,
        formData.loanTerm,
        formData.termUnit,
        formData.startDate,
        formData.totalRepaymentAmount,
        formData.balanceDue,
        formData.dueDate,
        formData.interestAmount
    ]);

    /**
     * Handles the form submission for adding a new loan.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        const token = getToken();
        if (!token) {
            clearAuthData();
            navigate('/');
            return;
        }

        if (!formData.client || formData.loanAmount === null || formData.loanAmount <= 0 ||
            formData.interestRate === null || formData.interestRate < 0 ||
            formData.loanTerm === null || formData.loanTerm <= 0 || !formData.startDate) {
            setError('Please fill in all required fields correctly (Loan Amount, Interest Rate, Loan Term must be positive numbers).');
            toast.error('Please fill in all required fields correctly.');
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
                navigate('/');
                toast.error('Authentication expired or unauthorized. Please log in again.');
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
            toast.success('Loan added successfully!');

            setFormData({
                client: '',
                loanAmount: 0,
                interestRate: 0,
                loanTerm: 0,
                termUnit: 'months',
                startDate: today,
                dueDate: '',
                paymentsMade: 0,
                balanceDue: '',
                totalRepaymentAmount: '',
                interestAmount: '',
                status: 'pending',
                description: '',
                collateralType: '',
                collateralValue: 0,
                collateralDescription: ''
            });
            setTimeout(() => {
                navigate('/loans');
            }, 1500);
        } catch (err) {
            console.error("AddLoanPage: Error in handleSubmit:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error adding loan: ${err.message || "Network error"}`);
        }
    };

    // --- Conditional Rendering for Loading and Error States ---
    if (loading) {
        return <div className="addLoanPageContainer addLoanLoading">Loading clients...</div>;
    }

    // Display a global error message if fetching clients failed AND no clients were loaded.
    // This now specifically applies to the "add new loan" scenario, not renewal.
    if (error && !loanDataToRenew) {
        return <div className="addLoanPageContainer addLoanErrorMessage">Error: {error}</div>;
    }

    // If no eligible clients are found, and the component is not loading, AND we are NOT renewing a loan,
    // display a message indicating that no clients are available for a new loan.
    if (clients.length === 0 && !loading && !loanDataToRenew) {
        return <div className="addLoanPageContainer addLoanErrorMessage">No eligible clients found to add a loan for. All clients may already have an active or overdue loan, or there are no clients registered.</div>;
    }

    // Main component render: Displays the loan input form.
    return (
        <div className="addLoanPageContainer">
            <div className="addLoanPageContent">
                <Link to="/loans" className="addLoanBackLink">
                    {"<"} Back to Loans Overview
                </Link>
                <h1 className="addLoanHeadline">{loanDataToRenew ? 'Renew Loan' : 'Add New Loan'}</h1>

                {error && <div className="addLoanErrorMessage">{error}</div>}
                {successMessage && <div className="addLoanSuccessMessage">{successMessage}</div>}

                <form onSubmit={handleSubmit} className="addLoanForm">
                    {/* Client Selection Dropdown */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="client">Client:</label>
                        <select
                            id="client"
                            name="client"
                            value={formData.client} // Controlled component: value comes from state
                            onChange={handleChange}  // Update state on change
                            className="addLoanSelect"
                            required // HTML5 form validation: field is mandatory
                            disabled={!!loanDataToRenew} // Disable if renewing a loan
                        >
                            {/* If renewing, only show the pre-selected client */}
                            {loanDataToRenew ? (
                                <option key={loanDataToRenew.client} value={loanDataToRenew.client}>
                                    {/* Display client name and email from the pre-populated data */}
                                    {clients[0]?.name} ({clients[0]?.email})
                                </option>
                            ) : (
                                // Otherwise, show "Select a Client" and the fetched eligible clients
                                <>
                                    <option value="">Select a Client</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>
                                            {client.name} ({client.email})
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        {clients.length === 0 && !loading && !loanDataToRenew && (
                            <p className="addLoanInfoText">No clients without active or overdue loans found.</p>
                        )}
                        {loanDataToRenew && (
                            <p className="addLoanInfoText">Client pre-selected for renewal.</p>
                        )}
                    </div>

                    {/* Remainder of your form */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="loanAmount">Loan Amount (ZMW):</label>
                        <input
                            type="number"
                            id="loanAmount"
                            name="loanAmount"
                            value={formData.loanAmount === null ? '' : formData.loanAmount}
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
                            value={formData.interestRate === null ? '' : formData.interestRate}
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
                            value={formData.loanTerm === null ? '' : formData.loanTerm}
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
                            className="addLoanInput"
                            readOnly
                        />
                    </div>
                    {/* Add other loan fields like description, collateral, etc. below */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="description">Description (Optional):</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="addLoanInput"
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="addLoanSection">
                        <h2 className="addLoanSectionTitle">Collateral Information (Optional)</h2>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralType">Collateral Type:</label>
                            <input
                                type="text"
                                id="collateralType"
                                name="collateralType"
                                value={formData.collateralType}
                                onChange={handleChange}
                                className="addLoanInput"
                            />
                        </div>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralValue">Collateral Value (ZMW):</label>
                            <input
                                type="number"
                                id="collateralValue"
                                name="collateralValue"
                                value={formData.collateralValue === null ? '' : formData.collateralValue}
                                onChange={handleChange}
                                className="addLoanInput"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralDescription">Collateral Description:</label>
                            <textarea
                                id="collateralDescription"
                                name="collateralDescription"
                                value={formData.collateralDescription}
                                onChange={handleChange}
                                className="addLoanInput"
                                rows="3"
                            ></textarea>
                        </div>
                    </div>

                    <button type="submit" className="addLoanSubmitButton">
                        {loanDataToRenew ? 'Renew Loan' : 'Add Loan'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddLoanPage;
