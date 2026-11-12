// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css'; // <-- Tailwind CSS is here

// In production the Vite build injects the Flask service URL via __API_BASE__.
// In local dev this is an empty string and the Vite proxy handles /api/*.
if (typeof __API_BASE__ !== 'undefined' && __API_BASE__) {
  axios.defaults.baseURL = __API_BASE__;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
