import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth/useAuth.jsx';
import { ProfilePage } from './profile/ProfilePage.jsx';
import './App.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ProfilePage />
    </AuthProvider>
  </React.StrictMode>
);
