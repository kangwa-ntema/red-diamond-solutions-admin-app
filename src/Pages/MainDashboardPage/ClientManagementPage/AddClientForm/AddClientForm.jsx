// src/Pages/MainDashboardPage/ClientManagementPage/AddClientForm/AddClientForm.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addClient } from "../../../../services/api/"; // Corrected import path from clientApi
import "./AddClientForm.css"; // Ensure this CSS file is correctly imported and named
import { toast } from "react-toastify"; // Import toast for consistent notifications

/**
 * @component AddClientForm
 * @description A React component for adding a new client to the system.
 * It handles form input, client creation via API, and navigation.
 * Includes detailed client-side form validation.
 */
const AddClientForm = () => {
    // --- State Management ---
    const [formData, setFormData] = useState({
        firstName: "", // Changed from 'name' to 'firstName'
        lastName: "",  // Added 'lastName'
        email: "",
        phone: "",
        secondaryPhone: "",
        nrc: "",
        address: "",
        dateRegistered: new Date().toISOString().split("T")[0], // Default to current date
    });
    const [loading, setLoading] = useState(false); // Indicates if an API call is in progress
    // State to hold field-specific validation errors
    const [validationErrors, setValidationErrors] = useState({});

    const navigate = useNavigate();

    // --- Validation Logic ---
    /**
     * @function validateForm
     * @description Performs detailed client-side validation on all form fields.
     * @returns {boolean} True if the form data is valid, false otherwise.
     */
    const validateForm = () => {
        let errors = {};
        let isValid = true;

        // First Name Validation:
        // - Required
        // - Minimum length of 2 characters
        // - Only allows letters, spaces, hyphens, and apostrophes
        if (!formData.firstName.trim()) {
            errors.firstName = "First Name is required.";
            isValid = false;
        } else if (formData.firstName.trim().length < 2) {
            errors.firstName = "First Name must be at least 2 characters.";
            isValid = false;
        } else if (!/^[a-zA-Z\s'-]+$/.test(formData.firstName.trim())) {
            errors.firstName = "First Name can only contain letters, spaces, hyphens, and apostrophes.";
            isValid = false;
        }

        // Last Name Validation:
        // - Required
        // - Minimum length of 2 characters
        // - Only allows letters, spaces, hyphens, and apostrophes
        if (!formData.lastName.trim()) {
            errors.lastName = "Last Name is required.";
            isValid = false;
        } else if (formData.lastName.trim().length < 2) {
            errors.lastName = "Last Name must be at least 2 characters.";
            isValid = false;
        } else if (!/^[a-zA-Z\s'-]+$/.test(formData.lastName.trim())) {
            errors.lastName = "Last Name can only contain letters, spaces, hyphens, and apostrophes.";
            isValid = false;
        }

        // Email Validation:
        // - Required
        // - Must follow a basic email format (e.g., user@domain.com)
        if (!formData.email.trim()) {
            errors.email = "Email is required.";
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
            errors.email = "Please enter a valid email address (e.g., example@domain.com).";
            isValid = false;
        }

        // Primary Phone Validation: (Optional field, but validates format if provided)
        // - Allows optional '+' at the beginning, followed by 7 to 15 digits.
        //   This is a general international format. Adjust regex for specific country codes if needed.
        if (formData.phone.trim() && !/^\+?\d{7,15}$/.test(formData.phone.trim())) {
            errors.phone = "Please enter a valid primary phone number (e.g., +260971234567 or 0971234567).";
            isValid = false;
        }

        // Secondary Phone Validation: (Optional field, but validates format if provided)
        // - Same validation as primary phone.
        if (formData.secondaryPhone.trim() && !/^\+?\d{7,15}$/.test(formData.secondaryPhone.trim())) {
            errors.secondaryPhone = "Please enter a valid secondary phone number (e.g., +260971234567 or 0971234567).";
            isValid = false;
        }

        // NRC Validation: (Optional field, but validates format if provided)
        // - Assumes Zambian NRC format: 6 digits / 2 digits / 1 digit (e.g., 123456/01/1)
        if (formData.nrc.trim() && !/^\d{6}\/\d{2}\/\d{1}$/.test(formData.nrc.trim())) {
            errors.nrc = "Please enter a valid NRC format (e.g., 123456/78/1).";
            isValid = false;
        }

        // Date Registered Validation:
        // - Cannot be a future date.
        const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
        if (formData.dateRegistered > today) {
            errors.dateRegistered = "Date Registered cannot be in the future.";
            isValid = false;
        }

        // Set the accumulated errors to state
        setValidationErrors(errors);
        return isValid;
    };

    // --- Event Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
        // Clear the specific error for the field being changed
        if (validationErrors[name]) {
            setValidationErrors((prevErrors) => {
                const newErrors = { ...prevErrors };
                delete newErrors[name]; // Remove the error for this field
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Set loading to true on form submission
        setValidationErrors({}); // Clear all previous validation errors before new submission attempt

        // Perform client-side validation
        if (!validateForm()) {
            // If validation fails, show a generic error toast and stop the submission.
            toast.error("Please correct the errors in the form.");
            setLoading(false); // Ensure loading state is reset
            return;
        }

        try {
            // Use the centralized API call for adding a client from api/index.js.
            // The axiosInstance handles authentication headers automatically.
            const response = await addClient(formData);
            toast.success(response.message || "Client added successfully!"); // Use toast for success message

            // Clear the form fields after successful submission
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                secondaryPhone: "",
                nrc: "",
                address: "",
                dateRegistered: new Date().toISOString().split("T")[0], // Reset to current date
            });

            // Redirect to the clients list page after a short delay to allow toast to be seen
            setTimeout(() => {
                navigate("/clients");
            }, 1500); // 1.5 seconds delay
        } catch (err) {
            console.error("Error adding client:", err);
            // The error thrown from the clientApi will already be a user-friendly message.
            // Display the error using toast.
            toast.error(err.message || "Failed to add client. Please try again.");
        } finally {
            setLoading(false); // Always set loading to false after the API call completes
        }
    };

    // --- Render Logic ---
    return (
        <div className="addClientFormContainer">
            <div className="addClientFormContent">
                <Link to="/clients">
                    <button className="addClientBackLink" disabled={loading}>Back to Clients List</button>
                </Link>
                <h2 className="addClientHeadline">Add New Client</h2>

                <form onSubmit={handleSubmit} className="addClientForm">
                    {/* Form Group: First Name */}
                    <div className="addClientFormGroup">
                        <label htmlFor="firstName">First Name:</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className={`addClientInput ${validationErrors.firstName ? 'input-error' : ''}`}
                            disabled={loading} // Disable during loading
                        />
                        {/* Display specific validation error for First Name */}
                        {validationErrors.firstName && <p className="validationErrorMessage">{validationErrors.firstName}</p>}
                    </div>
                    {/* Form Group: Last Name */}
                    <div className="addClientFormGroup">
                        <label htmlFor="lastName">Last Name:</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            className={`addClientInput ${validationErrors.lastName ? 'input-error' : ''}`}
                            disabled={loading} // Disable during loading
                        />
                        {/* Display specific validation error for Last Name */}
                        {validationErrors.lastName && <p className="validationErrorMessage">{validationErrors.lastName}</p>}
                    </div>
                    {/* Form Group: Email */}
                    <div className="addClientFormGroup">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={`addClientInput ${validationErrors.email ? 'input-error' : ''}`}
                            disabled={loading} // Disable during loading
                        />
                        {/* Display specific validation error for Email */}
                        {validationErrors.email && <p className="validationErrorMessage">{validationErrors.email}</p>}
                    </div>
                    {/* Form Group: Primary Phone */}
                    <div className="addClientFormGroup">
                        <label htmlFor="phone">Primary Phone:</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`addClientInput ${validationErrors.phone ? 'input-error' : ''}`}
                            disabled={loading} // Disable during loading
                        />
                        {/* Display specific validation error for Primary Phone */}
                        {validationErrors.phone && <p className="validationErrorMessage">{validationErrors.phone}</p>}
                    </div>
                    {/* Form Group: Secondary Phone */}
                    <div className="addClientFormGroup">
                        <label htmlFor="secondaryPhone">Secondary Phone:</label>
                        <input
                            type="tel"
                            id="secondaryPhone"
                            name="secondaryPhone"
                            value={formData.secondaryPhone}
                            onChange={handleChange}
                            className={`addClientInput ${validationErrors.secondaryPhone ? 'input-error' : ''}`}
                            disabled={loading} // Disable during loading
                        />
                        {/* Display specific validation error for Secondary Phone */}
                        {validationErrors.secondaryPhone && <p className="validationErrorMessage">{validationErrors.secondaryPhone}</p>}
                    </div>
                    {/* Form Group: NRC */}
                    <div className="addClientFormGroup">
                        <label htmlFor="nrc">NRC:</label>
                        <input
                            type="text"
                            id="nrc"
                            name="nrc"
                            value={formData.nrc}
                            onChange={handleChange}
                            className={`addClientInput ${validationErrors.nrc ? 'input-error' : ''}`}
                            disabled={loading} // Disable during loading
                        />
                        {/* Display specific validation error for NRC */}
                        {validationErrors.nrc && <p className="validationErrorMessage">{validationErrors.nrc}</p>}
                    </div>
                    {/* Form Group: Address */}
                    <div className="addClientFormGroup">
                        <label htmlFor="address">Address:</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="3"
                            className="addClientTextarea"
                            disabled={loading} // Disable during loading
                        ></textarea>
                        {/* No specific validation error for address added, but you can add min/max length if needed */}
                    </div>
                    {/* Form Group: Date Registered */}
                    <div className="addClientFormGroup">
                        <label htmlFor="dateRegistered">Date Registered:</label>
                        <input
                            type="date"
                            id="dateRegistered"
                            name="dateRegistered"
                            value={formData.dateRegistered}
                            onChange={handleChange}
                            className={`addClientInput ${validationErrors.dateRegistered ? 'input-error' : ''}`}
                            disabled={loading} // Disable during loading
                        />
                        {/* Display specific validation error for Date Registered */}
                        {validationErrors.dateRegistered && <p className="validationErrorMessage">{validationErrors.dateRegistered}</p>}
                    </div>
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading} // Disable button while loading
                        className="addClientSubmitBtn"
                    >
                        {loading ? "Adding..." : "Add Client"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddClientForm;
