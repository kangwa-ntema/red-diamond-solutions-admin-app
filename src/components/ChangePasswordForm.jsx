import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ChangePasswordForm.css"; // You can create this CSS file later

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
        setError("New password and confirmation do not match.");
        setLoading(false);
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/admin/change-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // Important for sending the JWT cookie
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (response.ok) {
            // No need to call response.json() here if backend sends 204 No Content or a success message without a JSON body
            setSuccess(
                "Password changed successfully! You will be redirected to login."
            );
            // Optional: force logout after password change for security
            setTimeout(() => {
                navigate("/loginform");
            }, 2000);
        } else {
            // --- MODIFIED ERROR HANDLING STARTS HERE ---
            const errorText = await response.text(); // Always read response as text first
            let errorMessage = "Failed to change password."; // Default error message

            try {
                // Attempt to parse the text as JSON
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage; // Use backend message if available
            } catch (jsonParseError) {
                // If it's not JSON (e.g., empty body, plain text), use the raw text if meaningful
                if (errorText) {
                    errorMessage = errorText;
                }
            }

            // Specific handling for 401/403 or other statuses
            if (response.status === 401 || response.status === 403) {
                setError(errorMessage || "Authentication required. Please log in.");
                navigate("/loginform"); // Redirect to login on auth failure
            } else {
                setError(errorMessage); // Set the specific error message
            }
            // --- MODIFIED ERROR HANDLING ENDS HERE ---
        }
    } catch (err) {
        console.error("Error changing password:", err);
        setError("Network error or server unavailable.");
    } finally {
        setLoading(false);
    }
};

  return (
    <div className="change-password-container">
      <Link to="/dashboard"> {"<"} Back to dashboard</Link>
      <h1>Change Password</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password:</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmNewPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Changing..." : "Change Password"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </form>
    </div>
  );
};

export default ChangePasswordForm;
