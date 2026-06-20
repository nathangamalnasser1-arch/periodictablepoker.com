import React from 'react';
import { createRoot } from 'react-dom/client';
import { ScoreboardPage } from './scoreboard/ScoreboardPage.jsx';
import './App.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ScoreboardPage />
  </React.StrictMode>
);
