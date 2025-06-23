// src/Pages/MainDashboardPage/ClientManagementPage/ClientActivityLog/ClientActivityLog.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // <--- IMPORT Link here
import { getClientActivityLogs, addClientNote, deleteClientActivity } from '../../../../../src/services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import './ClientActivityLog.css';

/**
 * @component ClientActivityLog
 * @description Displays a chronological log of activities and notes related to a specific client.
 * Allows authorized users to add new notes and delete existing notes.
 */
const ClientActivityLog = () => {
    const { id: clientId } = useParams(); // Get ID from URL params
    const { hasRole } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activityToDelete, setActivityToDelete] = useState(null);

    // Memoized function to fetch activities
    const fetchActivities = useCallback(async () => {
        if (!clientId) {
            setError("Client ID is missing. Cannot fetch activity logs.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getClientActivityLogs(clientId);
            setActivities(data);
        } catch (err) {
            console.error("Error fetching client activities:", err);
            setError(err.message || "Failed to load client activity log.");
            toast.error(err.message || "Failed to load activity log.");
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    // Effect to fetch activities on component mount and when clientId changes
    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    // ... (handleAddNote, confirmDeleteActivity, executeDeleteActivity, formatActivityDate functions)
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim()) {
            toast.error("Note cannot be empty.");
            return;
        }
        if (!clientId) {
            toast.error("Client ID is missing. Cannot add note.");
            return;
        }

        setIsAddingNote(true);
        try {
            const addedNote = await addClientNote(clientId, { description: newNoteContent.trim() });
            toast.success("Note added successfully!");
            setNewNoteContent('');
            fetchActivities();
        } catch (err) {
            console.error("Error adding note:", err);
            toast.error(err.message || "Failed to add note.");
        } finally {
            setIsAddingNote(false);
        }
    };

    const confirmDeleteActivity = (activity) => {
        setActivityToDelete(activity);
        setShowDeleteConfirm(true);
    };

    const executeDeleteActivity = async () => {
        setShowDeleteConfirm(false);
        if (!activityToDelete) return;

        setLoading(true);
        try {
            await deleteClientActivity(activityToDelete._id);
            toast.success("Activity deleted successfully!");
            setActivityToDelete(null);
            fetchActivities();
        } catch (err) {
            console.error("Error deleting activity:", err);
            toast.error(err.message || "Failed to delete activity.");
            setLoading(false);
        }
    };

    const formatActivityDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };


    if (loading) return <div className="activityLogMessage">Loading activities...</div>;
    if (error) return <div className="activityLogErrorMessage">Error: {error}</div>;

    return (
        <div className="clientActivityLog">
            {/* ADDED: Back to Client Details Button */}
            <Link to={`/clients/${clientId}`} className="backToClientDetailsBtn">
                &larr; Back to Client Details
            </Link>

            <h2>Client Activity Log for Client ID: {clientId}</h2>
            <div className="addNoteSection">
                <form onSubmit={handleAddNote} className="addNoteForm">
                    <textarea
                        className="noteTextarea"
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Add a new note about this client..."
                        rows="3"
                        disabled={isAddingNote}
                    ></textarea>
                    <button type="submit" className="addNoteButton" disabled={isAddingNote}>
                        {isAddingNote ? 'Adding Note...' : 'Add Note'}
                    </button>
                </form>
            </div>

            <div className="activityList">
                {activities.length === 0 ? (
                    <p className="noActivitiesMessage">No activities or notes recorded for this client yet.</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity._id} className="activityItem">
                            <div className="activityHeader">
                                <span className="activityType">{activity.activityType}</span>
                                <span className="activityDate">{formatActivityDate(activity.activityDate)}</span>
                            </div>
                            <p className="activityDescription">{activity.description}</p>
                            <div className="activityFooter">
                                <span className="recordedBy">
                                    Recorded By: <strong>{activity.recordedBy ? activity.recordedBy.username : 'N/A'}</strong>
                                </span>
                                {/* Allow deletion only for 'Note Added' and by superadmin/admin */}
                                {activity.activityType === 'Note Added' && hasRole(['superadmin', 'admin']) && (
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

export default ClientActivityLog;