import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

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

/* IMAGES */
import PrimaryNavLogo from "./assets/logo-images/red-diamond-primary-logo-white-typeface.png";

/* COMPONENTS */
import ScrollToTop from "./components/scrollToTop/ScrollToTop";

/* SETTINGS COMPONENTS */
import Settings from "./components/Settings";

function App() {
  return (
    <BrowserRouter>
      {/* <ScrollToTop /> */}
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

            {/* SETTINGS ROUTES */}
            <Route path="/settings" element={<Settings />} />
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
