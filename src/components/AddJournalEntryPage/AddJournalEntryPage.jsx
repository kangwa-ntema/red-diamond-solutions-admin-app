import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../../utils/authUtils'; // Adjust path as needed
import { toast } from 'react-toastify'; // For notifications
import './AddJournalEntryPage.css'; // Common CSS for journal entry pages

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
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // State for form fields
    const [entryDate, setEntryDate] = useState('');
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState([
        { accountId: '', debit: '', credit: '', lineDescription: '' },
        { accountId: '', debit: '', credit: '', lineDescription: '' }
    ]);
    const [relatedDocumentId, setRelatedDocumentId] = useState('');
    const [relatedDocumentType, setRelatedDocumentType] = useState('');

    // State for fetching data (accounts, existing entry for edit)
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Calculate total debits and credits
    const totalDebits = lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0).toFixed(2);
    const totalCredits = lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0).toFixed(2);
    const isBalanced = totalDebits === totalCredits && parseFloat(totalDebits) > 0; // Must be balanced and not all zero

    // --- Fetch Accounts for Dropdowns ---
    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/login');
            toast.error('Authentication required to fetch accounts.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/accounts`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/login');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch accounts.');
            }

            const data = await response.json();
            setAccounts(data.sort((a, b) => a.accountCode.localeCompare(b.accountCode))); // Sort by code
        } catch (err) {
            console.error("AddJournalEntryPage: Error fetching accounts:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching accounts: ${err.message || "Network error"}`);
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, navigate]);

    // --- Fetch Journal Entry for Edit Mode ---
    const fetchJournalEntry = useCallback(async () => {
        if (!entryId) return; // Only fetch if entryId exists (edit mode)

        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/login');
            toast.error('Authentication required to fetch journal entry.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/journal-entries/${entryId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/login');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch journal entry details.');
            }

            const data = await response.json();
            setEntryDate(data.entryDate); // Backend should return YYYY-MM-DD or convertible format
            setDescription(data.description);
            // Map backend lines to frontend state format
            setLines(data.lines.map(line => ({
                accountId: line.accountId._id, // Assuming accountId is populated
                debit: line.debit || '',
                credit: line.credit || '',
                lineDescription: line.lineDescription || ''
            })));
            if (data.relatedDocument) {
                setRelatedDocumentId(data.relatedDocument.id || '');
                setRelatedDocumentType(data.relatedDocument.type || '');
            }
            setIsEditMode(true);
        } catch (err) {
            console.error("AddJournalEntryPage: Error fetching journal entry for edit:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error fetching journal entry: ${err.message || "Network error"}`);
            // Redirect if not found or unauthorized
            if (err.message.includes('not found') || err.message.includes('unauthorized')) {
                navigate('/journal-entries');
            }
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, navigate, entryId]);

    useEffect(() => {
        fetchAccounts();
        if (entryId) {
            fetchJournalEntry();
        } else {
            setLoading(false); // No fetching needed if not in edit mode
        }
    }, [fetchAccounts, fetchJournalEntry, entryId]);


    // --- Line Item Handlers ---
    const handleAddLine = () => {
        setLines([...lines, { accountId: '', debit: '', credit: '', lineDescription: '' }]);
    };

    const handleRemoveLine = (index) => {
        if (lines.length > 2) { // Ensure at least two lines remain
            const newLines = lines.filter((_, i) => i !== index);
            setLines(newLines);
        } else {
            toast.warn('A journal entry must have at least two line items.');
        }
    };

    const handleChangeLine = (index, field, value) => {
        const newLines = [...lines];
        if (field === 'debit') {
            newLines[index] = { ...newLines[index], debit: value, credit: '' }; // Clear credit if debit is set
        } else if (field === 'credit') {
            newLines[index] = { ...newLines[index], credit: value, debit: '' }; // Clear debit if credit is set
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
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/login');
            toast.error('Authentication required.');
            return;
        }

        if (!isBalanced) {
            toast.error('Journal entry must be balanced (total debits equal total credits) and amounts cannot be zero.');
            setLoading(false);
            return;
        }
        if (!description.trim()) {
            toast.error('Description is required.');
            setLoading(false);
            return;
        }
        if (!entryDate) {
            toast.error('Entry date is required.');
            setLoading(false);
            return;
        }

        const payloadLines = lines.map(line => ({
            accountId: line.accountId,
            debit: parseFloat(line.debit || 0),
            credit: parseFloat(line.credit || 0),
            lineDescription: line.lineDescription.trim()
        }));

        // Final check for empty accounts or debit/credit
        if (payloadLines.some(line => !line.accountId || (line.debit === 0 && line.credit === 0))) {
            toast.error('All line items must have an account selected and a non-zero debit or credit amount.');
            setLoading(false);
            return;
        }

        const payload = {
            entryDate,
            description: description.trim(),
            lines: payloadLines,
            relatedDocument: relatedDocumentId && relatedDocumentType ? {
                id: relatedDocumentId,
                type: relatedDocumentType
            } : undefined // Only include if both are provided
        };

        try {
            const url = isEditMode ? `${BACKEND_URL}/api/journal-entries/${entryId}` : `${BACKEND_URL}/api/journal-entries`;
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                clearAuthData();
                navigate('/login');
                toast.error('Authentication expired or unauthorized. Please log in again.');
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} journal entry.`);
            }

            toast.success(`Journal entry ${isEditMode ? 'updated' : 'created'} successfully!`);
            navigate(`/journal-entries/${data._id}`); // Navigate to details page or list page
        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} journal entry:`, err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error: ${err.message || "Something went wrong."}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && (!accounts.length || isEditMode)) {
        return <div className="journalEntryContainer loading">Loading form data...</div>;
    }

    if (error && !accounts.length && !isEditMode) { // Only show global error if no accounts could be loaded initially
        return <div className="journalEntryContainer error">Error: {error}</div>;
    }

    return (
        <div className="journalEntryContainer">
            <Link to="/journal-entries" className="journalEntryBackLink">
                {"<"} Back to Journal Entries List
            </Link>
            <h1 className="journalEntryHeadline">{isEditMode ? 'Edit Journal Entry' : 'Create New Journal Entry'}</h1>

            <form onSubmit={handleSubmit} className="journalEntryForm">
                {/* General Entry Details */}
                <div className="formGroup">
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
                                onChange={(e) => handleChangeLine(index, 'accountId', e.target.value)}
                                required
                            >
                                <option value="">Select Account</option>
                                {accounts.map(account => (
                                    <option key={account._id} value={account._id}>
                                        {account.accountCode} - {account.accountName} ({account.accountType})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                value={line.debit}
                                onChange={(e) => handleChangeLine(index, 'debit', e.target.value)}
                                placeholder="0.00"
                                min="0"
                                disabled={line.credit > 0} // Disable debit if credit has a value
                            />
                            <input
                                type="number"
                                step="0.01"
                                value={line.credit}
                                onChange={(e) => handleChangeLine(index, 'credit', e.target.value)}
                                placeholder="0.00"
                                min="0"
                                disabled={line.debit > 0} // Disable credit if debit has a value
                            />
                            <input
                                type="text"
                                value={line.lineDescription}
                                onChange={(e) => handleChangeLine(index, 'lineDescription', e.target.value)}
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
                    <button type="button" onClick={handleAddLine} className="addLineBtn">
                        + Add Line
                    </button>

                    {/* Balance Summary */}
                    <div className="balanceSummary">
                        <p className={`totalDebits ${totalDebits !== totalCredits ? 'unbalanced' : ''}`}>
                            Total Debits: <span>ZMW {totalDebits}</span>
                        </p>
                        <p className={`totalCredits ${totalDebits !== totalCredits ? 'unbalanced' : ''}`}>
                            Total Credits: <span>ZMW {totalCredits}</span>
                        </p>
                        <p className={`balanceStatus ${isBalanced ? 'balanced' : 'unbalanced'}`}>
                            Status: {isBalanced ? 'Balanced' : 'Unbalanced'}
                        </p>
                    </div>
                </div>

                <button type="submit" className="submitBtn" disabled={loading || !isBalanced}>
                    {loading ? 'Processing...' : (isEditMode ? 'Update Journal Entry' : 'Create Journal Entry')}
                </button>
            </form>
        </div>
    );
};

export default AddJournalEntryPage;
