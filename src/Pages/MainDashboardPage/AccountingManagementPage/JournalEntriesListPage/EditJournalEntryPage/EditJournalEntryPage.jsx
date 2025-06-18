// src/pages/EditJournalEntryPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getJournalEntryById, updateJournalEntry } from '../../../../../services/api/accountingApi';
import { getAccounts } from '../../../../../services/api/accountApi'; // For account dropdowns

import './EditJournalEntryPage.css'; // Create this CSS file for styling

const EditJournalEntryPage = () => {
    const { id: entryId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        entryDate: '',
        description: '',
        lines: [], // Array of { accountId, debit, credit, lineDescription }
        relatedDocument: '', // If you use this field
    });
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Fetch initial journal entry data and accounts
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch journal entry
                const entryData = await getJournalEntryById(entryId);
                // Backend sends entryDate as a full ISO string, format for input type="date"
                const formattedDate = entryData.entryDate ? new Date(entryData.entryDate).toISOString().split('T')[0] : '';

                // Map line items to include debit/credit explicitly and accountId
                const mappedLines = entryData.lines.map(line => ({
                    _id: line._id, // Keep the _id for potential future use (though not strictly needed for update)
                    accountId: line.account._id, // Use the ID from the populated account object
                    debit: line.debit || '',
                    credit: line.credit || '',
                    lineDescription: line.lineDescription || ''
                }));

                setFormData({
                    entryDate: formattedDate,
                    description: entryData.description || '',
                    lines: mappedLines,
                    relatedDocument: entryData.relatedDocument || ''
                });

                // Fetch all accounts for dropdowns
                const accountsData = await getAccounts();
                setAccounts(accountsData);

            } catch (err) {
                console.error("Error fetching data for edit:", err);
                setError("Failed to load journal entry for editing.");
                toast.error("Failed to load journal entry for editing.");
                navigate('/journal-entries'); // Redirect if data cannot be fetched
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [entryId, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLineChange = (index, e) => {
        const { name, value } = e.target;
        const newLines = [...formData.lines];

        if (name === 'debit' || name === 'credit') {
            const parsedValue = value === '' ? '' : parseFloat(value);
            // Ensure only one of debit or credit has a value
            if (name === 'debit') {
                newLines[index] = { ...newLines[index], debit: parsedValue, credit: '' };
            } else {
                newLines[index] = { ...newLines[index], credit: parsedValue, debit: '' };
            }
        } else {
            newLines[index] = { ...newLines[index], [name]: value };
        }
        setFormData(prev => ({ ...prev, lines: newLines }));
    };

    const addLine = () => {
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { accountId: '', debit: '', credit: '', lineDescription: '' }]
        }));
    };

    const removeLine = (index) => {
        setFormData(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index)
        }));
    };

    const calculateTotals = useCallback(() => {
        let totalDebits = 0;
        let totalCredits = 0;

        formData.lines.forEach(line => {
            totalDebits += parseFloat(line.debit || 0);
            totalCredits += parseFloat(line.credit || 0);
        });
        return { totalDebits, totalCredits };
    }, [formData.lines]);

    const { totalDebits, totalCredits } = calculateTotals();
    const isBalanced = totalDebits.toFixed(2) === totalCredits.toFixed(2);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Client-side validation
        if (!formData.description || formData.lines.length < 2) {
            toast.error("Please provide a description and at least two line items.");
            setSubmitting(false);
            return;
        }

        if (!isBalanced) {
            toast.error("Debits and credits must balance.");
            setSubmitting(false);
            return;
        }

        for (const line of formData.lines) {
            if (!line.accountId || (line.debit === '' && line.credit === '')) {
                toast.error("Each line item must have an account and an amount (debit or credit).");
                setSubmitting(false);
                return;
            }
            if ((parseFloat(line.debit || 0) < 0) || (parseFloat(line.credit || 0) < 0)) {
                toast.error("Amounts cannot be negative.");
                setSubmitting(false);
                return;
            }
        }

        try {
            // Prepare data for submission (ensure debit/credit are numbers)
            const dataToSubmit = {
                ...formData,
                lines: formData.lines.map(line => ({
                    accountId: line.accountId,
                    debit: parseFloat(line.debit || 0),
                    credit: parseFloat(line.credit || 0),
                    lineDescription: line.lineDescription
                }))
            };

            await updateJournalEntry(entryId, dataToSubmit);
            toast.success("Journal Entry updated successfully!");
            navigate('/journal-entries'); // Navigate back to the list or to the view page
        } catch (err) {
            console.error("Error updating journal entry:", err);
            setError("Failed to update journal entry. Please try again.");
            toast.error("Failed to update journal entry.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="edit-journal-entry-container loading">Loading journal entry for editing...</div>;
    }

    if (error) {
        return <div className="edit-journal-entry-container error">{error}</div>;
    }

    return (
        <div className="edit-journal-entry-container">
            <h1 className="edit-journal-entry-header">Edit Journal Entry</h1>
            <form onSubmit={handleSubmit} className="journal-entry-form">
                <div className="form-group">
                    <label htmlFor="entryDate">Date:</label>
                    <input
                        type="date"
                        id="entryDate"
                        name="entryDate"
                        value={formData.entryDate}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        required
                    ></textarea>
                </div>
                {/* Related Document field, if applicable */}
                {/* <div className="form-group">
                    <label htmlFor="relatedDocument">Related Document:</label>
                    <input
                        type="text"
                        id="relatedDocument"
                        name="relatedDocument"
                        value={formData.relatedDocument}
                        onChange={handleInputChange}
                    />
                </div> */}

                <h2>Line Items</h2>
                {formData.lines.length === 0 && (
                    <p className="no-lines-message">Add at least two line items.</p>
                )}
                {formData.lines.map((line, index) => (
                    <div key={index} className="line-item-group">
                        <div className="line-item-inputs">
                            <div className="form-group">
                                <label>Account:</label>
                                <select
                                    name="accountId"
                                    value={line.accountId}
                                    onChange={(e) => handleLineChange(index, e)}
                                    required
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
                                <label htmlFor={`debit-${index}`}>Debit:</label>
                                <input
                                    type="number"
                                    id={`debit-${index}`}
                                    name="debit"
                                    value={line.debit}
                                    onChange={(e) => handleLineChange(index, e)}
                                    min="0"
                                    step="0.01"
                                    className="amount-input"
                                />
                            </div>
                            <div className="form-group amount-group">
                                <label htmlFor={`credit-${index}`}>Credit:</label>
                                <input
                                    type="number"
                                    id={`credit-${index}`}
                                    name="credit"
                                    value={line.credit}
                                    onChange={(e) => handleLineChange(index, e)}
                                    min="0"
                                    step="0.01"
                                    className="amount-input"
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
                            />
                        </div>
                        <button type="button" onClick={() => removeLine(index)} className="btn btn-danger remove-line-btn">
                            Remove
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addLine} className="btn btn-secondary add-line-btn">
                    Add Line Item
                </button>

                <div className="totals-section">
                    <p><strong>Total Debits:</strong> ${totalDebits.toFixed(2)}</p>
                    <p><strong>Total Credits:</strong> ${totalCredits.toFixed(2)}</p>
                    {!isBalanced && (
                        <p className="balance-warning">Debits and Credits must balance!</p>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting || !isBalanced || formData.lines.length < 2}>
                        {submitting ? 'Updating...' : 'Update Journal Entry'}
                    </button>
                    <button type="button" onClick={() => navigate('/journal-entries')} className="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditJournalEntryPage;