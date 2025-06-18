import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import { AuthProvider }  from "./context/AuthContext";
import PrivateRoute from "./"

/* this is how my frontend is structured
   src - components, context, services, pages, utils, app.jsx, main.jsx


*/




/* USER MANAGEMENT */
// NEW: Import user management pages (we'll create/update these soon)
import UserManagementPage from "./pages/UserManagementPage";
import RegisterUserPage from "./pages/RegisterUserPage";
import UserEditPage from "./pages/UserEditPage";
import AdminChangePasswordPage from "./pages/AdminChangePasswordPage";
import ChangeMyPasswordPage from "./pages/ChangeMyPasswordPage"; // For a logged-in user to change their own password
import UnauthorizedPage from "./pages/UnauthorizedPage"; // NEW: For unauthorized access
import NotFoundPage from "./pages/NotFoundPage"; // NEW: For 404 routes

import LandingPage from "./components/LandingPage";
import LoginForm from "./components/LoginForm";
import ChangePasswordForm from "./components/ChangePasswordForm";
import MainDashboard from "./components/MainDashboard";
/* Clients */
import ClientsDashboard from "./components/ClientsDashboard/ClientsDashboard";
import AddClientForm from "./components/AddClientForm";
import ClientDashboard from "./components/ClientDashboard";
import EditClientPage from "./components/EditClientPage";
/* Loans */
import LoansDashboardPage from "./components/LoansDashboardPage";
import LoanDetailsPage from "./components/LoansDetailsPage";
import LoansList from "./components/LoansList";
import AddLoanPage from "./components/AddLoanPage";
import EditLoanPage from "./components/EditLoanPage";

/* ACCOUNTING */
import AccountingDashboardPage from "./components/AccountingDashboardPage/AccountingDashboardPage";
import ChartOfAccountsPage from "./components/ChartOfAccountsPage/ChartOfAccountsPage";
import JournalEntriesListPage from './components/JournalEntriesListPage/JournalEntriesListPage';
import AddJournalEntryPage from './components/AddJournalEntryPage/AddJournalEntryPage';
import JournalEntryDetailsPage from './components/JournalEntryDetailsPage/JournalEntryDetailsPage';
import GeneralLedgerPage from './components/GeneralLedgerPage/GeneralLedgerPage';
import TrialBalancePage from "./components/TrailBalancePage/TrailBalancePage";
import IncomeStatementPage from './components/IncomeStatementPage/IncomeStatementPage'; 
import BalanceSheetPage from "./components/BalanceSheetPage/BalanceSheetPage";

/* USER MANAGEMENT */

/* IMAGES */
import PrimaryNavLogo from "./assets/logo-images/red-diamond-primary-logo-white-typeface.png";

/* COMPONENTS */
import ScrollToTop from "./components/scrollToTop/ScrollToTop";

/* SETTINGS COMPONENTS */
import Settings from "./components/Settings";


/* i need a way to create other users and give them roles and what they can view and what not. 
i need the app to make sure it records who has been making crud operations on all the processes, 
when i create other users with less preveledges than the superadmin
   is the structure good from a software development perspective, is there room for improvement?
   i came across a problem. when i add a loan with 3000 the accounting will show 3000 disbursment, 
   but when i go back to the loan and edit it to 5000, the accounting does not update  
   i want to follow this process for this client, i made an update but i was one day late for the third payment, 
   which was the other week friday, i gave the update on saturday and 
   apologized, they said ok but they will give me the update on tuesday, tuesday passed 
   with no response i continued working on the app because he said he had exams and  he's last 
   paper is on tuesday, and am practically done but i ultimatley need there review 
   because they will be th ones using it and i need to polish it, its now like there is even a communication 
   breakdown havent heard anything, how do i address this? he is actually my cousine, 
   who i think just requested the app because he thought i was not capable of doing it, 
   as it is something within my family that im incapable of doing anything because i have 
   not finished computer science school and am unemployed and i they assume and slow or not normal,
    because of my situation.
   
   */





function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="appContainer">
        <div className="appPrimaryNavbarContainer">
          <header className="appPrimaryNavbar">
            <div className="primaryNavLogoContainer">
              <span>
                <img src={PrimaryNavLogo} alt="" className="primaryNavLogo" />
              </span>
              <span className="appPrimaryNavbarHeadline">
                <h1>Management Portal.</h1>
              </span>
            </div>
          </header>
        </div>
        <div className="outletSection">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/loginForm" element={<LoginForm />} />
            <Route path="/mainDashboard" element={<MainDashboard />} />
            <Route
              path="/changePasswordForm"
              element={<ChangePasswordForm />}
            />
            {/* CLIENT ROUTES */}
            <Route path="/clients" element={<ClientsDashboard />} />
            <Route path="/clients/add" element={<AddClientForm />} />
            <Route path="/clients/:id" element={<ClientDashboard />} />
            <Route path="/clients/edit/:id" element={<EditClientPage />} />
            {/* LOANS ROUTES */}
            <Route path="/loans" element={<LoansDashboardPage />} />
            <Route path="/loans/list" element={<LoansList />} />
            <Route path="/loans/add" element={<AddLoanPage />} />
            <Route path="/loans/edit/:id" element={<EditLoanPage />} />
            <Route path="/loans/:id" element={<LoanDetailsPage />} />
            {/* ACCOUNTING ROUTES */}
            <Route path="/transactions" element={<AccountingDashboardPage />} />
            <Route path="/accounts" element={<ChartOfAccountsPage />} />
            <Route
              path="/journal-entries"
              element={<JournalEntriesListPage />}
            />
            <Route
              path="/journal-entries/add"
              element={<AddJournalEntryPage />}
            />
            <Route
              path="/journal-entries/:id"
              element={<JournalEntryDetailsPage />}
            />
            <Route
              path="/journal-entries/edit/:id"
              element={<AddJournalEntryPage />}
            />{" "}
            <Route path="/general-ledger" element={<GeneralLedgerPage />} /> {/* <-- Add this route */}
            <Route path="/reports" element={<TrialBalancePage />} /> {/* <-- Add this route */}
            <Route path="/income-statement" element={<IncomeStatementPage />} /> {/* <-- Add this route */}
            <Route path="/balance-sheet" element={<BalanceSheetPage />} /> {/* <-- Add this route */}


            {/* USER MANAGEMENT */}
            {/* Use same component for edit */}

            {/* SETTINGS ROUTES */}
            <Route path="/settings" element={<Settings />} />
            {/*  */}
          </Routes>
        </div>
        <footer className="appFooter">
          <p className="appFooterCopyright">
            Red Diamond Solutions &copy; 2025
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
