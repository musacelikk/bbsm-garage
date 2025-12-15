import '@/styles/globals.css';
import { AuthProvider } from '../auth-context'; // auth-context dosyanızın yolu
import React, { useState, createContext, useContext, useEffect } from 'react';
import Head from 'next/head';
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

  useEffect(() => {
    // PWA Service Worker kaydı
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker kayıt hatası (opsiyonel)
      });
    }
  }, []);

  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A0875" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
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
    </>
  );
}

export default MyApp;
