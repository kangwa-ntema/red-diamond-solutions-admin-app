// frontend/src/Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/JournalEntryActivityLog/JournalEntryActivityLog.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../../context/AuthContext'; // Adjust path as needed
import { getJournalEntryActivityLogs, addJournalEntryNote, deleteJournalEntryActivity, getJournalEntryById } from '../../../../../services/api/';
import './JournalEntryActivityLog.css'; // Create this CSS file for styling

/**
 * @component JournalEntryActivityLog
 * @description Displays a chronological log of activities and notes related to a specific Journal Entry.
 * Allows authorized users to add new notes and delete existing notes.
 */
const JournalEntryActivityLog = () => {
    const { id: journalEntryId } = useParams(); // Get journalEntryId from the URL parameters
    const { hasRole } = useAuth(); // Assuming useAuth provides role checking
    const [journalEntry, setJournalEntry] = useState(null); // To store journal entry details for display
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    // Memoized function to fetch journal entry details and activities
    const fetchJournalEntryAndActivities = useCallback(async () => {
        if (!journalEntryId) {
            setError("Journal Entry ID is missing. Cannot fetch activity logs.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch journal entry details to display description/number
            const entryData = await getJournalEntryById(journalEntryId); // Assuming this function exists in your journalEntryApi
            setJournalEntry(entryData);

            // Fetch activity logs for the journal entry
            const activityData = await getJournalEntryActivityLogs(journalEntryId);
            setActivities(activityData || []); // Ensure it's an array
        } catch (err) {
            console.error("Error fetching journal entry or activities:", err);
            setError(err.message || "Failed to load journal entry activity log.");
            toast.error(err.message || "Failed to load activity log.");
        } finally {
            setLoading(false);
        }
    }, [journalEntryId]);

    // Effect to fetch data on component mount and when journalEntryId changes
    useEffect(() => {
        fetchJournalEntryAndActivities();
    }, [fetchJournalEntryAndActivities]);

    // Function to handle adding a new note
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim()) {
            toast.error("Note cannot be empty.");
            return;
        }
        if (!journalEntryId) {
            toast.error("Journal Entry ID is missing. Cannot add note.");
            return;
        }

        setIsAddingNote(true);
        try {
            const addedNote = await addJournalEntryNote(journalEntryId, { description: newNoteContent.trim() });
            toast.success("Note added successfully!");
            setNewNoteContent('');
            fetchJournalEntryAndActivities(); // Re-fetch all activities to include the new note
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
            await deleteJournalEntryActivity(activityToDelete._id);
            toast.success("Activity deleted successfully!");
            setActivityToDelete(null); // Clear the activity to delete
            fetchJournalEntryAndActivities(); // Re-fetch activities to reflect deletion
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

    // Link back to the specific journal entry view page
    const backLinkPath = `/accounting/journal-entries/${journalEntryId}`;

    return (
        <div className="journalEntryActivityLog">
            {/* Back button to Journal Entry Details */}
            <Link to={backLinkPath} className="backButton">
                &larr; Back to Journal Entry Details
            </Link>

            <h2>Activity Log for Journal Entry: {journalEntry?.description?.substring(0, 50)}... (ID: {journalEntryId})</h2>

            {/* Add New Note Section */}
            {hasRole(['superadmin', 'admin']) && ( // Only allow superadmin/admin to add notes
                <div className="addNoteSection">
                    <form onSubmit={handleAddNote} className="addNoteForm">
                        <textarea
                            className="noteTextarea"
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="Add a new note about this journal entry..."
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
                    <p className="noActivitiesMessage">No activities or notes recorded for this journal entry yet.</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity._id} className="activityItem">
                            <div className="activityHeader">
                                <span className="activityType">{activity.action}</span>
                                <span className="activityDate">{formatActivityDate(activity.createdAt)}</span>
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

export default JournalEntryActivityLog;
