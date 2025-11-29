import '@/styles/globals.css';
import { AuthProvider } from '../auth-context'; // auth-context dosyanızın yolu
import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import Loading from '../components/Loading';
import { ToastProvider, useToast } from '../contexts/ToastContext';
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
  const router = useRouter();

  useEffect(() => {
    const handleStart = (url) => {
      setLoading(true);
      // Sayfa geçişi başladığında fade-out efekti - Ultra Smooth
      document.body.style.transition = 'opacity 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      document.body.style.opacity = '0.85';
    };
    
    const handleComplete = (url) => {
      setLoading(false);
      // Sayfa geçişi tamamlandığında fade-in efekti - Ultra Smooth
      setTimeout(() => {
        document.body.style.transition = 'opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        document.body.style.opacity = '1';
      }, 200);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      <AuthProvider>
        <ToastProvider>
          {loading && <Loading />}
          <AppContent Component={Component} pageProps={pageProps} />
        </ToastProvider>
      </AuthProvider>
    </LoadingContext.Provider>
  );
}

export default MyApp;
