import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // Import useLocation to access navigation state
import { getToken, clearAuthData } from '../utils/authUtils'; // Utility functions for handling authentication tokens
import './AddLoanPage.css'; // Imports the CSS file for styling this component
import { toast } from 'react-toastify'; // Imports toast for displaying non-blocking notifications

/**
 * @component AddLoanPage
 * @description This component allows administrators to add a new loan to a client.
 * It also supports renewing an existing loan by pre-populating certain fields
 * from a loan passed via navigation state. It handles fetching eligible clients,
 * calculating loan financials (interest, total repayment, balance due, due date),
 * and submitting the new loan data to the backend.
 */
const AddLoanPage = () => {
    // Get today's date in 'YYYY-MM-DD' format, suitable for HTML date input default value.
    const today = new Date().toISOString().split('T')[0];

    // useLocation hook provides access to the location object, which can contain state
    // passed during navigation (e.g., from a "Renew Loan" button on a loan details page).
    const location = useLocation();
    // Destructure `loanDataToRenew` from `location.state`. If state is null, default to an empty object.
    const { loanDataToRenew } = location.state || {};

    // State to manage the form data for the new loan.
    // Initialized with default values and empty strings for input fields.
    const [formData, setFormData] = useState({
        client: '', // Stores the ID of the selected client for the loan.
        loanAmount: 0, // Initialized to 0 for numeric type, avoids NaN issues in calculations.
        interestRate: 0, // Initialized to 0 for numeric type.
        loanTerm: 0, // Initialized to 0 for numeric type.
        termUnit: 'months', // Default term unit for loan duration.
        startDate: today,   // Default to today's date for loan start.
        dueDate: '',        // Calculated and sent to backend, not directly user input.
        paymentsMade: 0,    // Default to 0 for a new loan, managed by backend for existing loans.
        balanceDue: '',     // Calculated and sent to backend.
        totalRepaymentAmount: '', // Calculated and sent to backend.
        interestAmount: '', // Calculated interest amount.
        status: 'pending',  // Default loan status for a new loan.
        description: '',    // Optional text description for the loan.
        // Collateral fields (optional)
        collateralType: '', // Type of collateral (e.g., "Vehicle", "Property").
        collateralValue: 0, // Initialized to 0 for numeric type.
        collateralDescription: '' // Detailed description of the collateral.
    });

    // State to store the list of available clients fetched from the backend.
    const [clients, setClients] = useState([]);
    // State to manage loading status during API calls (e.g., fetching clients).
    const [loading, setLoading] = useState(true);
    // State to store any error messages for display to the user.
    const [error, setError] = useState(null);
    // State to store success messages for display to the user.
    const [successMessage, setSuccessMessage] = useState(null);

    // useNavigate hook for programmatic navigation within the application.
    const navigate = useNavigate();
    // Access the backend URL from environment variables (e.g., .env.local).
    // This is the correct way to access environment variables in a React project
    // (e.g., created with Vite or Create React App).
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    /**
     * useEffect hook to initialize form data if a loan is being renewed.
     * This runs once when the component mounts and `loanDataToRenew` is available.
     * It pre-populates fields but resets financial totals for a new loan.
     */
    useEffect(() => {
        if (loanDataToRenew) {
            setFormData(prevData => ({
                ...prevData, // Keep existing default values not overwritten by loanDataToRenew
                ...loanDataToRenew, // Spread existing loan data to pre-fill fields
                // Ensure numeric fields are correctly parsed from loanDataToRenew if they come as strings.
                // Use || 0 to default to zero if parsing results in NaN (e.g., empty string or invalid number).
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
            }
        }
    }, [loanDataToRenew]); // Dependency: Reruns if `loanDataToRenew` object changes

    /**
     * useEffect hook to fetch eligible clients from the backend.
     * This typically fetches clients who do not currently have an active loan,
     * ensuring that new loans are only issued to eligible clients.
     * It handles authentication and potential errors during the fetch.
     */
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true); // Set loading state to true before fetching
            setError(null);    // Clear any previous errors

            const token = getToken(); // Retrieve authentication token from localStorage/cookies

            // If no token is found, log an error, clear any stale auth data, and redirect to login.
            if (!token) {
                console.error("AddLoanPage: No authentication token found. Redirecting to login.");
                clearAuthData(); // Remove any incomplete or expired auth data
                navigate('/login'); // Redirect to login page
                return; // Stop execution
            }

            try {
                // Fetch clients from the backend who do NOT currently have an active loan.
                // This uses a query parameter `status=no_active_loan` that your backend should handle.
                const clientsResponse = await fetch(`${BACKEND_URL}/api/clients?status=no_active_loan`, {
                    method: 'GET', // HTTP GET request
                    headers: { 'Authorization': `Bearer ${token}` }, // Include JWT token for authentication
                    credentials: 'include', // Include cookies (if any) with the request for session management
                });

                // Handle authentication expiration (401 Unauthorized) or authorization failure (403 Forbidden).
                if (clientsResponse.status === 401 || clientsResponse.status === 403) {
                    clearAuthData(); // Clear authentication data as it's no longer valid
                    navigate('/login'); // Redirect to login page
                    toast.error('Authentication expired or unauthorized. Please log in again.'); // Notify user
                    return; // Stop execution
                }
                // Handle non-OK HTTP responses (e.g., 500 Internal Server Error, 404 Not Found).
                if (!clientsResponse.ok) {
                    const errorData = await clientsResponse.json(); // Parse error response body
                    console.error("Error fetching clients response:", errorData);
                    throw new Error(errorData.message || 'Failed to fetch clients.'); // Throw error with message
                }
                
                // Parse the successful JSON response. Assumes backend returns { clients: [...] }.
                const allClientsData = await clientsResponse.json();
                const availableClients = allClientsData.clients; // Access the 'clients' array from the response

                setClients(availableClients); // Update state with the fetched list of eligible clients

            } catch (err) {
                console.error("AddLoanPage: Error in fetchData:", err); // Log the detailed error
                setError(err.message || "Network error or server unavailable."); // Set user-friendly error message
                toast.error(`Error fetching clients: ${err.message || "Network error"}`); // Display toast notification for error
            } finally {
                setLoading(false); // Always set loading to false after fetch operation, regardless of success or failure
            }
        };

        fetchData(); // Call the fetch function when the component mounts or dependencies change
    }, [navigate, BACKEND_URL]); // Dependencies: Re-run if `navigate` function or `BACKEND_URL` changes

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
                // If the value is an empty string, set it to null. This helps differentiate
                // an empty numeric input from a 0, and allows backend validation to handle `required`.
                // Otherwise, parse it as a float, allowing for decimal values.
                newValue = value === '' ? null : parseFloat(value);
            }
            return {
                ...prevData, // Keep all other form data properties
                [name]: newValue // Update the specific field that changed
            };
        });
    };


    /**
     * useEffect hook to calculate loan financials (interest amount, total repayment, balance due, due date)
     * whenever relevant form fields (loanAmount, interestRate, loanTerm, termUnit, startDate) change.
     * This provides real-time feedback to the user on calculated values.
     */
    useEffect(() => {
        // Parse current form data values to numbers for calculations.
        const loanAmount = parseFloat(formData.loanAmount);
        const interestRate = parseFloat(formData.interestRate);
        const loanTerm = parseInt(formData.loanTerm);
        const startDate = formData.startDate; // Get start date string

        let calculatedTotalRepaymentAmount = '';
        let calculatedBalanceDue = '';
        let calculatedDueDate = '';
        let calculatedInterestAmount = '';

        // Calculate Interest Amount, Total Repayment Amount and Balance Due.
        // This assumes a simple interest calculation: Principal * Rate * Term.
        // The condition ensures calculations only happen when essential numeric inputs are valid positive numbers.
        if (!isNaN(loanAmount) && loanAmount > 0 && !isNaN(interestRate) && !isNaN(loanTerm) && loanTerm > 0) {
            // Calculate interest over the term (e.g., if rate is annual, term is months, this assumes interest is applied monthly)
            // NOTE: For more complex interest (e.g., compound, monthly diminishing), this formula needs adjustment.
            calculatedInterestAmount = (loanAmount * (interestRate / 100) * loanTerm).toFixed(2);
            // Total repayment is principal + calculated interest.
            calculatedTotalRepaymentAmount = (loanAmount + parseFloat(calculatedInterestAmount)).toFixed(2);
            // For a new loan, the initial balance due is the total repayment amount.
            calculatedBalanceDue = calculatedTotalRepaymentAmount;
        }

        // Calculate Due Date based on Start Date, Loan Term, and Term Unit.
        if (startDate && loanTerm > 0 && !isNaN(loanTerm)) {
            const start = new Date(startDate); // Convert start date string to Date object
            let dueDate = new Date(startDate); // Initialize due date with start date

            // Adjust the due date based on the term unit.
            switch (formData.termUnit) {
                case 'days':
                    dueDate.setDate(start.getDate() + loanTerm); // Add days to the start date
                    break;
                case 'weeks':
                    dueDate.setDate(start.getDate() + loanTerm * 7); // Add weeks (days * 7)
                    break;
                case 'months':
                    dueDate.setMonth(start.getMonth() + loanTerm); // Add months
                    // Adjust day if month overflowed (e.g., Jan 31 + 1 month = Feb 28/29).
                    // This sets the day to the last day of the target month if the original day
                    // is greater than the number of days in the target month.
                    if (dueDate.getDate() !== start.getDate()) {
                        dueDate.setDate(0); // Setting day to 0 effectively gets the last day of the *previous* month (relative to current dueDate's month).
                    }
                    break;
                case 'years':
                    dueDate.setFullYear(start.getFullYear() + loanTerm); // Add years
                    // Adjust day if month overflowed (e.g., Feb 29 in leap year + 1 year = Feb 28).
                    if (dueDate.getMonth() !== start.getMonth()) {
                        dueDate.setDate(0);
                    }
                    break;
                default:
                    break;
            }
            // Format calculated due date to 'YYYY-MM-DD' for HTML date input compatibility.
            calculatedDueDate = dueDate.toISOString().split('T')[0];
        }

        // Only update formData state if any of the calculated values have actually changed.
        // This optimization prevents unnecessary re-renders and potential infinite loops in useEffect
        // when dependencies include the calculated values themselves.
        if (
            formData.totalRepaymentAmount !== calculatedTotalRepaymentAmount ||
            formData.balanceDue !== calculatedBalanceDue ||
            formData.dueDate !== calculatedDueDate ||
            formData.interestAmount !== calculatedInterestAmount
        ) {
            setFormData(prevData => ({
                ...prevData, // Retain existing formData
                totalRepaymentAmount: calculatedTotalRepaymentAmount, // Update calculated total repayment
                balanceDue: calculatedBalanceDue, // Update calculated balance due
                dueDate: calculatedDueDate, // Update the due date in state
                interestAmount: calculatedInterestAmount // Update calculated interest amount in state
            }));
        }
    }, [
        // Dependencies for this useEffect:
        formData.loanAmount,      // Recalculate if loan amount changes
        formData.interestRate,    // Recalculate if interest rate changes
        formData.loanTerm,        // Recalculate if loan term changes
        formData.termUnit,        // Recalculate if term unit changes
        formData.startDate,       // Recalculate if start date changes
        // Include calculated values as dependencies to ensure the `if` condition within the effect
        // correctly captures changes and prevents unnecessary state updates.
        formData.totalRepaymentAmount,
        formData.balanceDue,
        formData.dueDate,
        formData.interestAmount
    ]);

    /**
     * Handles the form submission for adding a new loan.
     * Prevents default form behavior, performs client-side validation,
     * and sends a POST request to the backend with the new loan data.
     * Manages success/error messages and redirects upon successful submission.
     * @param {Object} e - The event object from the form submission.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission behavior (which would cause a page reload).
        setError(null);     // Clear any previous errors.
        setSuccessMessage(null); // Clear any previous success messages.

        const token = getToken(); // Retrieve authentication token.
        // If no token, clear auth data and redirect to login page.
        if (!token) {
            clearAuthData();
            navigate('/');
            return; // Stop execution
        }

        // Client-side validation: ensure all required fields are filled and valid.
        // - `formData.client`: Check if a client is selected (string should not be empty).
        // - `formData.loanAmount === null || formData.loanAmount <= 0`: Check if loanAmount is null (empty input) or non-positive.
        // - `formData.interestRate === null || formData.interestRate < 0`: Check if interestRate is null or negative.
        // - `formData.loanTerm === null || formData.loanTerm <= 0`: Check if loanTerm is null or non-positive.
        // - `!formData.startDate`: Check if start date is empty.
        if (!formData.client || formData.loanAmount === null || formData.loanAmount <= 0 ||
            formData.interestRate === null || formData.interestRate < 0 ||
            formData.loanTerm === null || formData.loanTerm <= 0 || !formData.startDate) {
            setError('Please fill in all required fields correctly (Loan Amount, Interest Rate, Loan Term must be positive numbers).');
            toast.error('Please fill in all required fields correctly.'); // Display toast error for user feedback
            return; // Stop submission
        }

        try {
            // Send a POST request to the backend to add a new loan.
            const response = await fetch(`${BACKEND_URL}/api/loans`, {
                method: 'POST', // HTTP POST method
                headers: {
                    'Content-Type': 'application/json', // Specify content type as JSON
                    'Authorization': `Bearer ${token}`  // Include JWT token in Authorization header for authentication
                },
                credentials: 'include', // Ensure cookies are sent with the request (important for some auth flows)
                body: JSON.stringify(formData) // Send form data as a JSON string in the request body
            });

            // Handle 401 Unauthorized or 403 Forbidden responses (authentication/authorization failures).
            if (response.status === 401 || response.status === 403) {
                clearAuthData(); // Clear invalid authentication data
                navigate('/'); // Redirect to login page
                toast.error('Authentication expired or unauthorized. Please log in again.'); // Notify user
                return; // Stop execution
            }

            // Handle non-OK HTTP responses (server-side errors or validation errors from backend).
            if (!response.ok) {
                const errorData = await response.json(); // Parse error response body (expecting JSON)
                console.error("Error adding loan response:", errorData); // Log detailed error from backend
                throw new Error(errorData.message || 'Failed to add loan.'); // Throw a new error with a user-friendly message
            }

            const data = await response.json(); // Parse successful response data (e.g., the newly created loan object)
            console.log('Loan added successfully:', data); // Log success
            setSuccessMessage('Loan added successfully!'); // Set success message for display
            toast.success('Loan added successfully!'); // Display toast success notification

            // Reset form fields after successful submission to clear the form for new input.
            setFormData({
                client: '',
                loanAmount: 0,
                interestRate: 0,
                loanTerm: 0,
                termUnit: 'months',
                startDate: today, // Reset start date to today
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
            // Redirect to the loans list page after a short delay to allow user to see success message.
            setTimeout(() => {
                navigate('/loans');
            }, 1500);
        } catch (err) {
            console.error("AddLoanPage: Error in handleSubmit:", err); // Log any client-side or network errors
            setError(err.message || "Network error or server unavailable."); // Set error message for display
            toast.error(`Error adding loan: ${err.message || "Network error"}`); // Display toast error
        }
    };

    // --- Conditional Rendering for Loading and Error States ---
    // Display loading message while client data is being fetched.
    if (loading) {
        return <div className="addLoanPageContainer addLoanLoading">Loading clients...</div>;
    }

    // Display a global error message if fetching clients failed AND no clients were loaded.
    // This prevents showing an error if clients are just empty due to filtering (e.g., no eligible clients).
    if (error && !clients.length) {
        return <div className="addLoanPageContainer addLoanErrorMessage">Error: {error}</div>;
    }

    // If no eligible clients are found, and the component is not loading, and we are not renewing a loan
    // (which would pre-select a client not necessarily in the 'no_active_loan' list),
    // display a message indicating that no clients are available for a new loan.
    if (clients.length === 0 && !loading && !loanDataToRenew?.client) {
        return <div className="addLoanPageContainer addLoanErrorMessage">No eligible clients found to add a loan for. All clients may already have an active loan, or there are no clients registered.</div>;
    }

    // Main component render: Displays the loan input form.
    return (
        <div className="addLoanPageContainer">
            <div className="addLoanPageContent">
                {/* Link to navigate back to the Loans Overview page. */}
                <Link to="/loans" className="addLoanBackLink">
                    {"<"} Back to Loans Overview
                </Link>
                {/* Page headline */}
                <h1 className="addLoanHeadline">Add New Loan</h1>

                {/* Display error message if `error` state is not null. */}
                {error && <div className="addLoanErrorMessage">{error}</div>}
                {/* Display success message if `successMessage` state is not null. */}
                {successMessage && <div className="addLoanSuccessMessage">{successMessage}</div>}

                {/* Loan input form. */}
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
                        >
                            <option value="">Select a Client</option>
                            {/* Conditionally render the pre-selected client for renewal, if not already in the fetched list */}
                            {loanDataToRenew?.client && !clients.some(c => c._id === loanDataToRenew.client) && (
                                <option key={loanDataToRenew.client} value={loanDataToRenew.client}>
                                    {/* You might need to fetch the client's name or email if `loanDataToRenew` only contains ID */}
                                    {`Pre-selected Client ID: ${loanDataToRenew.client}`}
                                </option>
                            )}
                            {/* Map through the fetched list of available clients to populate dropdown options. */}
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>
                                    {client.name} ({client.email}) {/* Display client name and email */}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Loan Amount Input */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="loanAmount">Loan Amount (ZMW):</label>
                        <input
                            type="number" // Specifies numeric input keyboard on mobile, allows step/min attributes
                            id="loanAmount"
                            name="loanAmount"
                            value={formData.loanAmount === null ? '' : formData.loanAmount} // Display empty string for null, allowing user to clear
                            onChange={handleChange} // Call handleChange on input change
                            className="addLoanInput"
                            step="0.01" // Allows decimal values for currency (e.g., 100.50)
                            min="0.01" // Ensures loan amount is positive and non-zero
                            required // HTML5 form validation: field is mandatory
                        />
                    </div>

                    {/* Interest Rate Input */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="interestRate">Interest Rate (% Direct):</label>
                        <input
                            type="number"
                            id="interestRate"
                            name="interestRate"
                            value={formData.interestRate === null ? '' : formData.interestRate}
                            onChange={handleChange}
                            className="addLoanInput"
                            step="0.01" // Allows decimal values for percentages
                            min="0" // Interest rate can be 0 or positive
                            required
                        />
                    </div>

                    {/* Calculated Interest Amount Display (Read-Only) */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="interestAmount">Calculated Interest Amount (ZMW):</label>
                        <input
                            type="text" // Use text as it's read-only and may display formatted numbers
                            id="interestAmount"
                            name="interestAmount"
                            value={formData.interestAmount} // Displays the value calculated in useEffect
                            className="addLoanInput"
                            readOnly // Prevents user from typing into this field
                        />
                    </div>

                    {/* Loan Term Input and Unit Selection */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="loanTerm">Loan Term:</label>
                        <input
                            type="number"
                            id="loanTerm"
                            name="loanTerm"
                            value={formData.loanTerm === null ? '' : formData.loanTerm}
                            onChange={handleChange}
                            className="addLoanInput"
                            min="1" // Minimum loan term of 1 unit
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

                    {/* Start Date Input */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="startDate">Start Date:</label>
                        <input
                            type="date" // HTML5 date picker
                            id="startDate"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="addLoanInput"
                            required
                        />
                    </div>

                    {/* Calculated Due Date Display (Read-Only) */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="dueDate">Due Date (Calculated):</label>
                        <input
                            type="date" // Use date type for date picker functionality, even if read-only
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate} // Displays the value calculated in useEffect
                            onChange={handleChange} // Still attach for consistency, though readOnly
                            className="addLoanInput"
                            readOnly
                        />
                    </div>

                    {/* Payments Made Display (Read-Only - for new loans, always 0) */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="paymentsMade">Payments Made (ZMW):</label>
                        <input
                            type="number"
                            id="paymentsMade"
                            name="paymentsMade"
                            value={formData.paymentsMade} // Initialized to 0 for new loans
                            onChange={handleChange} // Still attach for consistency, though readOnly
                            className="addLoanInput"
                            step="0.01"
                            min="0"
                            readOnly
                        />
                    </div>

                    {/* Calculated Total Repayment Amount Display (Read-Only) */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="totalRepaymentAmount">Calculated Total Repayment (ZMW):</label>
                        <input
                            type="text"
                            id="totalRepaymentAmount"
                            name="totalRepaymentAmount"
                            value={formData.totalRepaymentAmount} // Displays the value calculated in useEffect
                            onChange={handleChange} // Still attach for consistency, though readOnly
                            className="addLoanInput"
                            readOnly
                        />
                    </div>

                    {/* Calculated Balance Due Display (Read-Only) */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="balanceDue">Calculated Balance Due (ZMW):</label>
                        <input
                            type="text"
                            id="balanceDue"
                            name="balanceDue"
                            value={formData.balanceDue} // Displays the value calculated in useEffect
                            onChange={handleChange} // Still attach for consistency, though readOnly
                            className="addLoanInput"
                            readOnly
                        />
                    </div>

                    {/* Loan Status Selection */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="status">Status:</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status} // Controls the selected option
                            onChange={handleChange} // Updates state on change
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

                    {/* Loan Description Textarea */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="description">Description (Optional):</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="addLoanTextarea"
                            rows="3" // Sets the number of visible text lines
                            maxLength="500" // Max length for description
                            placeholder="e.g., Loan for business expansion, vehicle purchase, etc."
                        ></textarea>
                    </div>

                    {/* Collateral Details Section */}
                    <section className="collateralSection">
                        <h2 className="collateralHeadline">Collateral Details (Optional)</h2>
                        {/* Collateral Type Input */}
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
                        {/* Collateral Estimated Value Input */}
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralValue">Collateral Estimated Value (ZMW):</label>
                            <input
                                type="number"
                                id="collateralValue"
                                name="collateralValue"
                                value={formData.collateralValue === null ? '' : formData.collateralValue}
                                onChange={handleChange}
                                className="addLoanInput"
                                step="0.01" // Allows decimal values
                                min="0" // Collateral value cannot be negative
                                placeholder="e.g., 15000.00"
                            />
                        </div>
                        {/* Collateral Description Textarea */}
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralDescription">Collateral Description:</label>
                            <textarea
                                id="collateralDescription"
                                name="collateralDescription"
                                value={formData.collateralDescription}
                                onChange={handleChange}
                                className="addLoanTextarea"
                                rows="3"
                                maxLength="500" // Max length for collateral description
                                placeholder="e.g., 2015 Toyota Corolla, VIN: ABC123..., Color: Blue"
                            ></textarea>
                        </div>
                    </section>

                    {/* Submit Button */}
                    <button type="submit" className="addLoanSubmitBtn">Add Loan</button>
                </form>
            </div>
        </div>
    );
};

export default AddLoanPage;
