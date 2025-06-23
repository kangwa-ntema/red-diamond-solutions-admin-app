// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx'; // Make sure this path is correct for your App component
import { BrowserRouter } from 'react-router-dom'; // <-- IMPORT BrowserRouter here!
import { ToastContainer } from 'react-toastify'; // <-- If you're using react-toastify, import it here
import 'react-toastify/dist/ReactToastify.css'; // <-- And its CSS

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Wrap your App component with BrowserRouter */}
    <BrowserRouter>
      <App />
      {/* ToastContainer is often placed here so it can overlay the entire app */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </BrowserRouter>
  </StrictMode>,
);