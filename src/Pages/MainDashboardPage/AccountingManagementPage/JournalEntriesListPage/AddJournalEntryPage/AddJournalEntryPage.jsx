// src/Pages/MainDashboardPage/AccountingManagementDashboard/JournalEntriesListPage/AddJournalEntryPage/AddJournalEntryPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify"; // For notifications
import "./AddJournalEntryPage.css"; // Common CSS for journal entry pages

// Import the centralized API functions from accountingApi
import {
    getJournalEntryById,   // For fetching an existing journal entry
    addJournalEntry,       // For creating a new journal entry (renamed from createJournalEntry for consistency)
    updateJournalEntry,    // For updating an existing journal entry
} from "../../../../../services/api/journalEntryApi"; // Corrected and consolidated import path


import {
    getAllAccounts,    // For updating an existing journal entry
} from "../../../../../services/api/accountApi"; // Corrected and consolidated import path

/**
 * @component AddJournalEntryPage
 * @description Component for adding or editing a journal entry.
 * It fetches accounts for line items, validates debits/credits balance,
 * and interacts with the backend API for creation and updates.
 */
const AddJournalEntryPage = () => {
    // useParams to check if we are in edit mode. Extracts 'id' from the URL.
    const { id: entryId } = useParams();
    const navigate = useNavigate(); // Hook for programmatic navigation.

    // State for general journal entry details
    const [entryDate, setEntryDate] = useState("");
    const [description, setDescription] = useState("");
    // State for journal entry line items. Initialized with two empty lines.
    const [lines, setLines] = useState([
        { accountId: "", debit: "", credit: "", lineDescription: "" },
        { accountId: "", debit: "", credit: "", lineDescription: "" },
    ]);
    // State for optional related document linking
    const [relatedDocumentId, setRelatedDocumentId] = useState("");
    const [relatedDocumentType, setRelatedDocumentType] = useState("");

    // State for data loading and error handling
    const [accounts, setAccounts] = useState([]); // Stores the list of all accounts for the dropdowns
    const [loading, setLoading] = useState(true); // Indicates if data is being loaded or processed
    const [error, setError] = useState(null);     // Stores any error messages
    const [isEditMode, setIsEditMode] = useState(false); // Flag to determine if the component is in edit mode

    // Calculate total debits and credits from the current line items.
    // parseFloat is used to convert string inputs from form fields to numbers.
    const rawTotalDebits = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const rawTotalCredits = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    // Determine if the journal entry is balanced.
    // Using a small epsilon (0.01) for floating-point comparison to account for precision issues.
    // Also, ensures that total amounts are greater than zero to prevent "balanced but empty" entries.
    const isBalanced = Math.abs(rawTotalDebits - rawTotalCredits) < 0.01 && rawTotalDebits > 0;

    // For display purposes, format totals to two decimal places.
    const displayTotalDebits = rawTotalDebits.toFixed(2);
    const displayTotalCredits = rawTotalCredits.toFixed(2);

    // --- Fetch Accounts for Dropdowns ---
    /**
     * @function fetchAccountsData
     * @description Fetches the list of all accounting accounts from the backend API.
     * This data is used to populate the dropdowns for selecting accounts in each line item.
     */
    const fetchAccountsData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getAllAccounts(); // Use the centralized API function
            // Sort accounts by accountCode for a consistent and user-friendly dropdown order.
            setAccounts(data.sort((a, b) => a.accountCode.localeCompare(b.accountCode)));
        } catch (err) {
            console.error("AddJournalEntryPage: Error fetching accounts:", err);
            // Set error state for display. The Axios interceptor might also show a toast.
            setError(err.message || "Failed to fetch accounts. Please try again.");
        } finally {
            // Only set loading to false here. If also fetching entry data, that finally block will handle it.
            // This ensures loading state is correct when either fetch operation is complete.
            setLoading(false);
        }
    }, []); // No external dependencies, so this function is stable.

    // --- Fetch Journal Entry for Edit Mode ---
    /**
     * @function fetchJournalEntryData
     * @description Fetches an existing journal entry's details from the backend.
     * This function is called when the component is in "edit mode" (i.e., `entryId` is present).
     * Populates the form fields with the fetched data.
     */
    const fetchJournalEntryData = useCallback(async () => {
        if (!entryId) return; // Only execute if an entry ID is provided (meaning we are in edit mode).

        setLoading(true);
        setError(null);

        try {
            const data = await getJournalEntryById(entryId); // Use the centralized API function
            // Format the entry date for the HTML date input field.
            const formattedDate = data.entryDate ? new Date(data.entryDate).toISOString().split('T')[0] : '';
            setEntryDate(formattedDate);
            setDescription(data.description);
            // Map the backend's line items to the frontend's state format.
            // Ensure debit/credit are strings for input `value` attributes.
            setLines(
                data.lines.map((line) => ({
                    accountId: line.accountId._id, // Assuming accountId is populated with full account object by backend
                    debit: line.debit !== undefined ? String(line.debit) : "",
                    credit: line.credit !== undefined ? String(line.credit) : "",
                    lineDescription: line.lineDescription || "",
                }))
            );
            // Set related document fields if they exist in the fetched data.
            if (data.relatedDocument) {
                setRelatedDocumentId(data.relatedDocument.id || "");
                setRelatedDocumentType(data.relatedDocument.type || "");
            }
            setIsEditMode(true); // Confirm we are in edit mode.
        } catch (err) {
            console.error(
                "AddJournalEntryPage: Error fetching journal entry for edit:",
                err
            );
            setError(err.message || "Failed to fetch journal entry details. Please try again.");
            toast.error(
                `Error fetching journal entry: ${err.message || "Network error"}`
            );
            // If the entry is not found (e.g., 404), navigate back to the list page.
            if (err.message.includes("not found") || err.message.includes("Invalid ID")) {
                navigate("/accounting/journal-entries"); // Corrected navigation path
            }
        } finally {
            setLoading(false); // End loading after fetching the entry data.
        }
    }, [navigate, entryId]); // `navigate` and `entryId` are dependencies.

    // useEffect hook to call data fetching functions on component mount and when dependencies change.
    useEffect(() => {
        fetchAccountsData(); // Always fetch accounts.
        if (entryId) {
            fetchJournalEntryData(); // Only fetch journal entry data if in edit mode.
        } else {
            setLoading(false); // If not in edit mode, loading is complete after accounts are fetched.
        }
    }, [fetchAccountsData, fetchJournalEntryData, entryId]);

    // --- Line Item Handlers ---
    /**
     * @function handleAddLine
     * @description Adds a new empty line item to the journal entry form.
     */
    const handleAddLine = () => {
        setLines([
            ...lines,
            { accountId: "", debit: "", credit: "", lineDescription: "" },
        ]);
    };

    /**
     * @function handleRemoveLine
     * @description Removes a line item from the journal entry form at a given index.
     * Prevents removing lines if it would leave fewer than two line items.
     * @param {number} index - The index of the line item to remove.
     */
    const handleRemoveLine = (index) => {
        if (lines.length > 2) {
            const newLines = lines.filter((_, i) => i !== index);
            setLines(newLines);
        } else {
            toast.warn("A journal entry must have at least two line items.");
        }
    };

    /**
     * @function handleChangeLine
     * @description Handles changes to individual fields within a line item.
     * Automatically clears the opposing debit/credit field when one is entered.
     * @param {number} index - The index of the line item being changed.
     * @param {string} field - The name of the field being updated ('accountId', 'debit', 'credit', 'lineDescription').
     * @param {string} value - The new value for the field.
     */
    const handleChangeLine = (index, field, value) => {
        const newLines = [...lines];
        if (field === "debit") {
            // Validate if value is empty or a valid number. Clear credit if debit is set.
            if (value !== "" && isNaN(parseFloat(value))) return;
            newLines[index] = { ...newLines[index], debit: value, credit: "" };
        } else if (field === "credit") {
            // Validate if value is empty or a valid number. Clear debit if credit is set.
            if (value !== "" && isNaN(parseFloat(value))) return;
            newLines[index] = { ...newLines[index], credit: value, debit: "" };
        } else {
            // For other fields (accountId, lineDescription), just update the value.
            newLines[index] = { ...newLines[index], [field]: value };
        }
        setLines(newLines);
    };

    // --- Form Submission ---
    /**
     * @function handleSubmit
     * @description Handles the submission of the journal entry form (both creation and update).
     * Performs client-side validation and then calls the appropriate API function.
     * @param {Object} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Client-side validation for overall entry details
        if (!entryDate) {
            toast.error("Entry date is required.");
            setLoading(false);
            return;
        }
        if (!description.trim()) {
            toast.error("Description is required.");
            setLoading(false);
            return;
        }

        // Process and validate line items before sending to backend
        let currentTotalDebits = 0;
        let currentTotalCredits = 0;
        const processedLines = [];

        for (const line of lines) {
            const debitValue = parseFloat(line.debit) || 0;
            const creditValue = parseFloat(line.credit) || 0;

            // Validate that each line has an accountId selected.
            if (!line.accountId) {
                toast.error("All line items must have an account selected.");
                setLoading(false);
                return;
            }

            // Validate that each line has either a debit OR a credit (but not both, and not zero for both).
            if (debitValue > 0 && creditValue > 0) {
                toast.error("A line item cannot have both a debit and a credit amount. Please clear one.");
                setLoading(false);
                return;
            }
            if (debitValue === 0 && creditValue === 0) {
                toast.error("A line item cannot have both debit and credit as zero. Please enter an amount.");
                setLoading(false);
                return;
            }

            processedLines.push({
                accountId: line.accountId,
                debit: debitValue,
                credit: creditValue,
                lineDescription: line.lineDescription.trim(),
            });

            currentTotalDebits += debitValue;
            currentTotalCredits += creditValue;
        }

        // Validate that there are at least two line items after processing.
        if (processedLines.length < 2) {
            toast.error("A journal entry must have at least two valid line items.");
            setLoading(false);
            return;
        }

        // Validate overall balance using a small epsilon for floating point comparison.
        if (Math.abs(currentTotalDebits - currentTotalCredits) > 0.01) {
            toast.error(
                `Debits (ZMW ${currentTotalDebits.toFixed(2)}) and Credits (ZMW ${currentTotalCredits.toFixed(2)}) must balance. Difference: ZMW ${(currentTotalDebits - currentTotalCredits).toFixed(2)}.`
            );
            setLoading(false);
            return;
        }

        // Ensure total amounts are not zero if balanced (as per backend validation).
        if (currentTotalDebits === 0 && currentTotalCredits === 0) {
            toast.error("Journal entry amounts cannot be all zeros. Please enter non-zero debit/credit amounts across the entry.");
            setLoading(false);
            return;
        }

        // Prepare the payload to send to the backend.
        const payload = {
            entryDate,
            description: description.trim(),
            lines: processedLines, // Use the validated and processed lines.
            // Only include relatedDocument if both ID and Type are provided, otherwise omit.
            relatedDocument:
                relatedDocumentId && relatedDocumentType
                    ? {
                        id: relatedDocumentId,
                        type: relatedDocumentType,
                    }
                    : undefined,
        };

        console.log("Payload being sent to backend:", payload); // For debugging during development.

        try {
            let responseData;
            // Call the appropriate API function based on whether it's an edit or new creation.
            if (isEditMode) {
                responseData = await updateJournalEntry(entryId, payload);
            } else {
                responseData = await addJournalEntry(payload); // Renamed from createJournalEntry
            }

            toast.success(
                `Journal entry ${isEditMode ? "updated" : "created"} successfully!`
            );
            // Navigate to the details page of the newly created/updated journal entry.
            navigate(`/accounting/journal-entries/${responseData._id}`); // Corrected navigation path
        } catch (err) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} journal entry:`,
                err
            );
            // Display backend error message if available, otherwise a generic network error.
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
                toast.error(`Error: ${err.response.data.message}`);
            } else {
                setError(err.message || "Network error or server unavailable.");
                toast.error(`Error: ${err.message || "Something went wrong."}`);
            }
        } finally {
            setLoading(false); // Always reset loading state.
        }
    };

    // Conditional rendering for initial loading state (either accounts or existing entry).
    if (loading && (!accounts.length || isEditMode)) {
        return (
            <div className="journalEntryContainer loading">Loading form data...</div>
        );
    }

    // Conditional rendering for error state if accounts could not be loaded initially.
    if (error && !accounts.length && !isEditMode) {
        return <div className="journalEntryContainer error">Error: {error}</div>;
    }

    return (
        <div className="addJournalEntryContainer">
            <div className="addJournalFormContent">
                <header className="addJournalHeader">
                    {/* Link back to the journal entries list page. */}
                    <Link to="/accounting/journal-entries" className="addJournalEntryBackLink">
                        Back to Journal Entries List
                    </Link>
                    {/* Dynamic headline based on edit or create mode. */}
                    <h1 className="addJournalEntryHeadline">
                        {isEditMode ? "Edit Journal Entry" : "Create New Journal Entry"}
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="addJournalEntryForm">
                    {/* General Entry Details Section */}
                    <div className="formGroup">
                        <label htmlFor="entryDate">Date:</label>
                        <input
                            type="date"
                            id="entryDate"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            required
                            disabled={loading} // Disable input when loading/processing
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Recorded monthly rent payment"
                            required
                            rows="3"
                            disabled={loading}
                        />
                    </div>

                    {/* Related Document (Optional) Section */}
                    <div className="relatedDocumentSection">
                        <h3>Optional: Link to Related Document</h3>
                        <div className="formGroup">
                            <label htmlFor="relatedDocumentType">Document Type:</label>
                            <select
                                id="relatedDocumentType"
                                value={relatedDocumentType}
                                onChange={(e) => setRelatedDocumentType(e.target.value)}
                                disabled={loading}
                            >
                                <option value="">Select Type (Optional)</option>
                                {/* Add more types as needed based on your application's integrations */}
                                <option value="Loan">Loan</option>
                                <option value="Payment">Payment</option>
                                <option value="Invoice">Invoice</option>
                                <option value="Bill">Bill</option>
                                <option value="Transaction">General Transaction</option>
                            </select>
                        </div>
                        <div className="formGroup">
                            <label htmlFor="relatedDocumentId">Document ID (ObjectId):</label>
                            <input
                                type="text"
                                id="relatedDocumentId"
                                value={relatedDocumentId}
                                onChange={(e) => setRelatedDocumentId(e.target.value)}
                                placeholder="e.g., 60c72b2f9f1b2c001c8e4d6a"
                                disabled={!relatedDocumentType || loading} // Disable if no type selected or loading
                            />
                        </div>
                    </div>

                    {/* Line Items Section */}
                    <div className="lineItemsSection">
                        <h3>Journal Entry Lines</h3>
                        <div className="lineItemsHeader">
                            <span>Account</span>
                            <span>Debit (ZMW)</span>
                            <span>Credit (ZMW)</span>
                            <span>Memo</span>
                            <span></span> {/* For action button column header */}
                        </div>
                        {/* Map through line items to render input fields for each. */}
                        {lines.map((line, index) => (
                            <div key={index} className="lineItemRow">
                                <select
                                    value={line.accountId}
                                    onChange={(e) =>
                                        handleChangeLine(index, "accountId", e.target.value)
                                    }
                                    required
                                    disabled={loading}
                                >
                                    <option value="">Select Account</option>
                                    {/* Populate options from the fetched accounts list. */}
                                    {accounts.map((account) => (
                                        <option key={account._id} value={account._id}>
                                            {account.accountCode} - {account.accountName} (
                                            {account.accountType})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    step="0.01" // Allows decimal values
                                    value={line.debit}
                                    onChange={(e) =>
                                        handleChangeLine(index, "debit", e.target.value)
                                    }
                                    placeholder="0.00"
                                    min="0"
                                    // Disable debit if credit has a non-zero value
                                    disabled={parseFloat(line.credit) > 0 || loading}
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    value={line.credit}
                                    onChange={(e) =>
                                        handleChangeLine(index, "credit", e.target.value)
                                    }
                                    placeholder="0.00"
                                    min="0"
                                    // Disable credit if debit has a non-zero value
                                    disabled={parseFloat(line.debit) > 0 || loading}
                                />
                                <input
                                    type="text"
                                    value={line.lineDescription}
                                    onChange={(e) =>
                                        handleChangeLine(index, "lineDescription", e.target.value)
                                    }
                                    placeholder="Optional memo for line"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLine(index)}
                                    className="removeLineBtn"
                                    disabled={lines.length <= 2 || loading} // Keep at least 2 lines, disable when loading
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        {/* Button to add more line items. */}
                        <button
                            type="button"
                            onClick={handleAddLine}
                            className="addLineBtn"
                            disabled={loading}
                        >
                            + Add Line
                        </button>

                        {/* Balance Summary Display */}
                        <div className="balanceSummary">
                            <p
                                className={`totalDebits ${
                                    !isBalanced ? "unbalanced" : ""
                                }`}
                            >
                                Total Debits: <span>ZMW {displayTotalDebits}</span>
                            </p>
                            <p
                                className={`totalCredits ${
                                    !isBalanced ? "unbalanced" : ""
                                }`}
                            >
                                Total Credits: <span>ZMW {displayTotalCredits}</span>
                            </p>
                            <p
                                className={`balanceStatus ${
                                    isBalanced ? "balanced" : "unbalanced"
                                }`}
                            >
                                Status: {isBalanced ? "Balanced" : "Unbalanced"}
                            </p>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="submitBtn"
                        disabled={loading || !isBalanced} // Disable if loading or not balanced
                    >
                        {loading
                            ? "Processing..."
                            : isEditMode
                            ? "Update Journal Entry"
                            : "Create Journal Entry"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddJournalEntryPage;
