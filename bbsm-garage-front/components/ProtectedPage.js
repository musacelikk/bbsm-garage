import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../auth-context';
import { API_URL } from '../config';

const ProtectedPage = ({ children }) => {
  const { fetchWithAuth } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/auth/profile`);
        if (response.ok) {
          const data = await response.json();
          // Üyelik süresi tanımlı mı ve gelecekte mi kontrol et
          const hasValidMembership = data.membership_end_date && new Date(data.membership_end_date) > new Date();
          // Bekleyen teklif varsa sayfayı kilitle
          const hasPendingRequest = data.hasPendingRequest === true;
          
          // Üyelik geçerliyse ve bekleyen teklif yoksa sayfa açık
          if (hasValidMembership && !hasPendingRequest) {
            setHasMembership(true);
          } else {
            setHasMembership(false);
          }
        } else {
          setHasMembership(false);
        }
      } catch (error) {
        console.error('Üyelik kontrolü hatası:', error);
        setHasMembership(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
    // Her 5 saniyede bir kontrol et (teklif onaylandığında sayfa açılsın)
    const interval = setInterval(checkMembership, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hasMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Kilitli</h2>
          <p className="text-gray-600 mb-6">
            Bu sayfaya erişmek için üyelik teklifinizin onaylanması gerekmektedir. 
            Teklifiniz onaylandıktan sonra sayfalar otomatik olarak açılacaktır.
            Lütfen üyelik sayfasından teklif durumunuzu kontrol edin.
          </p>
          <button
            onClick={() => router.push('/login/uyelik')}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Üyelik Sayfasına Git
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedPage;
