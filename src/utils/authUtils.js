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
};