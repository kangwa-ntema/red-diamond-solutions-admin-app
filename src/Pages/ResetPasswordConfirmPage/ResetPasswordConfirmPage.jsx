// src/Pages/AuthPages/ResetPasswordConfirmation.jsx
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @component ResetPasswordConfirmation
 * @description Displays a confirmation message after a password reset and provides a link to log in.
 * This component is intended for display to the user once their password has been successfully updated,
 * guiding them to the login page to use their new credentials.
 */
const ResetPasswordConfirmation = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 lg:p-8 font-inter">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl max-w-md w-full text-center border border-gray-200">
                <div className="text-4xl text-green-500 mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-16 h-16 mx-auto"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                    Password Reset Successful!
                </h1>
                <p className="text-gray-600 mb-6 text-base sm:text-lg">
                    Your password has been successfully updated. You can now log in with your new password.
                </p>
                <Link to="/login" className="w-full">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-300 ease-in-out w-full
                        shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                        Go to Login
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default ResetPasswordConfirmation;
