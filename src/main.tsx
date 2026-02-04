import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { DemoModeProvider } from './contexts/DemoModeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AdminAuthProvider>
        <DemoModeProvider>
          <App />
        </DemoModeProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </StrictMode>
);
