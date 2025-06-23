// src/components/common/ConfirmationModal.jsx
import React from 'react';
import './ConfirmationModal.css'; // You'll need to create this CSS file for styling

/**
 * @component ConfirmationModal
 * @description A reusable modal component for displaying a confirmation prompt to the user.
 * It provides a title, a message, and customizable confirm/cancel buttons.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Callback function to close the modal (e.g., on cancel or clicking outside).
 * @param {function} props.onConfirm - Callback function to execute when the user confirms the action.
 * @param {string} props.title - The title text for the confirmation modal.
 * @param {string} props.message - The main message or question to display to the user.
 * @param {string} [props.confirmText='Confirm'] - Text for the confirmation button.
 * @param {string} [props.cancelText='Cancel'] - Text for the cancel button.
 * @param {boolean} [props.isLoading=false] - Optional prop to indicate a loading state for the confirm button.
 */
const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false // New prop for loading state on confirm button
}) => {
    // If the modal is not open, don't render anything.
    if (!isOpen) return null;

    // Prevents the modal from closing when clicking inside the content area.
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Modal overlay: Covers the entire screen and allows closing the modal by clicking outside the content.
        <div className="confirmationModalOverlay" onClick={onClose}>
            {/* Modal content: The actual dialog box. */}
            <div className="confirmationModalContent" onClick={handleContentClick}>
                <div className="confirmationModalHeader">
                    {/* Title of the confirmation modal. */}
                    <h2 className="confirmationModalTitle">{title}</h2>
                    {/* Close button at the top right of the modal. */}
                    <button className="confirmationModalCloseButton" onClick={onClose} disabled={isLoading}>
                        &times;
                    </button>
                </div>
                <div className="confirmationModalBody">
                    {/* The main message/question for the user. */}
                    <p className="confirmationModalMessage">{message}</p>
                </div>
                <div className="confirmationModalFooter">
                    {/* Cancel button: Closes the modal without performing the action. */}
                    <button
                        className="confirmationModalCancelBtn"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    {/* Confirm button: Performs the action. Disabled during loading. */}
                    <button
                        className="confirmationModalConfirmBtn"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
