import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import ProfileModal from '../../components/ProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import MembershipModal from '../../components/MembershipModal';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { useSwipe } from '../../hooks/useTouchGestures';

function SonHareketler() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const firmaAdi = profileData?.firmaAdi ? profileData.firmaAdi.toUpperCase() : 'KULLANICI';
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [hareketler, setHareketler] = useState([]);
  const [activeTab, setActiveTab] = useState('giris-cikis');
  const [girisCikisPage, setGirisCikisPage] = useState(1);
  const [duzenlemePage, setDuzenlemePage] = useState(1);
  const itemsPerPage = 20;

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

  // Sayfalama hesaplamaları
  const girisCikisTotalPages = Math.ceil(girisCikisHareketleri.length / itemsPerPage);
  const duzenlemeTotalPages = Math.ceil(duzenlemeHareketleri.length / itemsPerPage);
  
  const girisCikisPaginated = girisCikisHareketleri.slice(
    (girisCikisPage - 1) * itemsPerPage,
    girisCikisPage * itemsPerPage
  );
  
  const duzenlemePaginated = duzenlemeHareketleri.slice(
    (duzenlemePage - 1) * itemsPerPage,
    duzenlemePage * itemsPerPage
  );

  return (
    <div {...sidebarSwipe} className={`min-h-screen bg-gray-50 transition-opacity duration-300 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <Head>
        <title>BBSM Garage - Son Hareketler</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="son-hareketler"
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          firmaAdi={firmaAdi}
          profileData={profileData}
          fetchWithAuth={fetchWithAuth}
          setIsProfileModalOpen={setIsProfileModalOpen}
          setProfileData={setProfileData}
          setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
          setIsMembershipModalOpen={setIsMembershipModalOpen}
          logout={logout}
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="pt-20 pb-8 px-4 lg:px-8 lg:ml-64">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-my-siyah mb-4 sm:mb-6">Son Hareketler</h1>
            
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => {
                      setActiveTab('giris-cikis');
                      setGirisCikisPage(1);
                    }}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                      activeTab === 'giris-cikis'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Giriş/Çıkış
                    {girisCikisHareketleri.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === 'giris-cikis' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {girisCikisHareketleri.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('duzenlemeler');
                      setDuzenlemePage(1);
                    }}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                      activeTab === 'duzenlemeler'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Düzenlemeler
                    {duzenlemeHareketleri.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === 'duzenlemeler' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {duzenlemeHareketleri.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>
            </div>

            {/* Giriş/Çıkış Tab Content */}
            {activeTab === 'giris-cikis' && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-my-siyah"></div>
                  </div>
                ) : girisCikisHareketleri.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-base sm:text-lg">Henüz giriş/çıkış kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <>
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
                              {girisCikisPaginated.map((hareket) => (
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
                    
                    {/* Sayfalama */}
                    {girisCikisTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          Toplam {girisCikisHareketleri.length} kayıt - Sayfa {girisCikisPage} / {girisCikisTotalPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setGirisCikisPage(prev => Math.max(1, prev - 1))}
                            disabled={girisCikisPage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Önceki
                          </button>
                          <button
                            onClick={() => setGirisCikisPage(prev => Math.min(girisCikisTotalPages, prev + 1))}
                            disabled={girisCikisPage === girisCikisTotalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Sonraki
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Düzenlemeler Tab Content */}
            {activeTab === 'duzenlemeler' && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-my-siyah"></div>
                  </div>
                ) : duzenlemeHareketleri.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-base sm:text-lg">Henüz düzenleme kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <>
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
                              {duzenlemePaginated.map((hareket) => (
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
                    
                    {/* Sayfalama */}
                    {duzenlemeTotalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                          Toplam {duzenlemeHareketleri.length} kayıt - Sayfa {duzenlemePage} / {duzenlemeTotalPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDuzenlemePage(prev => Math.max(1, prev - 1))}
                            disabled={duzenlemePage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Önceki
                          </button>
                          <button
                            onClick={() => setDuzenlemePage(prev => Math.min(duzenlemeTotalPages, prev + 1))}
                            disabled={duzenlemePage === duzenlemeTotalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Sonraki
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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

      {/* Üyelik Modal */}
      {isMembershipModalOpen && (
        <MembershipModal
          isOpen={isMembershipModalOpen}
          onClose={() => setIsMembershipModalOpen(false)}
          profileData={profileData}
          fetchWithAuth={fetchWithAuth}
          API_URL={API_URL}
        />
      )}
    </div>
  );
}

export default withAuth(SonHareketler);

