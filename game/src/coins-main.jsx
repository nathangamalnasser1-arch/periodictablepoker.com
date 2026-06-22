import React from 'react';
import { createRoot } from 'react-dom/client';
import { CoinScoreboardPage } from './coins/CoinScoreboardPage.jsx';
import './App.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CoinScoreboardPage />
  </React.StrictMode>
);
