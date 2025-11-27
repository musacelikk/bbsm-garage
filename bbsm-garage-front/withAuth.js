import { useAuth } from './auth-context';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Loading tamamlanana kadar bekle
      if (!isLoading && !user) {
        router.push('/'); // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
      }
    }, [user, isLoading, router]);

    // Loading durumunda veya user yoksa hiçbir şey render etme
    if (isLoading || !user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
