// src/Pages/MainDashboardPage/AccountingManagementDashboard/JournalEntriesListPage/ViewJournalEntryPage/ViewJournalEntryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import the centralized API functions from accountingApi
import {
    getJournalEntryById,
    deleteJournalEntry // Added for delete functionality
} from '../../../../../services/api/'; // Corrected import path

// Import the ConfirmationModal component
import ConfirmationModal from '../../../../../Pages/components/common/ConfirmationModal/ConfirmationModal'; // Adjust path as necessary

import './ViewJournalEntryPage.css'; // Existing CSS for the page

/**
 * @component ViewJournalEntryPage
 * @description Displays detailed information about a single journal entry.
 * Provides options to edit or delete the entry, with a confirmation modal for deletion.
 */
const ViewJournalEntryPage = () => {
    // Get the journal entry ID from the URL parameters
    const { id: entryId } = useParams();
    // Hook for programmatic navigation
    const navigate = useNavigate();

    // State to store the fetched journal entry data
    const [journalEntry, setJournalEntry] = useState(null);
    // Loading state for data fetching
    const [loading, setLoading] = useState(true);
    // Error state for displaying fetch errors
    const [error, setError] = useState(null);
    // State to control the visibility of the delete confirmation modal
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    // Loading state specifically for the delete operation
    const [isDeleting, setIsDeleting] = useState(false);

    /**
     * @function fetchJournalEntryData
     * @description Fetches the detailed journal entry data from the backend API based on the entryId.
     * Handles loading, error states, and redirects if the entry is not found.
     */
    const fetchJournalEntryData = useCallback(async () => {
        setLoading(true); // Start loading
        setError(null);    // Clear any previous errors
        try {
            const data = await getJournalEntryById(entryId); // Use centralized API function
            setJournalEntry(data); // Set fetched data to state
        } catch (err) {
            console.error("ViewJournalEntryPage: Error fetching journal entry:", err);
            // Check if the error indicates a "not found" scenario (e.g., 404 or invalid ID)
            if (err.message.includes("not found") || err.message.includes("Invalid ID")) {
                setError("Journal entry not found or invalid ID.");
                toast.error("Journal entry not found. Redirecting to list.");
                navigate('/accounting/journal-entries', { replace: true }); // Redirect to list page
            } else {
                setError("Failed to load journal entry details. Please try again.");
                toast.error("Failed to load journal entry details.");
            }
        } finally {
            setLoading(false); // End loading regardless of success or failure
        }
    }, [entryId, navigate]); // Dependencies: re-run if entryId or navigate changes

    // useEffect hook to call fetchJournalEntryData on component mount or when its dependencies change
    useEffect(() => {
        fetchJournalEntryData();
    }, [fetchJournalEntryData]);

    /**
     * @function handleDeleteClick
     * @description Opens the confirmation modal for deleting the journal entry.
     */
    const handleDeleteClick = () => {
        setShowDeleteConfirmation(true);
    };

    /**
     * @function handleConfirmDelete
     * @description Executes the actual deletion of the journal entry after user confirmation.
     * Uses the deleteJournalEntry API function and handles success/error notifications and navigation.
     */
    const handleConfirmDelete = async () => {
        setIsDeleting(true); // Set deleting state to true
        try {
            await deleteJournalEntry(entryId); // Call centralized delete API
            toast.success("Journal entry deleted successfully!");
            navigate('/accounting/journal-entries'); // Navigate back to the list page after successful deletion
        } catch (err) {
            console.error("ViewJournalEntryPage: Error deleting journal entry:", err);
            toast.error(`Failed to delete journal entry: ${err.message || 'Server error'}`);
        } finally {
            setIsDeleting(false); // Reset deleting state
            setShowDeleteConfirmation(false); // Close the confirmation modal
        }
    };

    // Calculate total debits and credits for display and verification
    // Uses optional chaining (`?.`) to safely access `lines` and `reduce` to sum values.
    const totalDebits = journalEntry?.lines?.reduce((sum, item) => sum + (item.debit || 0), 0) || 0;
    const totalCredits = journalEntry?.lines?.reduce((sum, item) => sum + (item.credit || 0), 0) || 0;

    // Determine if the entry is balanced for display purposes
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    // Conditional rendering for loading state
    if (loading) {
        return <div className="view-journal-entry-container loading">Loading journal entry...</div>;
    }

    // Conditional rendering for error state if initial data fetch failed
    if (error && !journalEntry) { // Only show global error if no journalEntry was loaded
        return <div className="view-journal-entry-container error">{error}</div>;
    }

    // Conditional rendering if journal entry is null after loading (e.g., API returned no data)
    if (!journalEntry) {
        return <div className="view-journal-entry-container no-data">Journal Entry not found.</div>;
    }

    return (
        <div className="view-journal-entry-container">
            <h1 className="view-journal-entry-header">Journal Entry Details</h1>

            {/* General Entry Details Card */}
            <div className="entry-details-card">
                <p><strong>Entry Number:</strong> {journalEntry.entryNumber || 'N/A'}</p>
                <p><strong>Date:</strong> {new Date(journalEntry.entryDate).toLocaleDateString()}</p>
                <p><strong>Description:</strong> {journalEntry.description || 'N/A'}</p>
                <p><strong>Recorded By:</strong> {journalEntry.recordedBy?.username || 'Unknown User'}</p>
                <p><strong>Created At:</strong> {new Date(journalEntry.createdAt).toLocaleString()}</p>
                <p><strong>Last Updated:</strong> {new Date(journalEntry.updatedAt).toLocaleString()}</p>
                {journalEntry.relatedDocument && (
                    <p>
                        <strong>Related Document:</strong> {journalEntry.relatedDocument.type} (ID: {journalEntry.relatedDocument.id})
                    </p>
                )}
            </div>

            {/* Line Items Section */}
            <div className="line-items-section">
                <h2>Line Items</h2>
                {journalEntry.lines && journalEntry.lines.length > 0 ? (
                    <table className="line-items-table">
                        <thead>
                            <tr>
                                <th>Account</th>
                                <th>Memo</th> {/* Added memo column */}
                                <th className="text-right">Debit (ZMW)</th>
                                <th className="text-right">Credit (ZMW)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {journalEntry.lines.map((item) => (
                                <tr key={item._id || Math.random()}>
                                    <td>
                                        {/* Display account name and type from populated account data */}
                                        {item.accountId?.accountName || 'Unknown Account'}
                                        {item.accountId?.accountCode && ` (${item.accountId.accountCode})`}
                                    </td>
                                    <td>{item.lineDescription || 'N/A'}</td> {/* Display line memo */}
                                    <td className="amount debit text-right">
                                        {item.debit > 0 ? `ZMW ${item.debit.toFixed(2)}` : ''}
                                    </td>
                                    <td className="amount credit text-right">
                                        {item.credit > 0 ? `ZMW ${item.credit.toFixed(2)}` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2"><strong>Totals:</strong></td> {/* Adjusted colspan for new memo column */}
                                <td className="amount total-debit text-right"><strong>ZMW {totalDebits.toFixed(2)}</strong></td>
                                <td className="amount total-credit text-right"><strong>ZMW {totalCredits.toFixed(2)}</strong></td>
                            </tr>
                            {!isBalanced && (
                                <tr>
                                    <td colSpan="4" className="imbalance-warning text-center"> {/* Adjusted colspan */}
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

            {/* Action Buttons */}
            <div className="journal-entry-actions">
                {/* Link to the EditJournalEntryPage with the current entry's ID */}
                <Link to={`/accounting/journal-entries/edit/${entryId}`} className="btn btn-primary">Edit Entry</Link>
                {/* NEW BUTTON: Link to Journal Entry Activity Log Page */}
                <Link to={`/accounting/journal-entries/${entryId}/activity-logs`} className="btn btn-info">View Activity Log</Link>
                {/* Delete button, triggers confirmation modal */}
                <button
                    onClick={handleDeleteClick}
                    className="btn btn-danger"
                    disabled={isDeleting} // Disable delete button while deletion is in progress
                >
                    {isDeleting ? 'Deleting...' : 'Delete Entry'}
                </button>
            </div>

            {/* Back button */}
            <Link to="/accounting/journal-entries" className="btn btn-secondary back-button">Back to All Journal Entries</Link>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirmation}
                onClose={() => setShowDeleteConfirmation(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete this journal entry? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ViewJournalEntryPage;
