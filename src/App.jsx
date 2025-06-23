import "./App.css";
import React, { useEffect } from "react";
import {
    Routes,
    Route,
    NavLink,
    Navigate,
    useNavigate,
} from "react-router-dom";

// NEW: Import AuthProvider and PrivateRoute
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { setNavigationFunction } from "./services/axiosInstance";

// Your existing imports for components
import LandingPage from "./Pages/LandingPage/LandingPage";
import LoginForm from "./Pages/LoginForm/LoginForm";
import MainDashboardPage from "./Pages/MainDashboardPage/MainDashboardPage";

/* USER MANAGEMENT */
import UserManagementDashboard from "./Pages/MainDashboardPage/UserManagementPage/UserManagementDashboard/UserManagementDashboard.jsx";
import RegisterUserPage from "./Pages/MainDashboardPage/UserManagementPage/RegisterUserForm/RegisterUserForm";
import UserEditPage from "./Pages/MainDashboardPage/UserManagementPage/UserEditForm/UserEditForm";
import ViewUserPage from "./Pages/MainDashboardPage/UserManagementPage/ViewUserPage/ViewUserPage.jsx";
import UserActivityLogs from "./Pages/MainDashboardPage/UserManagementPage/UserActivityLog/UserActivityLog.jsx";
import ForgotPasswordForm from "./Pages/ForgotPasswordPage/ForgotPasswordForm.jsx";

import AdminChangePasswordPage from "./Pages/MainDashboardPage/UserManagementPage/AdminChangePasswordPage/AdminChangePasswordPage.jsx";
import ChangeMyPasswordPage from "./Pages/MainDashboardPage/UserManagementPage/ChangeMyPasswordPage/ChangeMyPasswordPage";
import UnauthorizedPage from "./Pages/UnauthorizedPage/UnauthorizedPage";
import NotFoundPage from "./Pages/PageNotFound/PageNotFound";

/* CLIENTS */
import ClientManagementDashboard from "./Pages/MainDashboardPage/ClientManagementPage/ClientManagementDashboard/ClientManagementDashboard.jsx";
import AddClientForm from "./Pages/MainDashboardPage/ClientManagementPage/AddClientForm/AddClientForm";
import ViewClientPage from "./Pages/MainDashboardPage/ClientManagementPage/ViewClientPage/ViewClientPage";
import EditClientForm from "./Pages/MainDashboardPage/ClientManagementPage/EditClientForm/EditClientForm";
import ClientActivityLog from "./Pages/MainDashboardPage/ClientManagementPage/ClientActivityLog/ClientActivityLog.jsx";

/* LOANS */
import LoansManagementDashboard from "./Pages/MainDashboardPage/LoansManagementPage/LoanManagementDashboard/LoanManagementDashboard.jsx";
import AddLoanForm from "./Pages/MainDashboardPage/LoansManagementPage/AddLoanForm/AddLoanForm.jsx";
import ViewLoanPage from "./Pages/MainDashboardPage/LoansManagementPage/ViewLoanPage/ViewLoanPage.jsx";
import EditLoanForm from "./Pages/MainDashboardPage/LoansManagementPage/EditLoanForm/EditLoanForm.jsx";
import LoanActivityLogs from "./Pages/MainDashboardPage/LoansManagementPage/LoanActivityLogs/LoanActivityLogs.jsx"; // NEW: Import LoanActivityLogPage

/* ACCOUNTING */
import AccountingManagementDashboard from "./Pages/MainDashboardPage/AccountingManagementPage/AccountingManagementDashboard/AccountingManagementDashboard.jsx";
import COADashboard from "./Pages/MainDashboardPage/AccountingManagementPage/COAPage/COADashboard.jsx";
import JournalEntriesListPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/JournalEntriesListPage.jsx";
import AddJournalEntryPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/AddJournalEntryPage/AddJournalEntryPage.jsx";
import ViewJournalEntryPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/ViewJournalEntryPage/ViewJournalEntryPage.jsx";
import EditJournalEntryPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/EditJournalEntryPage/EditJournalEntryPage.jsx";
import GeneralLedgerPage from "./Pages/MainDashboardPage/AccountingManagementPage/GeneralLedgerPage/GeneralLedgerPage.jsx";
import TrialBalancePage from "./Pages/MainDashboardPage/AccountingManagementPage/TrialBalancePage/TrialBalancePage.jsx";
import IncomeStatementPage from "./Pages/MainDashboardPage/AccountingManagementPage/IncomeStatementPage/IncomeStatementPage.jsx";
import BalanceSheetPage from "./Pages/MainDashboardPage/AccountingManagementPage/BalanceSheetPage/BalanceSheetPage.jsx";
import AccountActivityLog from "./Pages/MainDashboardPage/AccountingManagementPage/COAPage/AccountActivityLog/AccountActivityLog.jsx";
import JournalEntryActivityLog from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/JournalEntryActivityLog/JournalEntryActivityLog.jsx"; // NEW: Import JournalEntryActivityLog

/* IMAGES */
import PrimaryNavLogo from "./assets/logo-images/red-diamond-primary-logo-white-typeface.png";

/* COMPONENTS */
import ScrollToTop from "./components/scrollToTop/ScrollToTop";

/* SETTINGS COMPONENTS */
import SettingsPage from "./Pages/MainDashboardPage/SettingsPage/SettingsPage";

function App() {
    const navigate = useNavigate();

    useEffect(() => {
        setNavigationFunction(navigate);
    }, [navigate]);

    return (
        <AuthProvider>
            <ScrollToTop />
            <div className="appContainer">
                <div className="appPrimaryNavbarContainer">
                    <header className="appPrimaryNavbar">
                        <div className="primaryNavLogoContainer">
                            <span>
                                <img
                                    src={PrimaryNavLogo}
                                    alt="Red Diamond Solutions Logo"
                                    className="primaryNavLogo"
                                />
                            </span>
                            <span className="appPrimaryNavbarHeadline">
                                <h1>Management Portal.</h1>
                            </span>
                        </div>
                    </header>
                </div>
                <div className="outletSection">
                    <Routes>
                        {/* Public Routes - Accessible without login */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/loginForm" element={<LoginForm />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        {/* General Protected Routes: Accessible by any logged-in user */}
                        <Route element={<PrivateRoute />}>
                            <Route path="/mainDashboard" element={<MainDashboardPage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route
                                path="/changePasswordForm"
                                element={<ChangeMyPasswordPage />}
                            />
                            <Route path="/forgotPassword" element={<ForgotPasswordForm />} />
                        </Route>

                        {/* Admin & Superadmin Protected Routes: Only accessible by users with 'superadmin' or 'admin' roles */}
                        <Route
                            element={
                                <PrivateRoute allowedRoles={["superadmin", "admin"]} />
                            }
                        >
                            {/* User Management (excluding register, which is superadmin only) */}
                            <Route path="/users" element={<UserManagementDashboard />} />
                            <Route path="/users/:id/edit" element={<UserEditPage />} />
                            <Route path="/users/:id" element={<ViewUserPage />} />
                            <Route
                                path="/users/:id/change-password"
                                element={<AdminChangePasswordPage />}
                            />
                            <Route path="/users/:id/user-activity-logs" element={<UserActivityLogs />} />

                            {/* Client Management (Dashboards & Forms) - Now accessible to Admin+ */}
                            <Route path="/clients" element={<ClientManagementDashboard />} />
                            <Route path="/clients/add" element={<AddClientForm />} />
                            <Route path="/clients/:id" element={<ViewClientPage />} />
                            <Route path="/clients/edit/:id" element={<EditClientForm />} />
                            <Route path="/clients/:id/client-activity" element={<ClientActivityLog />} />

                            {/* Loans Management (Dashboards & Forms) - Now accessible to Admin+ */}
                            <Route path="/loans" element={<LoansManagementDashboard />} />
                            <Route path="/loans/add" element={<AddLoanForm />} />
                            <Route path="/loans/:id" element={<ViewLoanPage />} />
                            <Route path="/loans/edit/:id" element={<EditLoanForm />} />
                            {/* NEW ROUTE: Loan Activity Log Page */}
                            <Route path="/loans/:id/loan-activity-logs" element={<LoanActivityLogs />} />

                            {/* Accounting Module Routes - Grouped under /accounting */}
                            <Route path="/accounting">
                                {/* Accounting Dashboard: Now available under /accounting to Admin+ */}
                                <Route index element={<AccountingManagementDashboard />} />

                                {/* Changed path to "accounts" for COADashboard for consistency */}
                                <Route path="accounts" element={<COADashboard />} />
                                {/* Account Activity Log */}
                                <Route path="accounts/:id/activity-logs" element={<AccountActivityLog />} />
                            
                                {/* Journal Entries - Nested for clear paths */}
                                <Route path="journal-entries">
                                    <Route index element={<JournalEntriesListPage />} />
                                    <Route path="add" element={<AddJournalEntryPage />} />
                                    <Route path="edit/:id" element={<EditJournalEntryPage />} />
                                    <Route path=":id" element={<ViewJournalEntryPage />} />
                                    {/* NEW ROUTE: Journal Entry Activity Log */}
                                    <Route path=":id/activity-logs" element={<JournalEntryActivityLog />} />
                                </Route>

                                <Route path="general-ledger" element={<GeneralLedgerPage />} />

                                {/* Financial Reports - Grouped under /accounting/reports */}
                                <Route path="reports">
                                    <Route index element={<TrialBalancePage />} />
                                    <Route path="income-statement" element={<IncomeStatementPage />} />
                                    <Route path="balance-sheet" element={<BalanceSheetPage />} />
                                </Route>
                            </Route>

                        </Route>

                        {/* Superadmin-Only Protected Routes */}
                        <Route element={<PrivateRoute allowedRoles={["superadmin"]} />}>
                            <Route path="/users/register" element={<RegisterUserPage />} />
                        </Route>

                        {/* Catch-all for any undefined routes */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </div>
                <footer className="appFooter">
                    <p className="appFooterCopyright">
                        Red Diamond Solutions &copy; 2025
                    </p>
                </footer>
            </div>
        </AuthProvider>
    );
}

export default App;
