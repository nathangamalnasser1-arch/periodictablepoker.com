import React from 'react';
import { createRoot } from 'react-dom/client';
import { LedgerPage } from './ledger/LedgerPage.jsx';
import './App.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LedgerPage />
  </React.StrictMode>
);
