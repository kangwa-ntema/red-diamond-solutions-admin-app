import { jwtDecode } from "jwt-decode"; // Make sure to install this library: npm install jwt-decode

// Function to get the token from localStorage
export const getToken = () => {
    return localStorage.getItem('jwtToken');
};

// Function to store token and user info after login
export const setAuthData = (token, userInfo) => {
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
};

// Function to clear token and user info on logout
export const clearAuthData = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userInfo');
    // Also clear any stored role if you store it separately
    localStorage.removeItem('userRole');
};

// Function to decode JWT and get user role
export const getUserRoleFromToken = (token) => {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // Assuming your JWT payload has a 'user' object with a 'role' property (e.g., { user: { role: 'admin' } })
        // If your JWT payload has the role directly (e.g., { role: 'admin' }), use `decoded.role`
        return decoded.user?.role || decoded.role;
    } catch (error) {
        console.error("Error decoding token:", error);
        return null;
    }
};
