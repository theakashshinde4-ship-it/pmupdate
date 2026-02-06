import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LanguageProvider } from './context/LanguageContext';
// Initialize Sentry if DSN provided
import('./utils/sentry').catch(() => {});

// Apply dark mode preference early to prevent flash
const darkMode = localStorage.getItem('darkMode') === 'true';
if (darkMode) {
  document.documentElement.classList.add('dark-mode');
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <AuthProvider>
        <ToastProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </ToastProvider>
      </AuthProvider>
    </StrictMode>
  </BrowserRouter>
);
