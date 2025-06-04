import "./App.css";
import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import LandingPage from "./components/LandingPage";
import LoginForm from "./components/LoginForm";
import ChangePasswordForm from "./components/ChangePasswordForm";
import Dashboard from "./components/Dashboard";
/* Customers */
import CustomersDashboard from "./components/CustomersDashboard";
import AddCustomerForm from "./components/AddCustomerForm";
import ClientDashboard from "./components/ClientDashboard";
import EditCustomerPage from "./components/EditCustomerPage";
/* Loans */
import LoansDashboardPage from "./components/LoansDashboardPage";
import LoanDetailsPage from "./components/LoansDetailsPage";
import LoansList from "./components/LoansList";
import AddLoanPage from "./components/AddLoanPage";
import EditLoanPage from "./components/EditLoanPage";
import Accounting from "./components/Accounting";
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
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/changePasswordForm"
              element={<ChangePasswordForm />}
            />
            {/* CUSTOMER ROUTES */}
            <Route path="/customers" element={<CustomersDashboard />} />
            <Route path="/customers/add" element={<AddCustomerForm />} />
            <Route path="/customers/:id" element={<ClientDashboard />} />
            <Route path="/customers/edit/:id" element={<EditCustomerPage />} />
            {/* LOANS ROUTES */}
            <Route path="/loans" element={<LoansDashboardPage />} />
            <Route path="/loans/list" element={<LoansList />} />
            <Route path="/loans/add" element={<AddLoanPage />} />
            <Route path="/loans/edit/:id" element={<EditLoanPage />} />
            <Route path="/loans/:id" element={<LoanDetailsPage />} />
            {/* ACCOUNTING ROUTES */}
            <Route path="/accounting" element={<Accounting />} />
            {/* SETTINGS ROUTES */}
            <Route path="/settings" element={<Settings/>}/>
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
