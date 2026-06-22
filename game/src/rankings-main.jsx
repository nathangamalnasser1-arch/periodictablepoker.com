import React from 'react';
import { createRoot } from 'react-dom/client';
import { RankingsPage } from './rankings/RankingsPage.jsx';
import './App.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RankingsPage />
  </React.StrictMode>
);
