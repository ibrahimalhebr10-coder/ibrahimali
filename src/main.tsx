import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminProvider } from './contexts/AdminContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminProvider>
        <App />
      </AdminProvider>
    </AuthProvider>
  </StrictMode>
);
