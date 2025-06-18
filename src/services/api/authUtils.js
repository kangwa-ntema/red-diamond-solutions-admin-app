// --- Helper function for consistent error handling ---
export const handleApiError = (error, defaultMessage) => {
    if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
    }
    if (error.message) {
        throw new Error(error.message);
    }
    throw new Error(defaultMessage);
};