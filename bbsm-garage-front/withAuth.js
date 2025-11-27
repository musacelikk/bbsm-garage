import { useAuth } from './auth-context';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        router.push('/'); // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
      }
    }, [user, router]);

    if (!user) {
      return null; // Kullanıcı yoksa hiçbir şey render etme
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
