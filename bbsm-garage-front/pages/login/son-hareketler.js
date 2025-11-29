import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import ProfileModal from '../../components/ProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { useSwipe } from '../../hooks/useTouchGestures';

function SonHareketler() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const firmaAdi = profileData?.firmaAdi ? profileData.firmaAdi.toUpperCase() : 'KULLANICI';
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [hareketler, setHareketler] = useState([]);

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

  const fetchHareketler = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/log/son-hareketler?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setHareketler(data);
      }
    } catch (error) {
      console.error('Hareketler yükleme hatası:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHareketler();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Sidebar için swipe gesture
  const sidebarSwipe = useSwipe(
    null,
    () => setIsSidebarOpen(true),
    null,
    null,
    50
  );

  // Tarih formatını düzelt
  const formatTarih = (tarih) => {
    if (!tarih) return '-';
    const date = new Date(tarih);
    const gun = String(date.getDate()).padStart(2, '0');
    const ay = String(date.getMonth() + 1).padStart(2, '0');
    const yil = date.getFullYear();
    const saat = String(date.getHours()).padStart(2, '0');
    const dakika = String(date.getMinutes()).padStart(2, '0');
    return `${gun}.${ay}.${yil} ${saat}:${dakika}`;
  };

  const getActionLabel = (action) => {
    if (action === 'login') return 'Giriş Yaptı';
    if (action === 'logout') return 'Çıkış Yaptı';
    if (action === 'card_edit') return 'Kart Düzenledi';
    if (action === 'card_create') return 'Kart Ekledi';
    if (action === 'card_delete') return 'Kart Sildi';
    return action;
  };

  const getActionColor = (action) => {
    if (action === 'login') return 'text-green-600 bg-green-100';
    if (action === 'logout') return 'text-red-600 bg-red-100';
    if (action === 'card_edit') return 'text-blue-600 bg-blue-100';
    if (action === 'card_create') return 'text-purple-600 bg-purple-100';
    if (action === 'card_delete') return 'text-red-700 bg-red-200';
    return 'text-gray-600 bg-gray-100';
  };

  // Hareketleri kategorilere ayır
  const girisCikisHareketleri = hareketler.filter(h => h.action === 'login' || h.action === 'logout');
  const duzenlemeHareketleri = hareketler.filter(h => h.action === 'card_edit' || h.action === 'card_create' || h.action === 'card_delete');

  return (
    <div {...sidebarSwipe} className={`min-h-screen bg-gray-50 transition-opacity duration-300 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <Head>
        <title>BBSM Garage - Son Hareketler</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        {/* Sidebar overlay - mobilde sidebar açıkken arka planı kapat */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz relative z-40">
          <ul className="space-y-4">
            <li>
              <Link href="/login/kartlar" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Kartlar</Link>
            </li>
            <li>
              <Link href="/login/teklif" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Teklif</Link>
            </li>
            <li>
              <Link href="/login/stok" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Stok Takibi</Link>
            </li>
            <li>
              <Link href="/login/gelir" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Gelir Raporu</Link>
            </li>
            <li>
              <Link href="/login/son-hareketler" className="block p-3 text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Son Hareketler</Link>
            </li>
            <li>
              <Link href="/login/bizeulasin" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Bize Ulaşın</Link>
            </li>
          </ul>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
          <div className="px-3 py-3 lg:px-5 lg:pl-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={toggleSidebar} 
                  className={`lg:hidden p-3 font-bold text-lg leading-tight antialiased ${isSidebarOpen ? 'hidden' : ''} active:scale-95 transition-transform touch-manipulation min-w-[44px] min-h-[44px]`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                <a href="#" className="flex ml-2 md:mr-8 lg:mr-24">
                  <img src="/images/BBSMlogo.png" className="h-16 mr-3" alt="logo" />
                </a>
              </div>
              <div className="flex items-center relative">
                <button 
                  type="button" 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center text-sm hidden md:flex hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="sr-only">Open user menu</span>
                  <p className="text-center text-my-siyah font-semibold items-center pr-8">{firmaAdi}</p>
                  <img 
                    src={profileData?.profileImage ? `${API_URL}${profileData.profileImage}` : '/images/yasin.webp'} 
                    className="h-16 w-16 rounded-full object-cover" 
                    alt="Kullanıcı"
                    onError={(e) => {
                      e.target.src = '/images/yasin.webp';
                    }}
                  />
                </button>
                
                {/* Settings Dropdown */}
                {isSettingsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSettingsOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-my-siyah">{firmaAdi}</p>
                          <p className="text-xs text-gray-500 mt-1">Firma Hesabı</p>
                        </div>
                        <button
                          onClick={async () => {
                            setIsSettingsOpen(false);
                            try {
                              const response = await fetchWithAuth(`${API_URL}/auth/profile`);
                              if (response.ok) {
                                const data = await response.json();
                                setProfileData(data);
                                setIsProfileModalOpen(true);
                              } else {
                                alert('Profil bilgileri yüklenemedi');
                              }
                            } catch (error) {
                              console.error('Profil yükleme hatası:', error);
                              alert('Profil bilgileri yüklenirken bir hata oluştu');
                            }
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-my-siyah hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profil
                        </button>
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            setIsChangePasswordModalOpen(true);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-my-siyah hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Şifre Değiştir
                        </button>
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-20 pb-8 px-4 lg:px-8 lg:ml-64">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-my-siyah mb-4 sm:mb-6">Son Hareketler</h1>
            
            {/* Giriş/Çıkış Hareketleri Bölümü */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-my-siyah mb-3 sm:mb-4">Giriş/Çıkış Hareketleri</h2>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-my-siyah"></div>
                </div>
              ) : girisCikisHareketleri.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-base sm:text-lg">Henüz giriş/çıkış kaydı bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kullanıcı
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlem
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih ve Saat
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {girisCikisHareketleri.map((hareket) => (
                            <tr key={hareket.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">{hareket.username}</div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(hareket.action)}`}>
                                  {getActionLabel(hareket.action)}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {formatTarih(hareket.timestamp)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Düzenlemeler Bölümü */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-my-siyah mb-3 sm:mb-4">Düzenlemeler</h2>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-my-siyah"></div>
                </div>
              ) : duzenlemeHareketleri.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-base sm:text-lg">Henüz düzenleme kaydı bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kullanıcı
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              İşlem
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Düzenleyen
                            </th>
                            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tarih ve Saat
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {duzenlemeHareketleri.map((hareket) => (
                            <tr key={hareket.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">{hareket.username}</div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(hareket.action)}`}>
                                  {getActionLabel(hareket.action)}
                                </span>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                <div className="text-xs sm:text-sm text-gray-700">{hareket.duzenleyen || '-'}</div>
                              </td>
                              <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                {formatTarih(hareket.timestamp)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setIsEditingProfile(false);
          }}
          profileData={profileData}
          isEditing={isEditingProfile}
          onEdit={() => setIsEditingProfile(true)}
          onSave={async (updatedData) => {
            try {
              const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
              });
              if (response.ok) {
                const data = await response.json();
                setProfileData(data);
                setIsEditingProfile(false);
                alert('Profil başarıyla güncellendi');
              } else {
                alert('Profil güncellenirken bir hata oluştu');
              }
            } catch (error) {
              console.error('Profil güncelleme hatası:', error);
              alert('Profil güncellenirken bir hata oluştu');
            }
          }}
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

export default withAuth(SonHareketler);

