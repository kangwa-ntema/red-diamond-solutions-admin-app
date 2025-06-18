// src/pages/UserManagementDashboard.js
import React, { useState, useEffect } from "react";
import { getAllUsers, deleteUser } from "../../../../services/api";
import { useAuth } from "../../../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./UserManagementDashboard.css";

const UserManagementDashboard = () => {
  const { user: currentUser, hasRole } = useAuth(); // Get current logged-in user and role checker
  const [users, setUsers] = useState([]);
  const [overallSummary, setOverallSummary] = useState({});
  const [roleFilter, setRoleFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all"); // 'all', 'true', 'false'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (roleFilter !== "all") {
        filters.role = roleFilter;
      }
      if (isActiveFilter !== "all") {
        filters.isActive = isActiveFilter; // Send as boolean
      }
      const data = await getAllUsers(filters);
      setUsers(data.users);
      setOverallSummary(data.overallSummary);
    } catch (err) {
      setError(err || "Failed to fetch users.");
      console.error("Error fetching users:", err);
      // If 401/403, it means session expired or unauthorized. AuthContext should handle logout redirect.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, isActiveFilter]); // Re-fetch when filters change

  const handleDelete = async (userId) => {
    // Prevent a superadmin from deleting themselves
    if (currentUser && currentUser.id === userId) {
      alert("You cannot delete your own user account from here.");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await deleteUser(userId);
        alert("User deleted successfully!");
        fetchUsers(); // Refresh the list
      } catch (err) {
        alert(`Failed to delete user: ${err}`);
        console.error("Error deleting user:", err);
      }
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Loading users...
      </div>
    );
  if (error)
    return (
      <div style={{ color: "red", textAlign: "center", padding: "50px" }}>
        Error: {error}
      </div>
    );

  return (
    <div className="usersDashboardContainer">
      <Link to="/mainDashboard">
        <button className="usersDashboardBackLink">
          {" "}
          {/* Button styled as a back link (updated class) */}
          Back to Main Dashboard
        </button>
      </Link>
      <h2 className="usersDashboardHeading">User Management Dashboard</h2>

      <div className="usersDashboard">
        <div className="usersDashboardPanel">
          <div className="">
            <h3 className="usersDashboardHeadline">Overall User Summary</h3>
            <p>
              <strong>Total Users:</strong> {overallSummary.totalUsers || 0}
            </p>
            <p>
              <strong>Superadmins:</strong> {overallSummary.superadmins || 0}
            </p>
            <p>
              <strong>Admins:</strong> {overallSummary.admins || 0}
            </p>
            <p>
              <strong>Employees:</strong> {overallSummary.employees || 0}
            </p>
            <p>
              <strong>Clients:</strong> {overallSummary.clients || 0}
            </p>
            <p>
              <strong>Active Users:</strong> {overallSummary.activeUsers || 0}
            </p>
            <p>
              <strong>Inactive Users:</strong>{" "}
              {overallSummary.inactiveUsers || 0}
            </p>
          </div>
          <div>
            <h3>Filters</h3>
            <div>
              <label>Filter by Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div>
              <label>Filter by Status:</label>
              <select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Render "Register New User" button only if current user is superadmin */}
      {hasRole(["superadmin"]) && (
        <Link
          to="/users/register"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            textDecoration: "none",
            borderRadius: "5px",
            fontSize: "1em",
          }}
        >
          Register New User
        </Link>
      )}

      <h3>All Users List</h3>
      {users.length === 0 ? (
        <p>No users found matching the current filters.</p>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Employee ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? "Active" : "Inactive"}</td>
                  <td>{user.firstName || "N/A"}</td>
                  <td>{user.lastName || "N/A"}</td>
                  <td>{user.email || "N/A"}</td>
                  <td>{user.employeeId || "N/A"}</td>
                  <td>
                    {hasRole(["superadmin", "admin"]) && (
                      <>
                        <Link to={`/users/${user._id}/edit`}>
                          <button>Edit</button>
                        </Link>
                        <Link to={`/users/${user._id}/change-password`}>
                          <button>Reset Pass</button>
                        </Link>
                      </>
                    )}
                    {hasRole(["superadmin"]) &&
                      currentUser._id !== user._id && (
                        <button onClick={() => handleDelete(user._id)}>
                          Delete
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagementDashboard;
