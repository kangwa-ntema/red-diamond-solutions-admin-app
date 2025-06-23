// src/Pages/MainDashboardPage/AccountingManagementDashboard/JournalEntriesListPage/EditJournalEntryPage/EditJournalEntryPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import the centralized API functions from accountingApi
import {
    getJournalEntryById,
    getAllAccounts,
} from '../../../../../services/api/';
import { handleApiError } from '../../../../../services/axiosInstance'; // For consistent error handling

import './EditJournalEntryPage.css'; // Existing CSS for the page

/**
 * @component EditJournalEntryPage
 * @description Component for editing an existing journal entry.
 * It fetches the existing entry data and all accounts, allows modifications,
 * validates the form, and sends updates to the backend.
 */
const EditJournalEntryPage = () => {
    const { id: entryId } = useParams(); // Get the journal entry ID from URL parameters
    const navigate = useNavigate(); // Hook for programmatic navigation

    // State for general journal entry details
    const [entryDate, setEntryDate] = useState("");
    const [description, setDescription] = useState("");
    // State for journal entry line items.
    const [lines, setLines] = useState([]); // Initialize as empty, will be populated on fetch.
    // State for optional related document linking
    const [relatedDocumentId, setRelatedDocumentId] = useState("");
    const [relatedDocumentType, setRelatedDocumentType] = useState("");

    // State for fetching data (accounts, existing entry for edit)
    const [accounts, setAccounts] = useState([]); // Stores the list of all accounts for the dropdowns
    const [loading, setLoading] = useState(true); // Indicates if initial data is being loaded
    const [submitting, setSubmitting] = useState(false); // Indicates if form is being submitted
    const [error, setError] = useState(null); // Stores any error messages

    // Calculate total debits and credits from the current line items.
    // parseFloat is used to convert string inputs from form fields to numbers for calculation.
    const rawTotalDebits = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const rawTotalCredits = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    // Determine if the journal entry is balanced.
    // Using a small epsilon (0.01) for floating-point comparison to account for precision issues.
    // Also, ensures that total amounts are greater than zero to prevent "balanced but empty" entries,
    // though this check is primarily done during handleSubmit.
    const isBalanced = Math.abs(rawTotalDebits - rawTotalCredits) < 0.01;

    // For display purposes, format totals to two decimal places.
    const displayTotalDebits = rawTotalDebits.toFixed(2);
    const displayTotalCredits = rawTotalCredits.toFixed(2);

    /**
     * @function fetchInitialData
     * @description Fetches the existing journal entry data and all accounting accounts.
     * This function runs on component mount to pre-populate the form for editing.
     */
    const fetchInitialData = useCallback(async () => {
        setLoading(true); // Start loading for initial data fetch
        setError(null);    // Clear any previous errors

        try {
            // Fetch the specific journal entry data using its ID
            const entryData = await getJournalEntryById(entryId);
            // Format entryDate for input type="date"
            const formattedDate = entryData.entryDate ? new Date(entryData.entryDate).toISOString().split('T')[0] : '';

            setEntryDate(formattedDate);
            setDescription(entryData.description || '');
            // Map line items to include debit/credit explicitly and accountId (assuming accountId is populated)
            const mappedLines = entryData.lines.map(line => ({
                // _id: line._id, // Not strictly needed for update payload, but good for react key if unique
                accountId: line.accountId?._id, // Use the actual ID from the populated account object
                debit: line.debit !== undefined ? String(line.debit) : '', // Ensure string for input value
                credit: line.credit !== undefined ? String(line.credit) : '', // Ensure string for input value
                lineDescription: line.lineDescription || ''
            }));
            setLines(mappedLines);

            // Set related document fields if they exist
            if (entryData.relatedDocument) {
                setRelatedDocumentId(entryData.relatedDocument.id || "");
                setRelatedDocumentType(entryData.relatedDocument.type || "");
            } else {
                setRelatedDocumentId("");
                setRelatedDocumentType("");
            }

            // Fetch all accounts for dropdowns
            const accountsData = await getAllAccounts();
            setAccounts(accountsData.sort((a, b) => a.accountCode.localeCompare(b.accountCode))); // Sort accounts by code

        } catch (err) {
            console.error("EditJournalEntryPage: Error fetching data for edit:", err);
            handleApiError(err, "Failed to load journal entry for editing."); // Use centralized error handler
            // If the entry is not found or an unrecoverable error, redirect to the list page
            navigate('/accounting/journal-entries', { replace: true });
        } finally {
            setLoading(false); // End loading after data fetch attempt
        }
    }, [entryId, navigate]); // Dependencies for useCallback

    // useEffect hook to call fetchInitialData on component mount or when entryId changes
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    /**
     * @function handleLineChange
     * @description Handles changes to individual fields within a line item.
     * Automatically clears the opposing debit/credit field when one is entered.
     * @param {number} index - The index of the line item being changed.
     * @param {Object} e - The event object from the input change.
     */
    const handleLineChange = (index, e) => {
        const { name, value } = e.target;
        const newLines = [...lines];

        if (name === 'debit' || name === 'credit') {
            const parsedValue = value === '' ? '' : parseFloat(value);
            if (isNaN(parsedValue) && value !== '') return; // Prevent non-numeric input unless empty string

            if (name === 'debit') {
                newLines[index] = { ...newLines[index], debit: value, credit: '' }; // Keep as string for input
            } else {
                newLines[index] = { ...newLines[index], credit: value, debit: '' }; // Keep as string for input
            }
        } else {
            newLines[index] = { ...newLines[index], [name]: value };
        }
        setLines(newLines);
    };

    /**
     * @function addLine
     * @description Adds a new empty line item to the journal entry form.
     */
    const addLine = () => {
        setLines(prevLines => ([
            ...prevLines,
            { accountId: '', debit: '', credit: '', lineDescription: '' }
        ]));
    };

    /**
     * @function removeLine
     * @description Removes a line item from the journal entry form at a given index.
     * Prevents removing lines if it would leave fewer than two line items.
     * @param {number} index - The index of the line item to remove.
     */
    const removeLine = (index) => {
        if (lines.length > 2) {
            setLines(prevLines => prevLines.filter((_, i) => i !== index));
        } else {
            toast.warn("A journal entry must have at least two line items.");
        }
    };

    /**
     * @function handleSubmit
     * @description Handles the submission of the edit journal entry form.
     * Performs client-side validation and sends the update request to the backend.
     * @param {Object} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Client-side validation for overall entry details
        if (!entryDate) {
            toast.error("Entry date is required.");
            setSubmitting(false);
            return;
        }
        if (!description.trim()) {
            toast.error("Description is required.");
            setSubmitting(false);
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
                setSubmitting(false);
                return;
            }

            // Validate that each line has either a debit OR a credit (but not both, and not zero for both).
            if (debitValue > 0 && creditValue > 0) {
                toast.error("A line item cannot have both a debit and a credit amount. Please clear one.");
                setSubmitting(false);
                return;
            }
            if (debitValue === 0 && creditValue === 0) {
                toast.error("A line item cannot have both debit and credit as zero. Please enter an amount.");
                setSubmitting(false);
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
            setSubmitting(false);
            return;
        }

        // Validate overall balance using a small epsilon for floating point comparison.
        if (Math.abs(currentTotalDebits - currentTotalCredits) > 0.01) {
            toast.error(
                `Debits (ZMW ${currentTotalDebits.toFixed(2)}) and Credits (ZMW ${currentTotalCredits.toFixed(2)}) must balance. Difference: ZMW ${(currentTotalDebits - currentTotalCredits).toFixed(2)}.`
            );
            setSubmitting(false);
            return;
        }

        // Ensure total amounts are not zero if balanced (as per backend validation).
        if (currentTotalDebits === 0 && currentTotalCredits === 0) {
            toast.error("Journal entry amounts cannot be all zeros. Please enter non-zero debit/credit amounts across the entry.");
            setSubmitting(false);
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
                        id: relatedDocumentId.trim(), // Trim ID as well
                        type: relatedDocumentType,
                    }
                    : undefined,
        };

        console.log("Payload being sent to backend for update:", payload); // For debugging

        try {
            const responseData = await updateJournalEntry(entryId, payload); // Call update API
            toast.success(`Journal entry updated successfully!`);
            navigate(`/accounting/journal-entries/${responseData._id}`); // Navigate to details page
        } catch (err) {
            console.error("EditJournalEntryPage: Error updating journal entry:", err);
            handleApiError(err, "Failed to update journal entry. Please try again."); // Use centralized error handler
        } finally {
            setSubmitting(false); // Always reset submitting state
        }
    };

    // Conditional rendering for initial loading state
    if (loading) {
        return <div className="edit-journal-entry-container loading">Loading journal entry for editing...</div>;
    }

    // Conditional rendering for error state if initial data fetch failed
    if (error) { // No need for !journalEntry check as navigate redirects if not found
        return <div className="edit-journal-entry-container error">{error}</div>;
    }

    return (
        <div className="edit-journal-entry-container">
            <h1 className="edit-journal-entry-header">Edit Journal Entry</h1>
            <form onSubmit={handleSubmit} className="journal-entry-form">
                {/* General Entry Details */}
                <div className="form-group">
                    <label htmlFor="entryDate">Date:</label>
                    <input
                        type="date"
                        id="entryDate"
                        name="entryDate"
                        value={entryDate} // Bind to individual state
                        onChange={(e) => setEntryDate(e.target.value)} // Use individual setter
                        required
                        disabled={submitting} // Disable when submitting
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={description} // Bind to individual state
                        onChange={(e) => setDescription(e.target.value)} // Use individual setter
                        rows="3"
                        placeholder="e.g., Recorded monthly rent payment"
                        required
                        disabled={submitting}
                    ></textarea>
                </div>

                {/* Related Document (Optional) Section - Re-added */}
                <div className="relatedDocumentSection">
                    <h3>Optional: Link to Related Document</h3>
                    <div className="form-group">
                        <label htmlFor="relatedDocumentType">Document Type:</label>
                        <select
                            id="relatedDocumentType"
                            value={relatedDocumentType}
                            onChange={(e) => setRelatedDocumentType(e.target.value)}
                            disabled={submitting}
                        >
                            <option value="">Select Type (Optional)</option>
                            <option value="Loan">Loan</option>
                            <option value="Payment">Payment</option>
                            <option value="Invoice">Invoice</option>
                            <option value="Bill">Bill</option>
                            <option value="Transaction">General Transaction</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="relatedDocumentId">Document ID (ObjectId):</label>
                        <input
                            type="text"
                            id="relatedDocumentId"
                            value={relatedDocumentId}
                            onChange={(e) => setRelatedDocumentId(e.target.value)}
                            placeholder="e.g., 60c72b2f9f1b2c001c8e4d6a"
                            disabled={!relatedDocumentType || submitting} // Disable if no type selected or submitting
                        />
                    </div>
                </div>

                <h2>Line Items</h2>
                {lines.length === 0 && (
                    <p className="no-lines-message">Add at least two line items.</p>
                )}
                {lines.map((line, index) => (
                    <div key={index} className="line-item-group">
                        <div className="line-item-inputs">
                            <div className="form-group">
                                <label>Account:</label>
                                <select
                                    name="accountId"
                                    value={line.accountId}
                                    onChange={(e) => handleLineChange(index, e)}
                                    required
                                    disabled={submitting}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(account => (
                                        <option key={account._id} value={account._id}>
                                            {account.accountName} ({account.accountCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group amount-group">
                                <label htmlFor={`debit-${index}`}>Debit (ZMW):</label>
                                <input
                                    type="number"
                                    id={`debit-${index}`}
                                    name="debit"
                                    value={line.debit}
                                    onChange={(e) => handleLineChange(index, e)}
                                    min="0"
                                    step="0.01"
                                    className="amount-input"
                                    disabled={parseFloat(line.credit) > 0 || submitting} // Disable debit if credit has value or submitting
                                />
                            </div>
                            <div className="form-group amount-group">
                                <label htmlFor={`credit-${index}`}>Credit (ZMW):</label>
                                <input
                                    type="number"
                                    id={`credit-${index}`}
                                    name="credit"
                                    value={line.credit}
                                    onChange={(e) => handleLineChange(index, e)}
                                    min="0"
                                    step="0.01"
                                    className="amount-input"
                                    disabled={parseFloat(line.debit) > 0 || submitting} // Disable credit if debit has value or submitting
                                />
                            </div>
                        </div>
                        <div className="form-group line-description-group">
                            <label htmlFor={`lineDescription-${index}`}>Line Description (Optional):</label>
                            <input
                                type="text"
                                id={`lineDescription-${index}`}
                                name="lineDescription"
                                value={line.lineDescription}
                                onChange={(e) => handleLineChange(index, e)}
                                className="line-desc-input"
                                disabled={submitting}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="btn btn-danger remove-line-btn"
                            disabled={lines.length <= 2 || submitting} // Keep at least 2 lines, disable when submitting
                        >
                            Remove
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addLine}
                    className="btn btn-secondary add-line-btn"
                    disabled={submitting}
                >
                    Add Line Item
                </button>

                {/* Totals and Balance Summary */}
                <div className="totals-section">
                    <p><strong>Total Debits:</strong> ZMW {displayTotalDebits}</p>
                    <p><strong>Total Credits:</strong> ZMW {displayTotalCredits}</p>
                    {!isBalanced && (
                        <p className="balance-warning">Debits and Credits must balance!</p>
                    )}
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submitting || !isBalanced || lines.length < 2 || (rawTotalDebits === 0 && rawTotalCredits === 0)}
                    >
                        {submitting ? 'Updating...' : 'Update Journal Entry'}
                    </button>
                    <Link to="/accounting/journal-entries" className="btn btn-secondary">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default EditJournalEntryPage;
