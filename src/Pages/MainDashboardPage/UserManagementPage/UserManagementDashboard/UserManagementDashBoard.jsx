// src/Pages/MainDashboardPage/UserManagementPage/UserManagementDashboard/UserManagementDashBoard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getAllUsers, deleteUser } from "../../../../services/api/";
import { useAuth } from "../../../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import './UserManagementDashboard.css';

const UserManagementDashboard = () => {
    const { user: currentUser, hasRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [overallSummary, setOverallSummary] = useState({});
    const [roleFilter, setRoleFilter] = useState("all");
    const [isActiveFilter, setIsActiveFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    // FIX: Initialize modalMessage to an empty string
    const [modalMessage, setModalMessage] = useState('');


    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = {};
            if (roleFilter !== "all") {
                filters.role = roleFilter;
            }
            if (isActiveFilter !== "all") {
                filters.isActive = isActiveFilter === "true";
            }
            const data = await getAllUsers(filters);

            // Debugging logs from previous interactions
            console.log("Raw data received from getAllUsers API:", data);
            if (data && data.users) {
                console.log("Users array from API:", data.users.map(u => ({ _id: u._id, username: u.username })));
            } else {
                console.log("Data or data.users is null/undefined from API.");
            }

            setUsers(data.users);
            setOverallSummary(data.overallSummary);
        } catch (err) {
            setError(err.message || "Failed to fetch users.");
            console.error("Error fetching users in UserManagementDashboard:", err);
        } finally {
            setLoading(false);
        }
    }, [roleFilter, isActiveFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const confirmDelete = (userId) => {
        // --- NEW DEBUGGING LOG START ---
        console.log("confirmDelete called!");
        console.log("User to delete ID (userId):", userId);
        console.log("Current logged-in user ID (currentUser?._id):", currentUser?._id);
        console.log("Are IDs the same (currentUser?._id === userId)?", currentUser?._id === userId);
        // --- NEW DEBUGGING LOG END ---

        if (currentUser && currentUser._id === userId) {
            toast.error("You cannot delete your own user account from here.");
            return;
        }
        setUserToDelete(userId);
        // FIX: Set the modal message when triggering the modal
        setModalMessage(`Are you sure you want to delete this user? This action cannot be undone.`);
        setShowConfirmModal(true);
    };

    const executeDelete = async () => {
        setShowConfirmModal(false);
        if (!userToDelete) return;

        try {
            await deleteUser(userToDelete);
            toast.success("User deleted successfully!");
            fetchUsers();
        } catch (err) {
            toast.error(`Failed to delete user: ${err.message || 'Network error'}`);
            console.error("Error deleting user:", err);
        } finally {
            setUserToDelete(null);
        }
    };

    if (loading)
        return (
            <div className="usersDashboardContainer">
                <div className="usersMessage">Loading users...</div>
            </div>
        );
    if (error)
        return (
            <div className="usersDashboardContainer">
                <div className="usersErrorMessage">Error: {error}</div>
            </div>
        );

    return (
        <div className="usersDashboardContainer">
            <Link to="/mainDashboard">
                <button className="usersDashboardBackLink">
                    Back to Main Dashboard
                </button>
            </Link>
            <h2 className="usersDashboardHeadline">USER MANAGEMENT</h2>
            <h2 className="usersDashboardSubHeadline">SUMMARY</h2>

            <div className="usersDashboard">
                <div className="usersDashboardPanelContainer">
                    {hasRole(["superadmin"]) && (
                        <Link to="/users/register">
                            <button className="registerNewUserBtn">+ Register New User</button>
                        </Link>
                    )}
                    <div className="usersDashboardPanel">
                        <section className="userSummarySection">
                            <div className="userSummaryCards">
                                <div className="userSummaryCard">
                                    <h3 className="userSummaryCardTitle">Total Users:</h3>
                                    <p className="userSummaryCardValue">
                                        {overallSummary.totalUsers || 0}
                                    </p>
                                </div>
                                <div className="userSummaryCard">
                                    <h3 className="userSummaryCardTitle">Superadmins:</h3>
                                    <p className="userSummaryCardValue">
                                        {overallSummary.superadmins || 0}
                                    </p>
                                </div>
                                <div className="userSummaryCard">
                                    <h3 className="userSummaryCardTitle">Admins:</h3>
                                    <p className="userSummaryCardValue">
                                        {overallSummary.admins || 0}
                                    </p>
                                </div>
                                <div className="userSummaryCard">
                                    <h3 className="userSummaryCardTitle">Employees:</h3>
                                    <p className="userSummaryCardValue">
                                        {overallSummary.employees || 0}
                                    </p>
                                </div>
                                <div className="userSummaryCard">
                                    <h3 className="userSummaryCardTitle">Clients:</h3>
                                    <p className="userSummaryCardValue">
                                        {overallSummary.clients || 0}
                                    </p>
                                </div>
                                <div className="userSummaryCard">
                                    <h3 className="userSummaryCardTitle">Active Users:</h3>
                                    <p className="userSummaryCardValue">
                                        {overallSummary.activeUsers || 0}
                                    </p>
                                </div>
                                <div className="userSummaryCard">
                                    <h3 className="userSummaryCardTitle">Inactive Users:</h3>
                                    <p className="userSummaryCardValue">
                                        {overallSummary.inactiveUsers || 0}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="userDashboardContentContainer">
                    <div className="DashboardPanelFilter">
                        <h3 className="usersFilterBtnHeadline">Filters</h3>
                        <div className="usersFilterButtons">
                            <div className="usersFilterButton">
                                <label className="usersFilterBtnSubHeadline">
                                    Filter by Role:
                                </label>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="usersFilterSelect"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="superadmin">Superadmin</option>
                                    <option value="admin">Admin</option>
                                    <option value="employee">Employee</option>
                                    {/* <option value="client">Client</option> */}
                                </select>
                            </div>
                            <div className="usersFilterButton">
                                <label className="usersFilterBtnSubHeadline">
                                    Filter by Status:
                                </label>
                                <select
                                    value={isActiveFilter}
                                    onChange={(e) => setIsActiveFilter(e.target.value)}
                                    className="usersFilterSelect"
                                >
                                    <option value="all">All</option>
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="userDashboardContent">
                        <section className="userListSection">
                            <h3 className="usersListHeadline">All Users List</h3>
                            {users.length === 0 ? (
                                <p className="usersNoDataMessage">No users found matching the current filters.</p>
                            ) : (
                                <div className="usersTableContainer">
                                    <table className="usersTable">
                                        <thead className="usersTableHead">
                                            <tr>
                                                <th>Username</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>First Name</th>
                                                <th>Last Name</th>
                                                <th>Email</th>
                                                <th>Employee ID</th>
                                                <th>Created By</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => {
                                                console.log(`Rendering user with _id: ${user._id}, username: ${user.username}`);
                                                return (
                                                    <tr key={user._id}>
                                                        <td>{user.username}</td>
                                                        <td>{user.role}</td>
                                                        <td>{user.isActive ? "Active" : "Inactive"}</td>
                                                        <td>{user.firstName || "N/A"}</td>
                                                        <td>{user.lastName || "N/A"}</td>
                                                        <td>{user.email || "N/A"}</td>
                                                        <td>{user.employeeId || "N/A"}</td>
                                                        <td>
                                                            {user.createdBy
                                                                ? (user.createdBy.username || user.createdBy.id || 'N/A')
                                                                : 'N/A'}
                                                        </td>
                                                        <td>
                                                            {hasRole(["superadmin", "admin"]) && (
                                                                <>
                                                                    <Link to={`/users/${user._id}`}>
                                                                        <button className="viewUserDetailsLink">Details</button>
                                                                    </Link>
                                                                    {(currentUser && currentUser._id !== user._id) && (
                                                                        <>
                                                                            <Link to={`/users/${user._id}/edit`}>
                                                                                <button className="editUserBtn">Edit</button>
                                                                            </Link>
                                                                            {hasRole(["superadmin"]) && (
                                                                                <button
                                                                                    className="deleteUserBtn"
                                                                                    onClick={() => confirmDelete(user._id)}
                                                                                    disabled={loading}
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            )}
                                                                            <Link to={`/users/${user._id}/change-password`}>
                                                                                <button className="changeUserPasswordBtn">Change Password</button>
                                                                            </Link>
                                                                        </>
                                                                    )}
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <h3>Confirm Action</h3>
                        <p>{modalMessage}</p>
                        <div className="modalActions">
                            <button onClick={executeDelete} className="modalConfirmBtn">Yes, Delete</button>
                            <button onClick={() => setShowConfirmModal(false)} className="modalCancelBtn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementDashboard;
