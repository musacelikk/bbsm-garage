import '@/styles/globals.css';
import { AuthProvider } from '../auth-context'; // auth-context dosyanızın yolu
import React, { useState, createContext, useContext } from 'react';
import { ToastProvider, useToast } from '../contexts/ToastContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import ToastContainer from '../components/ToastContainer';

const LoadingContext = createContext();

export function useLoading() {
  return useContext(LoadingContext);
}

function AppContent({ Component, pageProps }) {
  const { toasts, removeToast } = useToast();
  
  return (
    <>
      <Component {...pageProps} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      <AuthProvider>
        <ProfileProvider>
          <CurrencyProvider>
            <NotificationProvider>
        <ToastProvider>
          <AppContent Component={Component} pageProps={pageProps} />
        </ToastProvider>
            </NotificationProvider>
          </CurrencyProvider>
        </ProfileProvider>
      </AuthProvider>
    </LoadingContext.Provider>
  );
}

export default MyApp;
