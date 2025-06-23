// src/components/LoginForm.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from 'lucide-react'; // Import Eye icons for password toggle
import "./LoginForm.css"; // Ensure this CSS file is correctly imported and named for login

/**
 * @component LoginForm
 * @description A React component for user login. It uses the AuthContext to handle authentication.
 * Includes show/hide password functionality.
 */
const LoginForm = () => {
    // State to store form input values
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    // State for loading indicator during API call
    const [loading, setLoading] = useState(false);
    // State for displaying error messages
    const [error, setError] = useState(null);

    // State for showing/hiding password
    const [showPassword, setShowPassword] = useState(false);

    // Access login function from AuthContext
    const { login } = useAuth();
    // Hook for programmatic navigation
    const navigate = useNavigate();

    /**
     * @function handleSubmit
     * @description Handles the form submission for user login.
     * Prevents default form submission, calls the login function from AuthContext,
     * and redirects on success or displays an error on failure.
     * @param {Event} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setError(null); // Clear any previous errors
        setLoading(true); // Set loading state to true

        try {
            await login(username, password); // Call the login function from AuthContext
            navigate("/mainDashboard"); // Redirect to your main dashboard on successful login
        } catch (err) {
            // Error handling: Update error state with message from AuthContext/API
            setError(err.message || "An unknown error occurred. Please try again.");
            console.error("Login attempt failed:", err);
        } finally {
            setLoading(false); // Set loading state to false
        }
    };

    return (
        <div className="loginFormContainer">
            <Link to="/">
                <button className="backHomeBtn">Landing Page</button>
            </Link>

            <form onSubmit={handleSubmit} className="loginForm">
                <h1 className="loginInHeadline">Login</h1>
                <div className="loginInFormElement">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading} // Disable input while loading
                    />
                </div>
                <div className="loginInFormElement">
                    <label htmlFor="password">Password:</label>
                    <div className="password-input-wrapper"> {/* Wrapper for input and icon */}
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading} // Disable input while loading
                        />
                        <span
                            className="password-toggle-icon"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </span>
                    </div>
                </div>
                {/* Display error message if present */}
                {error && <p className="errorMessage">{error}</p>}
                <button type="submit" disabled={loading} className="logInBtn">
                    {loading ? "Logging in..." : "Login"}
                </button>
                <div className="loginLinks">
                    {/* <p>
                        <Link to="/changePasswordForm">Forgot Password?</Link>{" "}
                    </p> */}
                    {/* <p>
                        Don't have an account? <Link to="/register">Register</Link>
                    </p> */}
                </div>
            </form>
        </div>
    );
};

export default LoginForm;
