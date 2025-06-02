import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Settings.css'; // Import the new CSS file

const Settings = () => {
  const navigate = useNavigate();

  // The handleLogout function is moved here, as it's directly related to the logout button
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "GET",
        credentials: "include", // Ensure this sends cookies to clear the token
      });

      if (response.ok) {
        navigate("/"); // Redirect to login page after successful logout
      } else {
        const errorData = await response.json();
        console.error(
          "Logout failed:",
          errorData.message || "Server error during logout."
        );
        // Even if backend reports an error, for UX, still redirect to login
        navigate("/loginform");
      }
    } catch (err) {
      console.error("Network error during logout:", err);
      // For network errors, still attempt to redirect
      navigate('/loginform');
    }
  };

  return (
    <section className="settingsContainer">
      <div className="settingsContent">
        <nav>
          <ul role='list' className="settingsNavList">
            <li className="settingsNavLink">
              <Link to="/dashboard">{"<"} Back to Dashboard</Link>
            </li>
          </ul>
        </nav>
        <h1 className="settingsHeadline">Settings</h1>
        <nav className="settingsNav">
          <ul role='list' className="settingsNavList">
            <li className="settingsNavLink">
              <Link to="/changePasswordForm">Change Password</Link>
            </li>
            <li className="settingsNavLink">
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </section>
  );
};

export default Settings;
