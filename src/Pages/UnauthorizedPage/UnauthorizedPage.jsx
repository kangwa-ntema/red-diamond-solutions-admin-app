import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
    return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '50px auto', textAlign: 'center', border: '1px solid #ffcccc', borderRadius: '8px', backgroundColor: '#fff0f0', color: '#cc0000', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '2em', marginBottom: '20px', color: '#cc0000' }}>Access Denied!</h2>
            <p style={{ fontSize: '1.1em', marginBottom: '30px' }}>You do not have the necessary permissions to view this page.</p>
            <Link to="/mainDashboard" style={{ display: 'inline-block', padding: '12px 25px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px', fontSize: '1em', transition: 'background-color 0.3s ease' }}>Go to Dashboard</Link>
        </div>
    );
};

export default UnauthorizedPage;