// frontend/src/Pages/MainDashboardPage/UserManagementPage/UserActivityLogs/UserActivityLogs.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext';
import { getUserActivityLogs, addUserNote, deleteUserActivity } from '../../../../services/api/'; // Corrected import path
import './UserActivityLogs.css'; // New CSS file for user activity logs

const UserActivityLogs = () => {
  const { id: userId } = useParams(); // Get userId from the URL parameters
  const { hasRole } = useAuth(); // For authorization checks (e.g., who can add/delete notes)

  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

  // Memoized function to fetch activities
  const fetchActivityLog = useCallback(async () => {
    if (!userId) {
      setError("User ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getUserActivityLogs(userId);
      setActivityLog(response || []);
    } catch (err) {
      console.error("Failed to fetch user activity log:", err);
      setError(err.message || "Failed to load activity log.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActivityLog();
  }, [fetchActivityLog]);

  // Function to format activity date
  const formatActivityDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handler for adding a new note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      toast.error("Note cannot be empty.");
      return;
    }
    if (!userId) {
      toast.error("User ID is missing. Cannot add note.");
      return;
    }

    setIsAddingNote(true);
    try {
      await addUserNote(userId, { message: newNoteContent.trim(), action: "Note Added" });
      toast.success("Note added successfully!");
      setNewNoteContent('');
      fetchActivityLog();
    } catch (err) {
      console.error("Error adding note:", err);
      toast.error(err.message || "Failed to add note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Function to open the delete confirmation modal
  const confirmDeleteActivity = (activity) => {
    setActivityToDelete(activity);
    setShowDeleteConfirm(true);
  };

  // Function to execute the delete action after confirmation
  const executeDeleteActivity = async () => {
    setShowDeleteConfirm(false);
    if (!activityToDelete) return;

    setLoading(true);
    try {
      await deleteUserActivity(activityToDelete._id);
      toast.success("Activity deleted successfully!");
      setActivityToDelete(null);
      fetchActivityLog();
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast.error(err.message || "Failed to delete activity.");
      setLoading(false);
    }
  };

  // Link back to the user's details page
  const backLinkPath = `/users/${userId}`;

  if (loading) {
    return (
      <div className="user-activity-page-container">
        <Link to={backLinkPath} className="back-button">
          &larr; Back to User Details
        </Link>
        <div className="activityLogMessage">Loading user activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-activity-page-container">
        <Link to={backLinkPath} className="back-button">
          &larr; Back to User Details
        </Link>
        <div className="activityLogErrorMessage">Error: {error}</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="user-activity-page-container">
        <Link to="/users" className="back-button">
          &larr; Back to Users List
        </Link>
        <p className="noActivityMessage">No user ID provided. Cannot display activity logs.</p>
      </div>
    );
  }

  return (
    <div className="user-activity-page-container">
      <Link to={backLinkPath} className="back-button">
        &larr; Back to User Details
      </Link>
      <h2>Activity Log for User ID: {userId}</h2>

      {/* Add Note Section - typically for Superadmin/Admin to add remarks about a user */}
      {hasRole(['superadmin', 'admin']) && ( // Only show add note for authorized roles
        <div className="addNoteSection">
          <form onSubmit={handleAddNote} className="addNoteForm">
            <textarea
              className="noteTextarea"
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Add a new note about this user..."
              rows="3"
              disabled={isAddingNote}
            ></textarea>
            <button type="submit" className="addNoteButton" disabled={isAddingNote}>
              {isAddingNote ? 'Adding Note...' : 'Add Note'}
            </button>
          </form>
        </div>
      )}

      {/* Activity List */}
      <div className="activityList">
        {activityLog.length === 0 ? (
          <p className="noActivitiesMessage">No activity recorded for this user yet.</p>
        ) : (
          <div className="activityLogTableContainer">
            <table className="activityLogTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action By</th>
                  <th>Action Type</th>
                  <th>Description</th>
                  <th></th> {/* Column for Delete button */}
                </tr>
              </thead>
              <tbody>
                {activityLog.map((activity) => (
                  <tr key={activity._id || activity.createdAt}>
                    <td>{formatActivityDate(activity.createdAt)}</td>
                    <td>{activity.recordedBy?.username || 'System'}</td>
                    <td>{activity.action || 'N/A'}</td>
                    <td>{activity.message || 'N/A'}</td>
                    <td>
                      {/* Allow deletion only for 'Note Added' activities and by superadmin */}
                      {activity.action === 'Note Added' && hasRole(['superadmin']) && ( // Typically only superadmin can delete system notes
                        <button
                          className="deleteActivityBtn"
                          onClick={() => confirmDeleteActivity(activity)}
                          disabled={loading || isAddingNote}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Confirm Delete Activity</h3>
            <p>Are you sure you want to delete this user activity log entry?</p>
            <div className="modalActions">
              <button onClick={executeDeleteActivity} className="modalConfirmBtn" disabled={loading}>Yes, Delete</button>
              <button onClick={() => setShowConfirmModal(false)} className="modalCancelBtn" disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityLogs;
