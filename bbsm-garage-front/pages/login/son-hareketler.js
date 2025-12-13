import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import ProfileModal from '../../components/ProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';

function SonHareketler() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [hareketler, setHareketler] = useState([]);
  const [activeTab, setActiveTab] = useState('giris-cikis');
  const [girisCikisPage, setGirisCikisPage] = useState(1);
  const [duzenlemePage, setDuzenlemePage] = useState(1);
  const itemsPerPage = 20;

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
    if (action === 'login') return 'text-green-400 bg-green-500/20';
    if (action === 'logout') return 'text-red-400 bg-red-500/20';
    if (action === 'card_edit') return 'text-blue-400 bg-blue-500/20';
    if (action === 'card_create') return 'text-purple-400 bg-purple-500/20';
    if (action === 'card_delete') return 'text-red-400 bg-red-500/30';
    return 'dark-text-muted dark-bg-tertiary';
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
    <div {...sidebarSwipe} className="min-h-screen dark-bg-primary">
      <Head>
        <title>BBSM Garage - Son Hareketler</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="son-hareketler"
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <ProtectedPage>
          <div className="pt-16 pb-6 md:pb-8 px-3 md:px-4 lg:px-8 lg:ml-64">
            <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-xl md:text-2xl font-semibold dark-text-primary mb-3 md:mb-4">Son Hareketler</h1>
            
            {/* Tab Navigation */}
            <div className="dark-card-bg neumorphic-card rounded-lg mb-4 sm:mb-6">
              <div className="border-b dark-border">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => {
                      setActiveTab('giris-cikis');
                      setGirisCikisPage(1);
                    }}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                      activeTab === 'giris-cikis'
                        ? 'border-green-400 text-green-400'
                        : 'border-transparent dark-text-muted hover:dark-text-secondary hover:border-dark-border'
                    }`}
                  >
                    Giriş/Çıkış
                    {girisCikisHareketleri.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs neumorphic-inset ${
                        activeTab === 'giris-cikis' ? 'bg-green-500/20 text-green-400' : 'dark-bg-tertiary dark-text-muted'
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
                        ? 'border-blue-400 text-blue-400'
                        : 'border-transparent dark-text-muted hover:dark-text-secondary hover:border-dark-border'
                    }`}
                  >
                    Düzenlemeler
                    {duzenlemeHareketleri.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs neumorphic-inset ${
                        activeTab === 'duzenlemeler' ? 'bg-blue-500/20 text-blue-400' : 'dark-bg-tertiary dark-text-muted'
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
              <div className="dark-card-bg neumorphic-card rounded-lg p-4 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  </div>
                ) : girisCikisHareketleri.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="dark-text-muted text-base sm:text-lg">Henüz giriş/çıkış kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                          <table className="min-w-full divide-y dark-border">
                            <thead className="dark-bg-tertiary neumorphic-inset">
                              <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">
                                  Kullanıcı
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">
                                  İşlem
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">
                                  Tarih ve Saat
                                </th>
                              </tr>
                            </thead>
                            <tbody className="dark-card-bg divide-y dark-border">
                              {girisCikisPaginated.map((hareket) => (
                                <tr key={hareket.id} className="hover:dark-bg-tertiary active:dark-bg-secondary transition-colors">
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs sm:text-sm font-medium dark-text-primary">{hareket.username}</div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(hareket.action)}`}>
                                      {getActionLabel(hareket.action)}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm dark-text-secondary">
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
                      <div className="flex items-center justify-between mt-6 pt-4 border-t dark-border">
                        <div className="text-sm dark-text-secondary">
                          Toplam {girisCikisHareketleri.length} kayıt - Sayfa {girisCikisPage} / {girisCikisTotalPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setGirisCikisPage(prev => Math.max(1, prev - 1))}
                            disabled={girisCikisPage === 1}
                            className="px-4 py-2 text-sm font-medium dark-text-primary dark-card-bg neumorphic-inset rounded-lg hover:dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Önceki
                          </button>
                          <button
                            onClick={() => setGirisCikisPage(prev => Math.min(girisCikisTotalPages, prev + 1))}
                            disabled={girisCikisPage === girisCikisTotalPages}
                            className="px-4 py-2 text-sm font-medium dark-text-primary dark-card-bg neumorphic-inset rounded-lg hover:dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <div className="dark-card-bg neumorphic-card rounded-lg p-4 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  </div>
                ) : duzenlemeHareketleri.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="dark-text-muted text-base sm:text-lg">Henüz düzenleme kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                          <table className="min-w-full divide-y dark-border">
                            <thead className="dark-bg-tertiary neumorphic-inset">
                              <tr>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">
                                  Kullanıcı
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">
                                  İşlem
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">
                                  Düzenleyen
                                </th>
                                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">
                                  Tarih ve Saat
                                </th>
                              </tr>
                            </thead>
                            <tbody className="dark-card-bg divide-y dark-border">
                              {duzenlemePaginated.map((hareket) => (
                                <tr key={hareket.id} className="hover:dark-bg-tertiary active:dark-bg-secondary transition-colors">
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs sm:text-sm font-medium dark-text-primary">{hareket.username}</div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(hareket.action)}`}>
                                      {getActionLabel(hareket.action)}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs sm:text-sm dark-text-secondary">{hareket.duzenleyen || '-'}</div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm dark-text-secondary">
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
                      <div className="flex items-center justify-between mt-6 pt-4 border-t dark-border">
                        <div className="text-sm dark-text-secondary">
                          Toplam {duzenlemeHareketleri.length} kayıt - Sayfa {duzenlemePage} / {duzenlemeTotalPages}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDuzenlemePage(prev => Math.max(1, prev - 1))}
                            disabled={duzenlemePage === 1}
                            className="px-4 py-2 text-sm font-medium dark-text-primary dark-card-bg neumorphic-inset rounded-lg hover:dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Önceki
                          </button>
                          <button
                            onClick={() => setDuzenlemePage(prev => Math.min(duzenlemeTotalPages, prev + 1))}
                            disabled={duzenlemePage === duzenlemeTotalPages}
                            className="px-4 py-2 text-sm font-medium dark-text-primary dark-card-bg neumorphic-inset rounded-lg hover:dark-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        </ProtectedPage>
      </div>

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

export default withAuth(SonHareketler);

