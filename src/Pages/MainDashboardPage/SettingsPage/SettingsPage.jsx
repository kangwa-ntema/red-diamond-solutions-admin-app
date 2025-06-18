// src/pages/Settings.js

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext"; // Import useAuth hook
import { toast } from "react-toastify"; // For displaying notifications

import "./Settings.css"; // Import the new CSS file

/**
 * @component Settings
 * @description Provides options for the user to manage their account,
 * such as changing password and logging out.
 */
const Settings = () => {
    const navigate = useNavigate();
    // Destructure the logout function from your AuthContext
    const { logout } = useAuth();

    /**
     * @function handleLogout
     * @description Handles the user logout process by calling the logout function
     * from the AuthContext and redirecting to the login page.
     */
    const handleLogout = async () => {
        try {
            await logout(); // Call the logout function from AuthContext
            toast.success("Logged out successfully!");
            navigate("/"); // Redirect to login page after successful logout
        } catch (err) {
            console.error("Logout failed:", err);
            toast.error(`Logout failed: ${err.message || "Please try again."}`);
            // Even if an error occurs during logout (e.g., network issue after server processed logout),
            // it's often best for UX to still try to redirect, assuming the session is likely invalid.
            navigate("/");
        }
    };

    return (
        <section className="settingsContainer">
            <div className="settingsContent">
                <nav>
                    <ul role="list" className="settingsNavList">
                        <Link to="/mainDashboard">
                            <button className="settingsBackToDashboard">
                                Back to Dashboard
                            </button>
                        </Link>
                    </ul>
                </nav>
                <h1 className="settingsHeadline">Settings</h1>
                <nav className="settingsNav">
                    <ul role="list" className="settingsNavList">
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