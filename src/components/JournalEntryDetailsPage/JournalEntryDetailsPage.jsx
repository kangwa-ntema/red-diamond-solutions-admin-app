import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, clearAuthData } from '../../utils/authUtils'; // Adjust path as needed
import { toast } from 'react-toastify'; // For notifications
import './JournalEntryDetailsPage.css' // Common CSS for journal entry pages

/**
 * @component JournalEntryDetailsPage
 * @description Displays the detailed view of a single journal entry.
 * Provides options to edit or delete the entry.
 */
const JournalEntryDetailsPage = () => {
    const { id: entryId } = useParams();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [journalEntry, setJournalEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJournalEntry = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = getToken();

        if (!token) {
            clearAuthData();
            navigate('/login');
            toast.error('Authentication required to view journal entry.');
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
            setJournalEntry(data);
        } catch (err) {
            console.error("JournalEntryDetailsPage: Error fetching journal entry:", err);
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
        fetchJournalEntry();
    }, [fetchJournalEntry]);

    const handleDeleteJournalEntry = async () => {
        if (!window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        const token = getToken();
        if (!token) {
            clearAuthData();
            navigate('/login');
            toast.error('Authentication required to delete journal entry.');
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/journal-entries/${entryId}`, {
                method: 'DELETE',
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
                throw new Error(errorData.message || 'Failed to delete journal entry.');
            }

            toast.success('Journal entry deleted successfully!');
            navigate('/journal-entries'); // Redirect to list page after deletion
        } catch (err) {
            console.error("Error deleting journal entry:", err);
            setError(err.message || "Network error or server unavailable.");
            toast.error(`Error deleting journal entry: ${err.message || "Something went wrong."}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="journalEntryContainer loading">Loading journal entry details...</div>;
    }

    if (error) {
        return <div className="journalEntryContainer error">Error: {error}</div>;
    }

    if (!journalEntry) {
        return <div className="journalEntryContainer noData">Journal entry not found.</div>;
    }

    return (
        <div className="journalEntryContainer">
            <Link to="/journal-entries" className="journalEntryBackLink">
                {"<"} Back to Journal Entries List
            </Link>
            <h1 className="journalEntryHeadline">Journal Entry Details: {journalEntry.entryNumber || journalEntry._id.substring(0, 8)}</h1>

            <div className="journalEntryDetailsCard">
                <p><strong>Date:</strong> {new Date(journalEntry.entryDate).toLocaleDateString()}</p>
                <p><strong>Description:</strong> {journalEntry.description}</p>
                <p><strong>Recorded By:</strong> {journalEntry.recordedByUsername || (journalEntry.recordedBy?.username || 'N/A')}</p>
                {journalEntry.relatedDocument?.type && (
                    <p>
                        <strong>Related Document:</strong> {journalEntry.relatedDocument.type} (ID: {journalEntry.relatedDocument.id?.substring(0, 10)}...)
                    </p>
                )}

                <h3>Line Items:</h3>
                <div className="lineItemsTableContainer">
                    <table className="lineItemsTable">
                        <thead>
                            <tr>
                                <th>Account Code</th>
                                <th>Account Name</th>
                                <th>Account Type</th>
                                <th>Debit (ZMW)</th>
                                <th>Credit (ZMW)</th>
                                <th>Memo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journalEntry.lines.map((line, index) => (
                                <tr key={index}>
                                    <td>{line.accountId?.accountCode || 'N/A'}</td>
                                    <td>{line.accountId?.accountName || 'N/A'}</td>
                                    <td>{line.accountId?.accountType || line.accountType || 'N/A'}</td> {/* Fallback to line.accountType if not populated */}
                                    <td className="debitAmount">ZMW {line.debit.toFixed(2)}</td>
                                    <td className="creditAmount">ZMW {line.credit.toFixed(2)}</td>
                                    <td>{line.lineDescription || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3"><strong>Totals:</strong></td>
                                <td className="totalDebit"><strong>ZMW {journalEntry.lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2)}</strong></td>
                                <td className="totalCredit"><strong>ZMW {journalEntry.lines.reduce((sum, line) => sum + line.credit, 0).toFixed(2)}</strong></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="journalEntryActions">
                    <Link to={`/journal-entries/edit/${journalEntry._id}`} className="editJournalEntryBtn">Edit Entry</Link>
                    <button onClick={handleDeleteJournalEntry} className="deleteJournalEntryBtn">Delete Entry</button>
                </div>
            </div>
        </div>
    );
};

export default JournalEntryDetailsPage;
