import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import LandingPage from "./components/LandingPage";
import LoginForm from "./components/LoginForm";
import ChangePasswordForm from "./components/ChangePasswordForm";
import Dashboard from "./components/Dashboard";
import Customers from "./components/Customers";
import AddCustomerForm from "./components/AddCustomerForm";
import Accounting from "./components/Accounting";
import ViewClientPage from "./components/ViewClientPage";
import EditCustomerPage from "./components/EditCustomerPage";
import "./App.css";

/* IMAGES */
import PrimaryNavLogo from "./assets/logo-images/red-diamond-primary-logo-white-typeface.png";

/* COMPONENTS */
import ScrollToTop from "./components/scrollToTop/ScrollToTop";

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
                <h1>Management Portal</h1>
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
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/add" element={<AddCustomerForm />} />
            <Route path="/customers/:id" element={<ViewClientPage />} />
            <Route path="/customers/edit/:id" element={<EditCustomerPage />} />
            <Route path="/accounting" element={<Accounting />} />
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
