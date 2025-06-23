// frontend/src/Pages/MainDashboardPage/AccountingManagementPage/COAPage/AccountActivityLog/AccountActivityLog.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAccountActivityLogs, addAccountNote, deleteAccountActivity , getAccountById} from '../../../../../services/api/'; // Corrected import path
import { toast } from 'react-toastify';
import { useAuth } from '../../../../../context/AuthContext'; // Adjust path as needed
import './AccountActivityLog.css'; // Create this CSS file for styling

/**
 * @component AccountActivityLog
 * @description Displays a chronological log of activities and notes related to a specific Chart of Accounts entry.
 * Allows authorized users to add new notes and delete existing notes.
 */
const AccountActivityLog = () => {
    const { id: accountId } = useParams(); // Get accountId from the URL parameters
    const { hasRole } = useAuth(); // Assuming useAuth provides role checking
    const [account, setAccount] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    // Memoized function to fetch account details and activities
    const fetchAccountAndActivities = useCallback(async () => {
        if (!accountId) {
            setError("Account ID is missing. Cannot fetch activity logs.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch account details to display name/code
            const accountData = await getAccountById(accountId);
            setAccount(accountData);

            // Fetch activity logs for the account
            const activityData = await getAccountActivityLogs(accountId);
            setActivities(activityData);
        } catch (err) {
            console.error("Error fetching account or activities:", err);
            setError(err.message || "Failed to load account activity log.");
            toast.error(err.message || "Failed to load activity log.");
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    // Effect to fetch data on component mount and when accountId changes
    useEffect(() => {
        fetchAccountAndActivities();
    }, [fetchAccountAndActivities]);

    // Function to handle adding a new note
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim()) {
            toast.error("Note cannot be empty.");
            return;
        }
        if (!accountId) {
            toast.error("Account ID is missing. Cannot add note.");
            return;
        }

        setIsAddingNote(true);
        try {
            const addedNote = await addAccountNote(accountId, { description: newNoteContent.trim() });
            toast.success("Note added successfully!");
            setNewNoteContent('');
            fetchAccountAndActivities(); // Re-fetch all activities to include the new note
        } catch (err) {
            console.error("Error adding note:", err);
            toast.error(err.message || "Failed to add note.");
        } finally {
            setIsAddingNote(false);
        }
    };

    // Function to confirm deletion of an activity
    const confirmDeleteActivity = (activity) => {
        setActivityToDelete(activity);
        setShowDeleteConfirm(true);
    };

    // Function to execute deletion of an activity after confirmation
    const executeDeleteActivity = async () => {
        setShowDeleteConfirm(false); // Close modal first
        if (!activityToDelete) return;

        setLoading(true); // Indicate loading while deleting
        try {
            await deleteAccountActivity(activityToDelete._id);
            toast.success("Activity deleted successfully!");
            setActivityToDelete(null); // Clear the activity to delete
            fetchAccountAndActivities(); // Re-fetch activities to reflect deletion
        } catch (err) {
            console.error("Error deleting activity:", err);
            toast.error(err.message || "Failed to delete activity.");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format activity dates
    const formatActivityDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };


    if (loading) return <div className="activityLogMessage">Loading activities...</div>;
    if (error) return <div className="activityLogErrorMessage">Error: {error}</div>;

    // Determine the path back to the COA dashboard or specific account view
    const backLinkPath = `/accounting/accounts/${accountId}`; // Back to specific account view
    // const backLinkPath = `/accounting/accounts`; // Back to main COA dashboard if preferred

    return (
        <div className="accountActivityLog">
            {/* Back button to Account Details */}
            <Link to={"/accounting/accounts"} className="backButton">
                &larr; Back to Account Details
            </Link>

            <h2>Activity Log for {account?.accountName || 'Account'} (ID: {account?.accountCode || accountId})</h2>

            {/* Add New Note Section */}
            {hasRole(['superadmin', 'admin']) && ( // Only allow superadmin/admin to add notes
                <div className="addNoteSection">
                    <form onSubmit={handleAddNote} className="addNoteForm">
                        <textarea
                            className="noteTextarea"
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="Add a new note about this account..."
                            rows="3"
                            disabled={isAddingNote}
                        ></textarea>
                        <button type="submit" className="addNoteButton" disabled={isAddingNote}>
                            {isAddingNote ? 'Adding Note...' : 'Add Note'}
                        </button>
                    </form>
                </div>
            )}

            {/* Activity List Display */}
            <div className="activityList">
                {activities.length === 0 ? (
                    <p className="noActivitiesMessage">No activities or notes recorded for this account yet.</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity._id} className="activityItem">
                            <div className="activityHeader">
                                <span className="activityType">{activity.action}</span> {/* Using 'action' for type */}
                                <span className="activityDate">{formatActivityDate(activity.createdAt)}</span> {/* Using createdAt for timestamp */}
                            </div>
                            <p className="activityDescription">{activity.message}</p>
                            <div className="activityFooter">
                                <span className="recordedBy">
                                    Recorded By: <strong>{activity.recordedBy ? activity.recordedBy.username : 'System'}</strong>
                                </span>
                                {/* Allow deletion only for 'Note Added' and by superadmin */}
                                {activity.action === 'Note Added' && hasRole(['superadmin']) && ( // Only superadmin can delete manual notes
                                    <button
                                        className="deleteActivityBtn"
                                        onClick={() => confirmDeleteActivity(activity)}
                                        disabled={loading || isAddingNote}
                                    >
                                        Delete Note
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <h3>Confirm Delete Activity</h3>
                        <p>Are you sure you want to delete this activity log entry?</p>
                        <div className="modalActions">
                            <button onClick={executeDeleteActivity} className="modalConfirmBtn">Yes, Delete</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="modalCancelBtn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountActivityLog;
