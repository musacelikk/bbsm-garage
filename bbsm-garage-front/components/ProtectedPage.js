import { useRouter } from 'next/router';
import { useProfile } from '../contexts/ProfileContext';

const ProtectedPage = ({ children }) => {
  const router = useRouter();
  const { profileData, loading } = useProfile();

  // Üyelik kontrolü
  const checkMembership = () => {
    // Veri yükleniyorsa veya profil verisi yoksa false dön (loading kontrolü yukarıda yapılıyor)
    if (!profileData) {
      return false;
    }

    // Aktif üyelik kontrolü: bitiş tarihi gelecekte VE status 'active' olmalı
    const hasValidMembership = profileData.membership_end_date && 
                                new Date(profileData.membership_end_date) > new Date() && 
                                profileData.membership_status === 'active';
    
    // Bekleyen teklif kontrolü
    const hasPendingRequest = profileData.hasPendingRequest === true;
    
    // DOĞRU MANTIK:
    // 1. Eğer aktif üyelik varsa → kullanıcı çalışabilir (pending request olsa bile)
    // 2. Eğer aktif üyelik yoksa VE pending request varsa → kilitle
    // 3. Eğer aktif üyelik yoksa VE pending request yoksa → kilitle (üyelik yok)
    
    if (hasValidMembership) {
      // Aktif üyelik varsa, pending request olsa bile çalışabilir
      return true;
    }
    
    // Aktif üyelik yoksa
    if (hasPendingRequest) {
      // Pending request varsa kilitle
      return false;
    }
    
    // Aktif üyelik yoksa ve pending request yoksa da kilitle (üyelik yok)
    return false;
  };

  const hasMembership = checkMembership();

  // ProfileContext'ten veri yükleniyorsa bekle
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-bg-primary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Üyelik kontrolü başarısızsa sayfayı kilitle
  if (!hasMembership) {
    return (
      <div className="min-h-screen flex items-center justify-center dark-bg-primary">
        <div className="max-w-md w-full dark-card-bg neumorphic-card rounded-2xl p-8 text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold dark-text-primary mb-4">Sayfa Kilitli</h2>
          <p className="dark-text-secondary mb-6">
            Bu sayfaya erişmek için üyelik teklifinizin onaylanması gerekmektedir. 
            Teklifiniz onaylandıktan sonra sayfalar otomatik olarak açılacaktır.
            Lütfen üyelik sayfasından teklif durumunuzu kontrol edin.
          </p>
          <button
            onClick={() => router.push('/login/uyelik')}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg neumorphic-inset hover:bg-blue-700 transition-colors"
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
