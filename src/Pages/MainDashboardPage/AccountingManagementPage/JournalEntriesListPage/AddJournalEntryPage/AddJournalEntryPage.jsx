import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify"; // For notifications
import "./AddJournalEntryPage.css"; // Common CSS for journal entry pages

// Import the centralized API functions
import { getAccounts } from "../../../../../services/api/accountApi"; // For fetching accounts for line items
import {
    getJournalEntryById,
    createJournalEntry,
    updateJournalEntry,
} from "../../../../../services/api/journalEntryApi"; // For fetching/creating/updating journal entries

/**
 * @component AddJournalEntryPage
 * @description Component for adding or editing a journal entry.
 * It fetches accounts for line items, validates debits/credits balance,
 * and interacts with the backend API for creation and updates.
 */
const AddJournalEntryPage = () => {
    // useParams to check if we are in edit mode
    const { id: entryId } = useParams();
    const navigate = useNavigate();

    // State for form fields
    const [entryDate, setEntryDate] = useState("");
    const [description, setDescription] = useState("");
    const [lines, setLines] = useState([
        { accountId: "", debit: "", credit: "", lineDescription: "" },
        { accountId: "", debit: "", credit: "", lineDescription: "" },
    ]);
    const [relatedDocumentId, setRelatedDocumentId] = useState("");
    const [relatedDocumentType, setRelatedDocumentType] = useState("");

    // State for fetching data (accounts, existing entry for edit)
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Calculate total debits and credits as numbers (not strings from toFixed)
    const rawTotalDebits = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const rawTotalCredits = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);

    // Use a small epsilon for floating-point comparison, and ensure totals are greater than zero
    // Math.abs(difference) < 0.01 is a common way to compare floating point numbers
    const isBalanced = Math.abs(rawTotalDebits - rawTotalCredits) < 0.01 && rawTotalDebits > 0;

    // For display purposes, use toFixed(2)
    const displayTotalDebits = rawTotalDebits.toFixed(2);
    const displayTotalCredits = rawTotalCredits.toFixed(2);

    // --- Fetch Accounts for Dropdowns ---
    const fetchAccountsData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getAccounts(); // Use the centralized API function
            setAccounts(
                data.sort((a, b) => a.accountCode.localeCompare(b.accountCode))
            ); // Sort by code
        } catch (err) {
            console.error("AddJournalEntryPage: Error fetching accounts:", err);
            setError(err.message || "Failed to fetch accounts. Please try again.");
            // Axios interceptor handles 401/403 and shows toast
        } finally {
            setLoading(false);
        }
    }, []); // No external dependencies anymore

    // --- Fetch Journal Entry for Edit Mode ---
    const fetchJournalEntryData = useCallback(async () => {
        if (!entryId) return; // Only fetch if entryId exists (edit mode)

        setLoading(true);
        setError(null);

        try {
            const data = await getJournalEntryById(entryId); // Use the centralized API function
            // Format date for input field
            const formattedDate = data.entryDate ? new Date(data.entryDate).toISOString().split('T')[0] : '';
            setEntryDate(formattedDate);
            setDescription(data.description);
            // Map backend lines to frontend state format
            setLines(
                data.lines.map((line) => ({
                    accountId: line.accountId._id, // Assuming accountId is populated
                    debit: line.debit !== undefined ? String(line.debit) : "", // Ensure it's a string for input value
                    credit: line.credit !== undefined ? String(line.credit) : "", // Ensure it's a string for input value
                    lineDescription: line.lineDescription || "",
                }))
            );
            if (data.relatedDocument) {
                setRelatedDocumentId(data.relatedDocument.id || "");
                setRelatedDocumentType(data.relatedDocument.type || "");
            }
            setIsEditMode(true);
        } catch (err) {
            console.error(
                "AddJournalEntryPage: Error fetching journal entry for edit:",
                err
            );
            setError(err.message || "Failed to fetch journal entry details. Please try again.");
            toast.error(
                `Error fetching journal entry: ${err.message || "Network error"}`
            );
            // Redirect if not found (e.g., 404) or specific unauthorized error if interceptor doesn't cover
            if (err.message.includes("not found")) {
                navigate("/journal-entries");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, entryId]);

    useEffect(() => {
        fetchAccountsData();
        if (entryId) {
            fetchJournalEntryData();
        } else {
            setLoading(false); // No fetching needed if not in edit mode
        }
    }, [fetchAccountsData, fetchJournalEntryData, entryId]);

    // --- Line Item Handlers ---
    const handleAddLine = () => {
        setLines([
            ...lines,
            { accountId: "", debit: "", credit: "", lineDescription: "" },
        ]);
    };

    const handleRemoveLine = (index) => {
        if (lines.length > 2) {
            // Ensure at least two lines remain
            const newLines = lines.filter((_, i) => i !== index);
            setLines(newLines);
        } else {
            toast.warn("A journal entry must have at least two line items.");
        }
    };

    const handleChangeLine = (index, field, value) => {
        const newLines = [...lines];
        if (field === "debit") {
            // Store value as string for input. Validate if it's a valid number or empty.
            if (value !== "" && isNaN(parseFloat(value))) return;
            newLines[index] = { ...newLines[index], debit: value, credit: "" }; // Clear credit if debit is set
        } else if (field === "credit") {
            // Store value as string for input. Validate if it's a valid number or empty.
            if (value !== "" && isNaN(parseFloat(value))) return;
            newLines[index] = { ...newLines[index], credit: value, debit: "" }; // Clear debit if credit is set
        } else {
            newLines[index] = { ...newLines[index], [field]: value };
        }
        setLines(newLines);
    };

    // --- Form Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Client-side validation for basic form fields
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

        // Process and validate line items
        let currentTotalDebits = 0;
        let currentTotalCredits = 0;
        const processedLines = [];

        // Loop through the lines state to build the payload and perform validation
        for (const line of lines) {
            const debitValue = parseFloat(line.debit) || 0;
            const creditValue = parseFloat(line.credit) || 0;

            // Validate that each line has an accountId
            if (!line.accountId) {
                toast.error("All line items must have an account selected.");
                setLoading(false);
                return;
            }

            // Validate that each line has either a debit OR a credit (but not both, and not zero for both)
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

        // Now, validate the processedLines array
        if (processedLines.length < 2) {
            toast.error("A journal entry must have at least two valid line items.");
            setLoading(false);
            return;
        }

        // Validate overall balance
        // Using a small epsilon for floating point comparison to check balance
        if (Math.abs(currentTotalDebits - currentTotalCredits) > 0.01) {
            toast.error(
                `Debits (ZMW ${currentTotalDebits.toFixed(2)}) and Credits (ZMW ${currentTotalCredits.toFixed(2)}) must balance. Difference: ZMW ${(currentTotalDebits - currentTotalCredits).toFixed(2)}.`
            );
            setLoading(false);
            return;
        }

        // Ensure total amounts are not zero if balanced (as per your backend error)
        if (currentTotalDebits === 0 && currentTotalCredits === 0) {
            toast.error("Journal entry amounts cannot be all zeros. Please enter non-zero debit/credit amounts across the entry.");
            setLoading(false);
            return;
        }

        const payload = {
            entryDate,
            description: description.trim(),
            // Ensure the lines sent are the processed ones, which are guaranteed to be valid
            lines: processedLines,
            relatedDocument:
                relatedDocumentId && relatedDocumentType
                    ? {
                        id: relatedDocumentId,
                        type: relatedDocumentType,
                    }
                    : undefined, // Only include if both are provided, otherwise omit
        };

        console.log("Payload being sent to backend:", payload); // Keep this for debugging

        try {
            let responseData;
            if (isEditMode) {
                responseData = await updateJournalEntry(entryId, payload);
            } else {
                responseData = await createJournalEntry(payload);
            }

            toast.success(
                `Journal entry ${isEditMode ? "updated" : "created"} successfully!`
            );
            navigate(`/journal-entries/${responseData._id}`); // Navigate to details page or list page
        } catch (err) {
            console.error(
                `Error ${isEditMode ? "updating" : "creating"} journal entry:`,
                err
            );
            // Check if the error is specifically a validation error from the backend
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
                toast.error(`Error: ${err.response.data.message}`);
            } else {
                setError(err.message || "Network error or server unavailable.");
                toast.error(`Error: ${err.message || "Something went wrong."}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && (!accounts.length || isEditMode)) {
        return (
            <div className="journalEntryContainer loading">Loading form data...</div>
        );
    }

    if (error && !accounts.length && !isEditMode) {
        // Only show global error if no accounts could be loaded initially
        return <div className="journalEntryContainer error">Error: {error}</div>;
    }

    return (
        <div className="addJournalEntryContainer">
            <div className="addJournalFormContent">
                <header className="addJournalHeader">
                    <Link to="/journal-entries" className="addJournalEntryBackLink">
                        Back to Journal Entries List
                    </Link>
                    <h1 className="addJournalEntryHeadline">
                        {isEditMode ? "Edit Journal Entry" : "Create New Journal Entry"}
                    </h1>
                </header>

                <form onSubmit={handleSubmit} className="addJournalEntryForm">
                    {/* General Entry Details */}
                    <div className="">
                        <label htmlFor="entryDate">Date:</label>
                        <input
                            type="date"
                            id="entryDate"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            required
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
                        />
                    </div>

                    {/* Related Document (Optional) */}
                    <div className="relatedDocumentSection">
                        <h3>Optional: Link to Related Document</h3>
                        <div className="formGroup">
                            <label htmlFor="relatedDocumentType">Document Type:</label>
                            <select
                                id="relatedDocumentType"
                                value={relatedDocumentType}
                                onChange={(e) => setRelatedDocumentType(e.target.value)}
                            >
                                <option value="">Select Type (Optional)</option>
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
                                disabled={!relatedDocumentType} // Disable if no type selected
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
                            <span></span> {/* For action button */}
                        </div>
                        {lines.map((line, index) => (
                            <div key={index} className="lineItemRow">
                                <select
                                    value={line.accountId}
                                    onChange={(e) =>
                                        handleChangeLine(index, "accountId", e.target.value)
                                    }
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((account) => (
                                        <option key={account._id} value={account._id}>
                                            {account.accountCode} - {account.accountName} (
                                            {account.accountType})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={line.debit}
                                    onChange={(e) =>
                                        handleChangeLine(index, "debit", e.target.value)
                                    }
                                    placeholder="0.00"
                                    min="0"
                                    // Disable debit if credit has a non-zero value
                                    disabled={parseFloat(line.credit) > 0}
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
                                    disabled={parseFloat(line.debit) > 0}
                                />
                                <input
                                    type="text"
                                    value={line.lineDescription}
                                    onChange={(e) =>
                                        handleChangeLine(index, "lineDescription", e.target.value)
                                    }
                                    placeholder="Optional memo for line"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLine(index)}
                                    className="removeLineBtn"
                                    disabled={lines.length <= 2} // Keep at least 2 lines
                                >
                                    -
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddLine}
                            className="addLineBtn"
                        >
                            + Add Line
                        </button>

                        {/* Balance Summary */}
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

                    <button
                        type="submit"
                        className="submitBtn"
                        disabled={loading || !isBalanced} // Keep disabled logic for visual feedback
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