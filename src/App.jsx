// src/App.js
import "./App.css";
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom"; // Import Navigate

// NEW: Import AuthProvider and PrivateRoute
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute.jsx";

// Your existing imports for components
import LandingPage from "./Pages/LandingPage/LandingPage";
import LoginForm from "./Pages/LoginForm/LoginForm"; // We will modify this component
import MainDashboardPage from "./Pages/MainDashboardPage/MainDashboardPage";

/* USER MANAGEMENT */
import UserManagementPage from "./Pages/MainDashboardPage/UserManagementPage/UserManagementDashboard/UserManagementDashBoard";
import RegisterUserPage from "./Pages/MainDashboardPage/UserManagementPage/RegisterUserForm/RegisterUserForm";
import UserEditPage from "./Pages/MainDashboardPage/UserManagementPage/UserEditForm/UserEditForm";
import AdminChangePasswordPage from "./Pages/MainDashboardPage/MainDashboardPage";
import ChangeMyPasswordPage from "./Pages/MainDashboardPage/UserManagementPage/ChangeMyPasswordPage/ChangeMyPasswordPage"; // For a logged-in user to change their own password
import UnauthorizedPage from "./Pages/UnauthorizedPage/UnauthorizedPage"; // NEW: For unauthorized access
import NotFoundPage from "./Pages/PageNotFound/PageNotFound"; // NEW: For 404 routes

/* CLIENTS */
import ClientsDashboardPage from "./Pages/MainDashboardPage/ClientManagementPage/ClientsDashboard";
import AddClientForm from "./Pages/MainDashboardPage/ClientManagementPage/AddClientForm/AddClientForm";
import ViewClientPage from "./Pages/MainDashboardPage/ClientManagementPage/ViewClientPage/ViewClientPage";
import EditClientForm from "./Pages/MainDashboardPage/ClientManagementPage/EditClientForm/EditClientForm";
/* LOANS */
import LoansDashboardPage from "./Pages/MainDashboardPage/LoansManagementPage/LoansDashboard";
import AddLoanForm from "./Pages/MainDashboardPage/LoansManagementPage/AddLoanForm/AddLoanForm.jsx";
import ViewLoanPage from "./Pages/MainDashboardPage/LoansManagementPage/ViewLoanPage/ViewLoanPage.jsx";
import EditLoanForm from "./Pages/MainDashboardPage/LoansManagementPage/EditLoanForm/EditLoanForm.jsx";

/* ACCOUNTING */
import AccountingDashboardPage from "./Pages/MainDashboardPage/AccountingManagementPage/AccountingDashboard";
import COAPage from "./Pages/MainDashboardPage/AccountingManagementPage/COAPage/COAPage.jsx";
import JournalEntriesListPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/JournalEntriesListPage.jsx";
import AddJournalEntryPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/AddJournalEntryPage/AddJournalEntryPage.jsx";
import ViewJournalEntryPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/ViewJournalEntryPage/ViewJournalEntryPage.jsx";
import EditJournalEntryPage from "./Pages/MainDashboardPage/AccountingManagementPage/JournalEntriesListPage/EditJournalEntryPage/EditJournalEntryPage.jsx";
import GeneralLedgerPage from "./Pages/MainDashboardPage/AccountingManagementPage/GeneralLedgerPage/GeneralLedgerPage.jsx";
import TrialBalancePage from "./Pages/MainDashboardPage/AccountingManagementPage/TrailBalancePage/TrailBalancePage.jsx";
import IncomeStatementPage from "./Pages/MainDashboardPage/AccountingManagementPage/IncomeStatementPage/IncomeStatementPage.jsx";
import BalanceSheetPage from "./Pages/MainDashboardPage/AccountingManagementPage/BalanceSheetPage/BalanceSheetPage.jsx";


/* IMAGES */
import PrimaryNavLogo from "./assets/logo-images/red-diamond-primary-logo-white-typeface.png";

/* COMPONENTS */
import ScrollToTop from "./components/scrollToTop/ScrollToTop";

/* SETTINGS COMPONENTS */
import SettingsPage from "./Pages/MainDashboardPage/SettingsPage/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      {/* Wrap the entire application with AuthProvider */}
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
              <Route path="/loginForm" element={<LoginForm />} />{" "}
              {/* Your existing login form */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />{" "}
              {/* New unauthorized page */}
              {/* Protected Routes - Require authentication */}
              {/* General Protected Routes: Accessible by any logged-in user */}
              <Route element={<PrivateRoute />}>
                <Route path="/mainDashboard" element={<MainDashboardPage />} />
                {/* Your existing ChangePasswordForm can be adapted to ChangeMyPasswordPage */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/changePasswordForm"
                  element={<ChangeMyPasswordPage />}
                />
                {/* Use the new ChangeMyPasswordPage component that uses AuthContext */}

                {/* CLIENT ROUTES */}

                {/* LOANS ROUTES */}

                {/* ACCOUNTING ROUTES */}

                {/* SETTINGS ROUTES */}
              </Route>{" "}
              {/* End of General Protected Routes */}
              {/* Role-specific Protected Routes: Only accessible by users with 'superadmin' or 'admin' roles */}
              <Route
                element={
                  <PrivateRoute allowedRoles={["superadmin", "admin"]} />
                }
              >
                <Route path="/users" element={<UserManagementPage />} />{" "}
                {/* Main user management list */}
                <Route path="/users/:id/edit" element={<UserEditPage />} />{" "}
                {/* Edit existing user */}
                <Route
                  path="/users/:id/change-password"
                  element={<AdminChangePasswordPage />}
                />
                <Route path="/clients/add" element={<AddClientForm />} />
                <Route path="/clients/:id" element={<ViewClientPage />} />
                <Route path="/clients/edit/:id" element={<EditClientForm />} />
                <Route path="/loans/add" element={<AddLoanForm />} />
                <Route path="/loans/:id" element={<ViewLoanPage />} />
                <Route path="/loans/edit/:id" element={<EditLoanForm />} />
                <Route path="/accounts" element={<COAPage />} />
                <Route path="/journal-entries/edit/:id" element={<EditJournalEntryPage/>}/>
                <Route path="/journal-entries/add" element={<AddJournalEntryPage/>}/>
                <Route path="/journal-entries/:id" element={<ViewJournalEntryPage/>}/>
                <Route
                  path="/journal-entries"
                  element={<JournalEntriesListPage />}
                />
                <Route path="/general-ledger" element={<GeneralLedgerPage/>} />
                <Route path="/reports" element={<TrialBalancePage/>}/>
                <Route path="income-statement" element={<IncomeStatementPage/>}/>
                <Route path="balance-sheet" element={<BalanceSheetPage/>}/>
                {/* Admin changing another user's password */}
              </Route>
              {/* Superadmin-Only Protected Routes */}
              <Route element={<PrivateRoute allowedRoles={["superadmin"]} />}>
                <Route path="/users/register" element={<RegisterUserPage />} />{" "}
                {/* Register new user (superadmin only) */}
                <Route path="/clients" element={<ClientsDashboardPage />} />
                <Route path="/loans" element={<LoansDashboardPage />} />
                <Route
                  path="/transactions"
                  element={<AccountingDashboardPage />}
                />
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
    </BrowserRouter>
  );
}

export default App;
