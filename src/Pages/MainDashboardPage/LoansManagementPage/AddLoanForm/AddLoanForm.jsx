// src/Pages/MainDashboardPage/LoansManagementPage/AddLoanForm/AddLoanForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
// REMOVED: import { useAuth } from "../../../../context/AuthContext"; // No longer needed here
// Corrected imports: Now importing from modular loanApi and clientApi services
import { addLoan } from "../../../../services/api/loanApi"; // For adding loans
import { getEligibleClients } from "../../../../services/api/clientApi"; // For fetching clients

import "./AddLoanForm.css"; // Ensure your CSS is correctly linked

/**
 * @component AddLoanForm
 * @description Allows administrators to add a new loan or renew an existing loan for a client.
 * It fetches eligible clients, calculates loan financials, and handles form submission.
 */
const AddLoanForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // No need to de-structure logout here, as axiosInstance interceptor handles 401 redirects.
    // const { logout } = useAuth(); // REMOVED as useAuth is no longer imported

    const { loanDataToRenew } = location.state || {}; // Destructure loanDataToRenew from state

    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

    const [formData, setFormData] = useState({
        client: "", // Stores client _id
        loanAmount: "",
        interestRate: "",
        loanTerm: "",
        termUnit: "months",
        startDate: today,
        dueDate: "",
        paymentsMade: 0, // Should typically start at 0 for a new/renewed loan
        balanceDue: "",
        totalRepaymentAmount: "",
        interestAmount: "",
        status: "pending", // Default status for new loans
        description: "",
        collateralType: "",
        collateralValue: "",
        collateralDescription: "",
    });

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true); // For initial data fetch (clients or renewal data)
    const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
    const [fetchError, setFetchError] = useState(null); // For errors during initial data fetch or form validation

    /**
     * Initializes form data when the component mounts or if a loan is being renewed.
     */
    useEffect(() => {
        if (loanDataToRenew) {
            setFormData((prevData) => ({
                ...prevData,
                // Pre-fill from existing loan, ensuring correct types
                client: loanDataToRenew.client || "", // client is likely client _id
                loanAmount: parseFloat(loanDataToRenew.loanAmount) || "",
                interestRate: parseFloat(loanDataToRenew.interestRate) || "",
                loanTerm: parseInt(loanDataToRenew.loanTerm) || "",
                termUnit: loanDataToRenew.termUnit || "months",
                startDate: today, // New start date for renewed loan
                // Reset calculated/payment fields for a fresh loan
                paymentsMade: 0,
                balanceDue: "",
                totalRepaymentAmount: "",
                interestAmount: "",
                dueDate: "",
                status: "pending", // Renewed loan starts as pending
                description: loanDataToRenew.description || "",
                collateralType: loanDataToRenew.collateralType || "",
                collateralValue: parseFloat(loanDataToRenew.collateralValue) || "",
                collateralDescription: loanDataToRenew.collateralDescription || "",
            }));

            // For renewal, set clients list to only include the renewed client for the dropdown
            // Ensure client name/email are correctly populated for display
            const renewedClient = {
                _id: loanDataToRenew.client, // Assuming loanDataToRenew.client is the client _id
                name: loanDataToRenew.clientName || "Unknown Client", // Assuming clientName comes from the loan object
                email: loanDataToRenew.clientEmail || "", // Assuming clientEmail comes from the loan object
            };
            setClients([renewedClient]);
            setLoading(false); // No need to fetch clients if renewing
        }
    }, [loanDataToRenew, today]);

    /**
     * Fetches clients eligible for a new loan.
     * This is only called if not in renewal mode.
     */
    const fetchClients = useCallback(async () => {
        if (loanDataToRenew) {
            // If renewing, client data is pre-set, no need to fetch.
            return;
        }

        setLoading(true);
        setFetchError(null);

        try {
            // Use the centralized API function from clientApi
            const response = await getEligibleClients();
            setClients(response.clients || []);
        } catch (err) {
            console.error("Error fetching eligible clients:", err);
            // handleApiError (from axiosInstance) already displays toasts for API errors.
            // Here, we just update the local error state for component display.
            setFetchError(err.message || "Failed to load eligible clients.");
            // No explicit logout/navigate here, as the axios interceptor handles 401 redirects.
        } finally {
            setLoading(false);
        }
    }, [loanDataToRenew]); // Removed `logout` from dependencies as it's not directly used in this logic flow

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    /**
     * Handles changes to form input fields, parsing numbers correctly.
     */
    const handleChange = (e) => {
        const { name, value, type } = e.target;

        setFormData((prevData) => {
            let newValue = value;
            // Convert to number if type is 'number' and value is not empty
            if (type === "number" && value !== "") {
                newValue = parseFloat(value);
            } else if (type === "number" && value === "") {
                newValue = ""; // Keep it as an empty string if input is cleared
            }
            return {
                ...prevData,
                [name]: newValue,
            };
        });
    };

    /**
     * Calculates loan financials (interest, total repayment, balance due, due date).
     * Memoized with useCallback to prevent unnecessary re-creations.
     */
    const calculateLoanFinancials = useCallback(() => {
        const loanAmount = parseFloat(formData.loanAmount);
        const interestRate = parseFloat(formData.interestRate);
        const loanTerm = parseInt(formData.loanTerm);
        const startDate = formData.startDate;

        let calculatedInterestAmount = "";
        let calculatedTotalRepaymentAmount = "";
        let calculatedBalanceDue = "";
        let calculatedDueDate = "";

        // Calculate interest, total repayment, and balance due
        if (
            !isNaN(loanAmount) &&
            loanAmount > 0 &&
            !isNaN(interestRate) &&
            !isNaN(loanTerm) &&
            loanTerm > 0
        ) {
            // Simple interest calculation: P * R * T (Principal * Rate * Time)
            // Assuming interestRate is already a percentage (e.g., 5 for 5%)
            // And loanTerm is in months (as per default termUnit) for this direct calculation.
            // If interest rate is per annum, and term is months, it needs adjustment (rate / 12).
            // For now, based on "Interest Rate (% Direct)", assuming it's the direct rate for the term.
            calculatedInterestAmount = (loanAmount * (interestRate / 100) * (formData.termUnit === 'months' ? loanTerm : 1)).toFixed(2); // Adjust if rate/term unit differs
            calculatedTotalRepaymentAmount = (loanAmount + parseFloat(calculatedInterestAmount)).toFixed(2);
            calculatedBalanceDue = calculatedTotalRepaymentAmount; // Initial balance due is total repayment
        }

        // Calculate due date
        if (startDate && loanTerm > 0 && !isNaN(loanTerm)) {
            const start = new Date(startDate + 'T00:00:00'); // Ensure date is treated as UTC to avoid timezone issues
            let dueDateCalc = new Date(start);

            switch (formData.termUnit) {
                case "days":
                    dueDateCalc.setDate(start.getDate() + loanTerm);
                    break;
                case "weeks":
                    dueDateCalc.setDate(start.getDate() + loanTerm * 7);
                    break;
                case "months":
                    // Set month, then adjust day if original day was past new month's max days
                    dueDateCalc.setMonth(start.getMonth() + loanTerm);
                    // This logic fixes cases like Jan 31 + 1 month = Mar 2 (wrong), should be Feb 28/29
                    // By setting day to 0, it goes to last day of *previous* month, then add original day
                    // Example: Jan 31 -> Mar 31 (if simple setMonth)
                    // If Jan 31 + 1 month, it goes to Feb 31 (invalid), JS corrects to Mar 2 or 3
                    // Correct way: set the day to the start day, then set the month. If the day rolls over,
                    // means the start day was too high for the target month.
                    const originalDay = start.getDate();
                    dueDateCalc = new Date(start.getFullYear(), start.getMonth() + loanTerm, originalDay);
                    // If the date rolled over, set it to the last day of the target month
                    if (dueDateCalc.getMonth() !== ((start.getMonth() + loanTerm) % 12)) {
                        dueDateCalc = new Date(start.getFullYear(), start.getMonth() + loanTerm + 1, 0); // Last day of target month
                    }
                    break;
                case "years":
                    dueDateCalc.setFullYear(start.getFullYear() + loanTerm);
                    // Similar adjustment for year-based calculation (e.g. Feb 29 leap year issues)
                    const originalMonth = start.getMonth();
                    const originalDate = start.getDate();
                    dueDateCalc = new Date(start.getFullYear() + loanTerm, originalMonth, originalDate);
                     if (dueDateCalc.getMonth() !== originalMonth) {
                        dueDateCalc = new Date(start.getFullYear() + loanTerm, originalMonth + 1, 0);
                    }
                    break;
                default:
                    break;
            }
            calculatedDueDate = dueDateCalc.toISOString().split("T")[0];
        }

        // Update formData if calculated values have changed
        setFormData((prevData) => {
            const updatedData = {};
            // Only update if there's an actual change to avoid infinite loops with useEffect
            if (prevData.totalRepaymentAmount !== calculatedTotalRepaymentAmount) {
                updatedData.totalRepaymentAmount = calculatedTotalRepaymentAmount;
            }
            if (prevData.balanceDue !== calculatedBalanceDue) {
                updatedData.balanceDue = calculatedBalanceDue;
            }
            if (prevData.dueDate !== calculatedDueDate) {
                updatedData.dueDate = calculatedDueDate;
            }
            if (prevData.interestAmount !== calculatedInterestAmount) {
                updatedData.interestAmount = calculatedInterestAmount;
            }

            return Object.keys(updatedData).length > 0
                ? { ...prevData, ...updatedData }
                : prevData;
        });
    }, [
        formData.loanAmount,
        formData.interestRate,
        formData.loanTerm,
        formData.termUnit,
        formData.startDate,
    ]);

    // Trigger loan financial calculation whenever relevant fields change
    useEffect(() => {
        // Only calculate if all relevant fields have valid numbers
        const { loanAmount, interestRate, loanTerm } = formData;
        if (
            !isNaN(parseFloat(loanAmount)) && parseFloat(loanAmount) > 0 &&
            !isNaN(parseFloat(interestRate)) &&
            !isNaN(parseInt(loanTerm)) && parseInt(loanTerm) > 0
        ) {
            calculateLoanFinancials();
        } else {
            // Clear calculated fields if inputs are invalid/empty
            setFormData(prevData => ({
                ...prevData,
                interestAmount: "",
                totalRepaymentAmount: "",
                balanceDue: "",
                dueDate: "",
            }));
        }
    }, [formData.loanAmount, formData.interestRate, formData.loanTerm, formData.termUnit, formData.startDate, calculateLoanFinancials]);


    /**
     * Handles the form submission for adding a new loan.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFetchError(null); // Clear submission-specific errors
        setIsSubmitting(true);

        // Basic client-side validation
        if (
            !formData.client ||
            isNaN(parseFloat(formData.loanAmount)) ||
            parseFloat(formData.loanAmount) <= 0 ||
            isNaN(parseFloat(formData.interestRate)) ||
            parseFloat(formData.interestRate) < 0 ||
            isNaN(parseInt(formData.loanTerm)) ||
            parseInt(formData.loanTerm) <= 0 ||
            !formData.startDate
        ) {
            const validationError = "Please fill in all required fields correctly (Loan Amount, Interest Rate, Loan Term must be positive numbers).";
            setFetchError(validationError); // Set local error for form display
            toast.error(validationError); // Show as toast
            setIsSubmitting(false);
            return;
        }

        try {
            // Prepare data for submission - ensure numbers are sent as numbers, null for empty optional fields
            const dataToSubmit = {
                ...formData,
                loanAmount: parseFloat(formData.loanAmount),
                interestRate: parseFloat(formData.interestRate),
                loanTerm: parseInt(formData.loanTerm),
                // Ensure collateralValue is null if empty string, otherwise parsed float
                collateralValue: formData.collateralValue === "" ? null : parseFloat(formData.collateralValue),
                // Ensure calculated fields are sent as numbers
                interestAmount: parseFloat(formData.interestAmount),
                totalRepaymentAmount: parseFloat(formData.totalRepaymentAmount),
                balanceDue: parseFloat(formData.balanceDue),
            };

            // Use the centralized API function from loanApi
            const response = await addLoan(dataToSubmit);

            toast.success(response.message || "Loan added successfully!");

            // Reset form or navigate
            setFormData({
                client: "",
                loanAmount: "",
                interestRate: "",
                loanTerm: "",
                termUnit: "months",
                startDate: today,
                dueDate: "",
                paymentsMade: 0,
                balanceDue: "",
                totalRepaymentAmount: "",
                interestAmount: "",
                status: "pending",
                description: "",
                collateralType: "",
                collateralValue: "",
                collateralDescription: "",
            });
            // Navigate after a short delay for toast to be visible
            setTimeout(() => {
                navigate("/loans"); // Redirect to loans list
            }, 1500);
        } catch (err) {
            console.error("Error submitting loan:", err);
            // handleApiError (from axiosInstance) already displays toasts for API errors.
            // Here, we just update the local error state for component display.
            setFetchError(err.message || "Failed to add loan. Please try again.");
            // No explicit logout/navigate here, as the axios interceptor handles 401 redirects.
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Conditional Rendering for Loading and Error States ---
    if (loading) {
        return (
            <div className="addLoanPageContainer addLoanLoading">
                Loading clients...
            </div>
        );
    }

    // Display a global error message if fetching clients failed AND no clients were loaded.
    // This now specifically applies to the "add new loan" scenario, not renewal.
    if (fetchError && !loanDataToRenew && clients.length === 0) { // Added clients.length === 0 check here
        return (
            <div className="addLoanPageContainer addLoanErrorMessage">
                Error: {fetchError}
                <br />
                <Link to="/loans">
                    <button className="addLoanBackLink">Back to Loans Overview</button>
                </Link>
            </div>
        );
    }

    // If no eligible clients are found, and the component is not loading, AND we are NOT renewing a loan,
    // display a message indicating that no clients are available for a new loan.
    // This condition should only trigger if getEligibleClients returns an empty array.
    if (clients.length === 0 && !loading && !loanDataToRenew && !fetchError) { // Added !fetchError
        return (
            <div className="addLoanPageContainer addLoanErrorMessage">
                <p className="noClientsFoundForLoan">
                    No eligible clients found to add a loan for. All clients may already
                    have an active or overdue loan, or there are no clients registered.
                    Please ensure there are clients registered and without active loans.
                </p>
                <Link to="/clients">
                    <button className="addLoanBackLink">Back to Clients Dashboard</button>
                </Link>
            </div>
        );
    }

    // Main component render: Displays the loan input form.
    return (
        <div className="addLoanPageContainer">
            <div className="addLoanPageContent">
                <Link to="/loans" className="addLoanBackLink">
                    <button className="addLoanBackLinkButton">Back to Loans Overview</button>
                </Link>
                <h1 className="addLoanHeadline">
                    {loanDataToRenew ? "Renew Loan" : "Add New Loan"}
                </h1>

                {/* Display form-specific error message if validation fails or submission error */}
                {/* No need for fetchError here, toast handles it. Keeping it if there's a reason for persistent in-form error. */}
                {/* {fetchError && <div className="addLoanErrorMessage">{fetchError}</div>} */}

                <form onSubmit={handleSubmit} className="addLoanForm">
                    {/* Client Selection Dropdown */}
                    <div className="addLoanFormGroup">
                        <label htmlFor="client">Client:</label>
                        <select
                            id="client"
                            name="client"
                            value={formData.client}
                            onChange={handleChange}
                            className="addLoanSelect"
                            required
                            disabled={!!loanDataToRenew || isSubmitting} // Disable if renewing or submitting
                        >
                            {loanDataToRenew ? (
                                <option key={formData.client} value={formData.client}>
                                    {clients[0]?.name} ({clients[0]?.email})
                                </option>
                            ) : (
                                <>
                                    <option value="">Select a Client</option>
                                    {clients.map((client) => (
                                        <option key={client._id} value={client._id}>
                                            {client.firstName} {client.lastName} ({client.email}) {/* Assuming client has firstName, lastName */}
                                        </option>
                                    ))}
                                </>
                            )}
                        </select>
                        {clients.length === 0 && !loading && !loanDataToRenew && (
                            <p className="addLoanInfoText">
                                No clients without active or overdue loans found.
                            </p>
                        )}
                        {loanDataToRenew && (
                            <p className="addLoanInfoText">
                                Client pre-selected for renewal.
                            </p>
                        )}
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
                            disabled={isSubmitting} // Disable while submitting
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="interestRate">Interest Rate (%):</label>
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
                            disabled={isSubmitting} // Disable while submitting
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="interestAmount">
                            Calculated Interest Amount (ZMW):
                        </label>
                        <input
                            type="text"
                            id="interestAmount"
                            name="interestAmount"
                            value={formData.interestAmount}
                            className="addLoanInput"
                            readOnly
                            disabled // Always disabled as it's calculated
                        />
                    </div>

                    <div className="addLoanFormGroup term-group">
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
                            disabled={isSubmitting} // Disable while submitting
                        />
                        <select
                            id="termUnit"
                            name="termUnit"
                            value={formData.termUnit}
                            onChange={handleChange}
                            className="addLoanSelect term-unit-select"
                            disabled={isSubmitting} // Disable while submitting
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
                            disabled={isSubmitting} // Disable while submitting
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="dueDate">Due Date (Calculated):</label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            className="addLoanInput"
                            readOnly
                            disabled // Always disabled as it's calculated
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="paymentsMade">Payments Made (ZMW):</label>
                        <input
                            type="number"
                            id="paymentsMade"
                            name="paymentsMade"
                            value={formData.paymentsMade}
                            className="addLoanInput"
                            step="0.01"
                            min="0"
                            readOnly
                            disabled // Always disabled as it's calculated
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="totalRepaymentAmount">
                            Calculated Total Repayment (ZMW):
                        </label>
                        <input
                            type="text"
                            id="totalRepaymentAmount"
                            name="totalRepaymentAmount"
                            value={formData.totalRepaymentAmount}
                            className="addLoanInput"
                            readOnly
                            disabled // Always disabled as it's calculated
                        />
                    </div>

                    <div className="addLoanFormGroup">
                        <label htmlFor="description">Description (Optional):</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="addLoanInput"
                            rows="3"
                            disabled={isSubmitting} // Disable while submitting
                        ></textarea>
                    </div>

                    <div className="addLoanSection">
                        <h2 className="addLoanCollateralSectionTitle">
                            Collateral Information (Optional)
                        </h2>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralType">Collateral Type:</label>
                            <input
                                type="text"
                                id="collateralType"
                                name="collateralType"
                                value={formData.collateralType}
                                onChange={handleChange}
                                className="addLoanInput"
                                disabled={isSubmitting} // Disable while submitting
                            />
                        </div>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralValue">Collateral Value (ZMW):</label>
                            <input
                                type="number"
                                id="collateralValue"
                                name="collateralValue"
                                value={formData.collateralValue}
                                onChange={handleChange}
                                className="addLoanInput"
                                step="0.01"
                                min="0"
                                disabled={isSubmitting} // Disable while submitting
                            />
                        </div>
                        <div className="addLoanFormGroup">
                            <label htmlFor="collateralDescription">
                                Collateral Description:
                            </label>
                            <textarea
                                id="collateralDescription"
                                name="collateralDescription"
                                value={formData.collateralDescription}
                                onChange={handleChange}
                                className="addLoanInput"
                                rows="3"
                                disabled={isSubmitting} // Disable while submitting
                            ></textarea>
                        </div>
                    </div>

                    <button type="submit" className="addLoanSubmitButton" disabled={isSubmitting}>
                        {isSubmitting ? "Processing..." : (loanDataToRenew ? "Renew Loan" : "+ Add Loan")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddLoanForm;
