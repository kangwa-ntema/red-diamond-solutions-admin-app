import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import LandingPage from './components/LandingPage';
import LoginForm from "./components/LoginForm";
import ChangePasswordForm from './components/ChangePasswordForm';
import Dashboard from "./components/Dashboard";
import Customers from './components/Customers';
import AddCustomerForm from './components/AddCustomerForm';
import Accounting from './components/Accounting';
import './App.css'

function App() {

  return (
    <BrowserRouter>
    <div className="appPrimaryNavbarContainer">
        <header className="appPrimaryNavbar">
          <div  className="logo">
            Red Diamond Solutions. 
          </div>
        </header>
      </div>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/loginForm" element={<LoginForm/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/customers" element={<Customers/>} />
        <Route path="/changePasswordForm" element={<ChangePasswordForm/>}/>
        <Route path="/customers/add" element={<AddCustomerForm/>}/>
        <Route path="/accounting" element={<Accounting/>}/>
      </Routes>
       <footer className="appFooter">
        <p className="appFooterCopyright">Red Diamond Solutions &copy; 2025</p>
      </footer>
    </BrowserRouter>
  )
}

export default App
