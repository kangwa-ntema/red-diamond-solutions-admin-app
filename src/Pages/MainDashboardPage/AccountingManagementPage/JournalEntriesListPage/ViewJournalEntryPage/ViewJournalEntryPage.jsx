// src/pages/ViewJournalEntryPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getJournalEntryById } from '../../../../../services/api/accountingApi'; // Adjust path if necessary

import './ViewJournalEntryPage.css';

const ViewJournalEntryPage = () => {
    const { id: entryId } = useParams();
    const navigate = useNavigate();

    const [journalEntry, setJournalEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJournalEntryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getJournalEntryById(entryId);
            setJournalEntry(data);
        } catch (err) {
            console.error("Error fetching journal entry:", err);
            setError("Failed to load journal entry details. Please try again.");
            toast.error("Failed to load journal entry details.");
            // If the entry is not found or an unrecoverable error occurs,
            // you might want to redirect the user.
            // navigate('/journal-entries');
        } finally {
            setLoading(false);
        }
    }, [entryId, navigate]); // Added navigate to dependencies for useCallback

    useEffect(() => {
        fetchJournalEntryData();
    }, [fetchJournalEntryData]);

    if (loading) {
        return <div className="view-journal-entry-container loading">Loading journal entry...</div>;
    }

    if (error) {
        return <div className="view-journal-entry-container error">{error}</div>;
    }

    if (!journalEntry) {
        return <div className="view-journal-entry-container no-data">Journal Entry not found.</div>;
    }

    // Calculate total debits and credits for verification
    // Assuming 'lines' array in journalEntry contains objects with 'debit' and 'credit' properties
    const totalDebits = journalEntry.lines
        ?.reduce((sum, item) => sum + (item.debit || 0), 0) || 0;

    const totalCredits = journalEntry.lines
        ?.reduce((sum, item) => sum + (item.credit || 0), 0) || 0;

    return (
        <div className="view-journal-entry-container">
            <h1 className="view-journal-entry-header">Journal Entry Details</h1>

            <div className="entry-details-card">
                <p><strong>Date:</strong> {new Date(journalEntry.entryDate).toLocaleDateString()}</p>
                <p><strong>Description:</strong> {journalEntry.description || 'N/A'}</p>
                <p><strong>Recorded By:</strong> {journalEntry.recordedBy?.username || 'Unknown User'}</p>
                <p><strong>Created At:</strong> {new Date(journalEntry.createdAt).toLocaleString()}</p>
                <p><strong>Last Updated:</strong> {new Date(journalEntry.updatedAt).toLocaleString()}</p>
            </div>

            <div className="line-items-section">
                <h2>Line Items</h2>
                {journalEntry.lines && journalEntry.lines.length > 0 ? (
                    <table className="line-items-table">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Debit</th>
                                <th>Credit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journalEntry.lines.map((item) => (
                                <tr key={item._id || Math.random()}>
                                    <td>
                                        {/* Display account name and type from populated account data */}
                                        {item.accountId?.accountName || 'Unknown Account'}
                                        {item.accountId?.accountType && ` (${item.accountId.accountType})`}
                                    </td>
                                    {/* Display debit and credit amounts directly from item.debit and item.credit */}
                                    <td className="amount debit">{item.debit > 0 ? `$${item.debit.toFixed(2)}` : ''}</td>
                                    <td className="amount credit">{item.credit > 0 ? `$${item.credit.toFixed(2)}` : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Totals:</strong></td>
                                <td className="amount total-debit"><strong>${totalDebits.toFixed(2)}</strong></td>
                                <td className="amount total-credit"><strong>${totalCredits.toFixed(2)}</strong></td>
                            </tr>
                            {totalDebits.toFixed(2) !== totalCredits.toFixed(2) && (
                                <tr>
                                    <td colSpan="3" className="imbalance-warning">
                                        <i className="fas fa-exclamation-triangle"></i> Debits and Credits do not balance!
                                    </td>
                                </tr>
                            )}
                        </tfoot>
                    </table>
                ) : (
                    <p>No line items found for this journal entry.</p>
                )}
            </div>

            <div className="journal-entry-actions">
                {/* Correctly links to the EditJournalEntryPage with the current entry's ID */}
                <Link to={`/journal-entries/edit/${entryId}`} className="btn btn-primary">Edit Entry</Link>
                {/* Add a delete button with a confirmation modal here */}
            </div>

            <Link to="/journal-entries" className="btn btn-secondary back-button">Back to All Journal Entries</Link>
        </div>
    );
};

export default ViewJournalEntryPage;