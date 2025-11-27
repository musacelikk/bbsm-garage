import '@/styles/globals.css';
import { AuthProvider } from '../auth-context'; // auth-context dosyanızın yolu
import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import Loading from '../components/Loading';

const LoadingContext = createContext();

export function useLoading() {
  return useContext(LoadingContext);
}

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

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
        {loading && <Loading />}
        <Component {...pageProps} />
      </AuthProvider>
    </LoadingContext.Provider>
  );
}

export default MyApp;
