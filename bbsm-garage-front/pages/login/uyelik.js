import React, { useState, useEffect } from 'react';
import Head from "next/head";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import ProfileModal from '../../components/ProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';

function Uyelik() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(false);

  useEffect(() => {
    loadMembershipData();
  }, []);

  const loadMembershipData = async () => {
    setMembershipLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/membership`);
      if (response.ok) {
        const data = await response.json();
        setMembershipData({
          plan: data.plan || 'Standart',
          status: data.membership_status === 'active' ? 'Aktif' : 
                  data.membership_status === 'expired' ? 'Süresi Dolmuş' : 
                  data.membership_status === 'inactive' ? 'Tanımsız' : 'Tanımsız',
          startDate: data.membership_start_date,
          endDate: data.membership_end_date,
          features: data.features || ['Sınırsız kart kaydı', 'Sınırsız teklif oluşturma', 'Raporlama']
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMembershipData({
          plan: 'Standart',
          status: 'Tanımsız',
          startDate: null,
          endDate: null,
          features: ['Sınırsız kart kaydı', 'Sınırsız teklif oluşturma', 'Raporlama']
        });
      }
    } catch (error) {
      console.error('Üyelik bilgileri yükleme hatası:', error);
      setMembershipData({
        plan: 'Standart',
        status: 'Tanımsız',
        startDate: null,
        endDate: null,
        features: ['Sınırsız kart kaydı', 'Sınırsız teklif oluşturma', 'Raporlama']
      });
    }
    setMembershipLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    if (status === 'Aktif') return 'bg-green-500/20 text-green-400';
    if (status === 'Beklemede') return 'bg-yellow-500/20 text-yellow-400';
    if (status === 'Süresi Dolmuş') return 'bg-red-500/20 text-red-400';
    if (status === 'Tanımsız') return 'dark-bg-tertiary dark-text-muted';
    return 'dark-bg-tertiary dark-text-muted';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const selectMembershipPlan = async (months) => {
    if (selectingPlan) return;
    
    setSelectingPlan(true);
    setLoading(true);
    
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/select-membership-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ months }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Teklifi gönderildi');
        // Üyelik bilgilerini yeniden yükle
        await loadMembershipData();
        // Profil verilerini de yeniden yükle (membership_end_date güncellenmiş olabilir)
        await refreshProfile();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || 'Teklif gönderilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Üyelik planı seçme hatası:', error);
      alert('Teklif gönderilirken bir hata oluştu.');
    } finally {
      setSelectingPlan(false);
      setLoading(false);
    }
  };

  const membershipPlans = [
    {
      id: 'trial',
      name: 'Deneme Sürümü',
      months: 0.25, // 7 gün yaklaşık 0.25 ay
      duration: '7 Gün',
      price: 'Ücretsiz',
      description: 'Tüm özellikleri deneyin',
      features: [
        'Tüm özelliklere erişim',
        'Sınırsız kart kaydı',
        'Sınırsız teklif oluşturma',
        'Raporlama ve analiz'
      ],
      color: 'from-purple-500 to-purple-600',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: '6months',
      name: '6 Aylık Plan',
      months: 6,
      duration: '6 Ay',
      price: 'Özel Fiyat',
      description: 'En popüler seçenek',
      features: [
        'Tüm özelliklere erişim',
        'Sınırsız kart kaydı',
        'Sınırsız teklif oluşturma',
        'Raporlama ve analiz',
        'Öncelikli destek'
      ],
      color: 'from-blue-500 to-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      popular: true
    },
    {
      id: '1year',
      name: '1 Yıllık Plan',
      months: 12,
      duration: '12 Ay',
      price: 'En İyi Fiyat',
      description: 'En iyi değer',
      features: [
        'Tüm özelliklere erişim',
        'Sınırsız kart kaydı',
        'Sınırsız teklif oluşturma',
        'Raporlama ve analiz',
        'Öncelikli destek',
        'Özel özellikler'
      ],
      color: 'from-green-500 to-green-600',
      buttonColor: 'bg-green-600 hover:bg-green-700'
    }
  ];

  // Sidebar için swipe gesture
  const sidebarSwipe = useSwipe(
    null,
    () => setIsSidebarOpen(true),
    null,
    null,
    50
  );

  return (
    <div 
      className="min-h-screen dark-bg-primary"
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Üyelik</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="uyelik"
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="p-4 sm:p-6 pt-8 mt-16 lg:ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Üyelik Bilgileri Bölümü */}
            <div className="mb-8">
              <div className="dark-card-bg neumorphic-card rounded-2xl p-6 md:p-8">
                <h1 className="text-xl md:text-2xl font-semibold dark-text-primary mb-4 md:mb-6">Üyelik Bilgileri</h1>

                {membershipLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  </div>
                ) : membershipData ? (
                  <div className="space-y-6">
                    <div className="dark-bg-secondary neumorphic-card rounded-xl p-6 border dark-border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold dark-text-secondary mb-1">Üyelik Planı</h3>
                          <p className="text-xl md:text-2xl font-semibold text-blue-400">{membershipData.plan || 'Standart'}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold w-fit neumorphic-inset ${getStatusColor(membershipData.status || 'Aktif')}`}>
                          {membershipData.status || 'Aktif'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="dark-card-bg neumorphic-card rounded-xl border dark-border p-5">
                        <label className="block text-sm font-semibold dark-text-muted mb-2">Başlangıç Tarihi</label>
                        <p className="text-base font-semibold dark-text-primary">{formatDate(membershipData.startDate)}</p>
                      </div>
                      <div className="dark-card-bg neumorphic-card rounded-xl border dark-border p-5">
                        <label className="block text-sm font-semibold dark-text-muted mb-2">Bitiş Tarihi</label>
                        <p className="text-base font-semibold dark-text-primary">
                          {membershipData.endDate ? formatDate(membershipData.endDate) : 'Sınırsız'}
                        </p>
                      </div>
                    </div>

                    <div className="dark-card-bg neumorphic-card rounded-xl border dark-border p-5">
                      <h4 className="text-lg font-semibold dark-text-primary mb-4">Plan Özellikleri</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(membershipData.features || []).map((feature, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="dark-text-secondary">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="dark-text-muted">Üyelik bilgileri yüklenemedi</p>
                  </div>
                )}
              </div>
            </div>

            {/* Üyelik Paketleri Bölümü */}
            <div className="dark-card-bg neumorphic-card rounded-2xl p-6 md:p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl md:text-2xl font-semibold dark-text-primary mb-3">Üyelik Paketleri</h2>
                <p className="dark-text-secondary text-sm sm:text-base">İhtiyacınıza uygun paketi seçin ve hemen başlayın</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {membershipPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative dark-card-bg neumorphic-card rounded-2xl border-2 dark-border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      plan.popular ? 'border-blue-400 md:scale-105 md:-mt-2' : 'hover:border-dark-border'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 text-xs font-bold rounded-bl-lg shadow-md z-10">
                        ⭐ Popüler
                      </div>
                    )}
                    <div className={`bg-gradient-to-br ${plan.color} text-white p-6 text-center relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-base md:text-lg font-semibold mb-2">{plan.name}</h3>
                        <div className="text-3xl sm:text-4xl font-bold mb-1">{plan.price}</div>
                        <div className="text-sm sm:text-base opacity-90">{plan.duration}</div>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="dark-text-secondary text-sm mb-5 text-center font-medium">{plan.description}</p>
                      <ul className="space-y-3 mb-6 min-h-[180px]">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="dark-text-secondary text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => selectMembershipPlan(plan.months)}
                        disabled={selectingPlan}
                        className={`w-full ${plan.buttonColor} text-white font-semibold py-3 px-6 rounded-lg neumorphic-inset transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95`}
                      >
                        {selectingPlan ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            İşleniyor...
                          </span>
                        ) : (
                          'Planı Seç'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bilgilendirme */}
              <div className="mt-8 dark-bg-secondary neumorphic-card border dark-border rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold dark-text-primary mb-1">Üyelik Yönetimi</p>
                    <p className="text-sm dark-text-secondary">
                      Üyelik planınızı yükseltmek veya değiştirmek için yukarıdaki paketlerden birini seçebilirsiniz. 
                      Mevcut üyeliğiniz varsa, yeni paket mevcut bitiş tarihinize eklenecektir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profil Bilgileri Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={async () => {
            setIsProfileModalOpen(false);
            setIsEditingProfile(false);
            await refreshProfile();
          }}
          profileData={profileData}
          setProfileData={refreshProfile}
          isEditing={isEditingProfile}
          setIsEditing={setIsEditingProfile}
          fetchWithAuth={fetchWithAuth}
          API_URL={API_URL}
          setLoading={setLoading}
        />
      )}

      {/* Şifre Değiştirme Modal */}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          fetchWithAuth={fetchWithAuth}
          API_URL={API_URL}
          setLoading={setLoading}
        />
      )}
    </div>
  );
}

export default withAuth(Uyelik);

