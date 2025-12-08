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

function Uyelik() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const firmaAdi = profileData?.firmaAdi ? profileData.firmaAdi.toUpperCase() : 'KULLANICI';
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [selectingPlan, setSelectingPlan] = useState(false);

  // Sayfa yüklendiğinde fade-in animasyonu
  useEffect(() => {
    setIsPageLoaded(false);
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/auth/profile`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
      }
    };
    loadProfile();
  }, []);

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
    if (status === 'Aktif') return 'bg-green-100 text-green-800';
    if (status === 'Beklemede') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Süresi Dolmuş') return 'bg-red-100 text-red-800';
    if (status === 'Tanımsız') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
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
        const profileResponse = await fetchWithAuth(`${API_URL}/auth/profile`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfileData(profileData);
        }
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
      className={`min-h-screen transition-all duration-1000 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
        profileData={profileData}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          firmaAdi={firmaAdi}
          profileData={profileData}
          fetchWithAuth={fetchWithAuth}
          setIsProfileModalOpen={setIsProfileModalOpen}
          setProfileData={setProfileData}
          setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
          logout={logout}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="p-4 sm:p-6 pt-8 mt-20 lg:ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Üyelik Bilgileri Bölümü */}
            <div className="mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-my-siyah mb-6 sm:mb-8">Üyelik Bilgileri</h1>

                {membershipLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-my-siyah"></div>
                  </div>
                ) : membershipData ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">Üyelik Planı</h3>
                          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{membershipData.plan || 'Standart'}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold w-fit ${getStatusColor(membershipData.status || 'Aktif')}`}>
                          {membershipData.status || 'Aktif'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-5">
                        <label className="block text-sm font-semibold text-gray-500 mb-2">Başlangıç Tarihi</label>
                        <p className="text-lg font-bold text-my-siyah">{formatDate(membershipData.startDate)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-5">
                        <label className="block text-sm font-semibold text-gray-500 mb-2">Bitiş Tarihi</label>
                        <p className="text-lg font-bold text-my-siyah">
                          {membershipData.endDate ? formatDate(membershipData.endDate) : 'Sınırsız'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Plan Özellikleri</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(membershipData.features || []).map((feature, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Üyelik bilgileri yüklenemedi</p>
                  </div>
                )}
              </div>
            </div>

            {/* Üyelik Paketleri Bölümü */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-my-siyah mb-2">Üyelik Paketleri</h2>
                <p className="text-gray-600 text-sm sm:text-base">İhtiyacınıza uygun paketi seçin ve hemen başlayın</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {membershipPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      plan.popular ? 'border-blue-500 md:scale-105 md:-mt-2' : 'border-gray-200 hover:border-gray-300'
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
                        <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-3xl sm:text-4xl font-bold mb-1">{plan.price}</div>
                        <div className="text-sm sm:text-base opacity-90">{plan.duration}</div>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-gray-600 text-sm mb-5 text-center font-medium">{plan.description}</p>
                      <ul className="space-y-3 mb-6 min-h-[180px]">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => selectMembershipPlan(plan.months)}
                        disabled={selectingPlan}
                        className={`w-full ${plan.buttonColor} text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg`}
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
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Üyelik Yönetimi</p>
                    <p className="text-sm text-blue-800">
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
            try {
              const response = await fetchWithAuth(`${API_URL}/auth/profile`);
              if (response.ok) {
                const data = await response.json();
                setProfileData(data);
              }
            } catch (error) {
              console.error('Profil yükleme hatası:', error);
            }
          }}
          profileData={profileData}
          setProfileData={(data) => {
            setProfileData(data);
          }}
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

