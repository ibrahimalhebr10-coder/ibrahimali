import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AdminProvider } from './contexts/AdminContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminProvider>
        <PermissionsProvider>
          <App />
        </PermissionsProvider>
      </AdminProvider>
    </AuthProvider>
  </StrictMode>
);
