// src/Pages/MainDashboardPage/LoansManagementPage/LoanActivityLog/LoanActivityLogs.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../../context/AuthContext'; // Import useAuth for role checking
import { getLoanActivityLogs, addLoanNote, deleteLoanActivity } from '../../../../services/api/'; // Corrected imports
import './LoanActivityLogs.css';

const LoanActivityLogs = () => {
  const { id: loanId } = useParams(); // Get loanId from the URL parameters
  const { hasRole } = useAuth(); // Get hasRole from AuthContext

  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newNoteContent, setNewNoteContent] = useState(''); // State for new note input
  const [isAddingNote, setIsAddingNote] = useState(false); // Loading state for adding note
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // State for delete confirmation modal
  const [activityToDelete, setActivityToDelete] = useState(null); // Stores the activity to be deleted

  // Memoized function to fetch activities
  const fetchActivityLog = useCallback(async () => {
    if (!loanId) {
      setError("Loan ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Assuming getLoanActivityLogs returns an array of activity objects directly.
      const response = await getLoanActivityLogs(loanId);
      setActivityLog(response || []); // Set activityLog directly from the array response
    } catch (err) {
      console.error("Failed to fetch loan activity log:", err);
      setError(err.message || "Failed to load activity log.");
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchActivityLog();
  }, [fetchActivityLog]); // Depend on memoized fetchActivityLog

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
    if (!loanId) {
      toast.error("Loan ID is missing. Cannot add note.");
      return;
    }

    setIsAddingNote(true);
    try {
      // Call the new API function to add a note to this loan's activity log
      await addLoanNote(loanId, { message: newNoteContent.trim(), action: "Note Added" });
      toast.success("Note added successfully!");
      setNewNoteContent(''); // Clear the input field
      fetchActivityLog(); // Re-fetch activities to show the new note
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
    setShowDeleteConfirm(false); // Close the modal
    if (!activityToDelete) return;

    setLoading(true); // Indicate loading while deleting
    try {
      // Call the new API function to delete the activity
      await deleteLoanActivity(activityToDelete._id);
      toast.success("Activity deleted successfully!");
      setActivityToDelete(null); // Clear the activity to delete
      fetchActivityLog(); // Re-fetch activities to update the list
    } catch (err) {
      console.error("Error deleting activity:", err);
      toast.error(err.message || "Failed to delete activity.");
      setLoading(false); // Turn off loading on error
    }
  };

  const backLinkPath = `/loans/${loanId}`; // Links back to the ViewLoanPage

  if (loading) {
    return (
      <div className="loan-activity-page-container">
        <Link to={backLinkPath} className="back-button">
          &larr; Back to Loan Details
        </Link>
        <div className="activityLogMessage">Loading loan activity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loan-activity-page-container">
        <Link to={backLinkPath} className="back-button">
          &larr; Back to Loan Details
        </Link>
        <div className="activityLogErrorMessage">Error: {error}</div>
      </div>
    );
  }

  if (!loanId) {
    return (
      <div className="loan-activity-page-container">
        <Link to="/loans" className="back-button">
          &larr; Back to Loans List
        </Link>
        <p className="noActivityMessage">No loan ID provided. Cannot display activity logs.</p>
      </div>
    );
  }

  return (
    <div className="loan-activity-page-container">
      <Link to={backLinkPath} className="back-button">
        &larr; Back to Loan Details
      </Link>
      <h2>Activity Log for Loan ID: {loanId}</h2>

      {/* Add Note Section */}
      <div className="addNoteSection">
        <form onSubmit={handleAddNote} className="addNoteForm">
          <textarea
            className="noteTextarea"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Add a new note about this loan..."
            rows="3"
            disabled={isAddingNote}
          ></textarea>
          <button type="submit" className="addNoteButton" disabled={isAddingNote}>
            {isAddingNote ? 'Adding Note...' : 'Add Note'}
          </button>
        </form>
      </div>

      {/* Activity List */}
      <div className="activityList">
        {activityLog.length === 0 ? (
          <p className="noActivitiesMessage">No activity recorded for this loan yet.</p>
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
                  // Use activity._id as key if available and unique, otherwise timestamp or index
                  <tr key={activity._id || activity.createdAt || activity.timestamp}>
                    <td>{formatActivityDate(activity.createdAt || activity.timestamp)}</td> {/* Use createdAt or timestamp */}
                    <td>{activity.recordedBy?.username || 'System'}</td>
                    <td>{activity.action || 'N/A'}</td>
                    <td>{activity.message || activity.details?.description || 'N/A'}</td> {/* Prefer message, fallback to details.description */}
                    <td>
                      {/* Allow deletion only for 'Note Added' activities and by superadmin/admin */}
                      {activity.action === 'Note Added' && hasRole(['superadmin', 'admin']) && (
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
            <p>Are you sure you want to delete this activity log entry?</p>
            <div className="modalActions">
              <button onClick={executeDeleteActivity} className="modalConfirmBtn" disabled={loading}>Yes, Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="modalCancelBtn" disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanActivityLogs;
