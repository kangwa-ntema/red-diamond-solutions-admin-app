// src/pages/MainDashboard.js
// You already have MainDashboard.js. You can adapt MainDashboard.js
// to use the useAuth hook for logout and conditional rendering based on user role.
// For now, this is a placeholder to ensure the route works.
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./MainDashboard.css";
const MainDashboard = () => {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();



  if (loading) return <div>Loading user data...</div>;
  // PrivateRoute should handle unauthenticated users, so this check is mostly defensive
  if (!user) return <Navigate to="/loginForm" replace />;

  return (
    <div className="mainDashboardContainer">
      <div className="mainDashboardContent">
        <h2 className="mainDashboardHeadline">Welcome, {user.username}!</h2>
        <p>
          Your Role: <strong>{user.role}</strong>
        </p>
        <p>User ID: {user.id}</p>

        <h3>Management Links:</h3>
        <nav className="mainDashboardNav">
          <ul className="mainDashboardNavList">
            
            {/* Conditional rendering based on roles */}
            {hasRole(["superadmin", "admin"]) && (
              <li className="mainDashboardNavLink" >
                <Link to="/users">User Management</Link>
              </li>
            )}
            {/* Add links to your other dashboards */}
            <li className="mainDashboardNavLink" >
              <Link to="/clients">Client Management</Link>
            </li>
            <li className="mainDashboardNavLink" >
              <Link to="/loans">Loans Management</Link>
            </li>
            <li className="mainDashboardNavLink" >
              <Link to="/transactions">Accounting Dashboard</Link>
            </li>
            <li className="mainDashboardNavLink" >
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </nav>

      </div>
    </div>
  );
};

export default MainDashboard;
