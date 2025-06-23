// src/Pages/LoginForm/ForgotPasswordForm/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../../services/api/authApi'; // Import the forgotPassword API call
import './ForgotPasswordForm.css'; // Ensure you create this CSS file for styling

/**
 * @component ForgotPasswordForm
 * @description A React component for handling the "Forgot Password" functionality.
 * It allows users to submit their email to receive a password reset link.
 */
const ForgotPasswordForm = () => {
    // State to store the email input value
    const [email, setEmail] = useState('');
    // State for loading indicator during API call
    const [loading, setLoading] = useState(false);
    // State for displaying success messages
    const [successMessage, setSuccessMessage] = useState(null);
    // State for displaying error messages
    const [errorMessage, setErrorMessage] = useState(null);

    const navigate = useNavigate();

    /**
     * @function handleSubmit
     * @description Handles the form submission for requesting a password reset.
     * Prevents default form submission, calls the forgotPassword API,
     * and displays success or error messages.
     * @param {Event} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setSuccessMessage(null); // Clear any previous success messages
        setErrorMessage(null); // Clear any previous error messages
        setLoading(true); // Set loading state to true

        try {
            // Call the forgotPassword API with the provided email
            const response = await forgotPassword(email);
            setSuccessMessage(response.message || "If an account with that email exists, a password reset link has been sent.");
            setEmail(''); // Clear the email field on success
        } catch (err) {
            // Error handling: Update error state with message from API
            setErrorMessage(err.message || "Failed to send password reset email. Please try again.");
            console.error("Forgot password request failed:", err);
        } finally {
            setLoading(false); // Set loading state to false
        }
    };

    return (
        <div className="forgotPasswordFormContainer">
            <Link to="/loginForm">
                <button className="backToLoginBtn">Back to Login</button>
            </Link>

            <form onSubmit={handleSubmit} className="forgotPasswordForm">
                <h1 className="forgotPasswordHeadline">Forgot Password</h1>
                <p className="forgotPasswordInstructions">
                    Enter your email address below to receive a password reset link.
                </p>
                <div className="formElement">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading} // Disable input while loading
                    />
                </div>

                {/* Display messages */}
                {successMessage && <p className="successMessage">{successMessage}</p>}
                {errorMessage && <p className="errorMessage">{errorMessage}</p>}

                <button type="submit" disabled={loading} className="sendResetLinkBtn">
                    {loading ? "Sending..." : "Send Reset Link"}
                </button>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
