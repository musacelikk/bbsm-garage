import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';
import { useTheme } from '../../contexts/ThemeContext';

function SonHareketler() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const { activeTheme } = useTheme();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [hareketler, setHareketler] = useState([]);
  const [activeTab, setActiveTab] = useState('sistem-islemleri');
  const [girisCikisPage, setGirisCikisPage] = useState(1);
  const [duzenlemePage, setDuzenlemePage] = useState(1);
  const itemsPerPage = 20;
  const [filtreArama, setFiltreArama] = useState('');
  const [filtreKullanici, setFiltreKullanici] = useState('');
  const [filtreAction, setFiltreAction] = useState('hepsi');
  const [filtreBaslangicTarihi, setFiltreBaslangicTarihi] = useState('');
  const [filtreBitisTarihi, setFiltreBitisTarihi] = useState('');

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
    if (action === 'excel_download') return 'Excel İndirdi';
    if (action === 'excel_full_export') return 'Veri Yedekleme Alındı';
    if (action === 'pdf_download') return 'PDF İndirdi';
    if (action === 'teklif_create') return 'Teklif Oluşturdu';
    if (action === 'teklif_update') return 'Teklif Güncelledi';
    if (action === 'teklif_delete') return 'Teklif Sildi';
    if (action === 'teklif_to_card') return 'Teklif → Kart Aktardı';
    if (action === 'stok_create') return 'Stok Ekledi';
    if (action === 'stok_delete') return 'Stok Sildi';
    if (action === 'stok_update') return 'Stok Güncelledi';
    if (action === 'stok_restore') return 'Stok Geri Yüklendi';
    if (action === 'oneri_send') return 'Öneri Gönderdi';
    if (action === 'oneri_approve') return 'Öneri Onaylandı';
    if (action === 'oneri_reject') return 'Öneri Reddedildi';
    if (action === 'payment_update') return 'Ödeme Durumu Güncellendi';
    if (action === 'password_change') return 'Şifre Değiştirdi';
    if (action === 'profile_update') return 'Profil Güncelledi';
    if (action === 'theme_change') return 'Tema Değiştirildi';
    if (action === 'membership_add') return 'Üyelik Eklendi';
    if (action === 'membership_request_approve') return 'Üyelik Teklifi Onaylandı';
    if (action === 'membership_request_reject') return 'Üyelik Teklifi Reddedildi';
    if (action === 'contact_message') return 'Bize Ulaş Mesajı Gönderildi';
    return action;
  };

  const getActionColor = (action) => {
    if (action === 'login') return 'text-green-400 bg-green-500/20';
    if (action === 'logout') return 'text-red-400 bg-red-500/20';
    if (action === 'card_edit') return 'text-blue-400 bg-blue-500/20';
    if (action === 'card_create') return 'text-purple-400 bg-purple-500/20';
    if (action === 'card_delete') return 'text-red-400 bg-red-500/30';
    if (action === 'excel_download') return 'text-green-400 bg-green-500/20';
    if (action === 'excel_full_export') return 'text-emerald-400 bg-emerald-500/20';
    if (action === 'pdf_download') return 'text-orange-400 bg-orange-500/20';
    if (action === 'teklif_create') return 'text-cyan-400 bg-cyan-500/20';
    if (action === 'teklif_update') return 'text-cyan-400 bg-cyan-500/20';
    if (action === 'teklif_delete') return 'text-red-400 bg-red-500/30';
    if (action === 'teklif_to_card') return 'text-blue-400 bg-blue-500/20';
    if (action === 'stok_create') return 'text-emerald-400 bg-emerald-500/20';
    if (action === 'stok_delete') return 'text-red-400 bg-red-500/30';
    if (action === 'stok_update') return 'text-yellow-400 bg-yellow-500/20';
    if (action === 'stok_restore') return 'text-teal-400 bg-teal-500/20';
    if (action === 'oneri_send') return 'text-indigo-400 bg-indigo-500/20';
    if (action === 'oneri_approve') return 'text-green-400 bg-green-500/20';
    if (action === 'oneri_reject') return 'text-red-400 bg-red-500/20';
    if (action === 'payment_update') return 'text-amber-400 bg-amber-500/20';
    if (action === 'password_change') return 'text-pink-400 bg-pink-500/20';
    if (action === 'profile_update') return 'text-violet-400 bg-violet-500/20';
    if (action === 'theme_change') return 'text-purple-400 bg-purple-500/20';
    if (action === 'membership_add') return 'text-teal-400 bg-teal-500/20';
    if (action === 'membership_request_approve') return 'text-green-400 bg-green-500/20';
    if (action === 'membership_request_reject') return 'text-red-400 bg-red-500/20';
    if (action === 'contact_message') return 'text-blue-400 bg-blue-500/20';
    return 'dark-text-muted dark-bg-tertiary';
  };

  // Filtreleme fonksiyonu
  const filtreleHareketler = (hareketListesi) => {
    let filtrelenmis = [...hareketListesi];

    // Arama filtresi
    if (filtreArama && filtreArama.trim() !== '') {
      const arama = filtreArama.toLowerCase().trim();
      filtrelenmis = filtrelenmis.filter(h => {
        const actionLabel = getActionLabel(h.action).toLowerCase();
        const actionDetail = (h.action_detail || '').toLowerCase();
        const username = (h.username || '').toLowerCase();
        return actionLabel.includes(arama) || actionDetail.includes(arama) || username.includes(arama);
      });
    }

    // Kullanıcı filtresi
    if (filtreKullanici && filtreKullanici.trim() !== '') {
      const kullanici = filtreKullanici.toLowerCase().trim();
      filtrelenmis = filtrelenmis.filter(h => 
        (h.username || '').toLowerCase().includes(kullanici)
      );
    }

    // Action tipi filtresi
    if (filtreAction !== 'hepsi') {
      filtrelenmis = filtrelenmis.filter(h => h.action === filtreAction);
    }

    // Tarih filtresi
    if (filtreBaslangicTarihi && filtreBitisTarihi) {
      filtrelenmis = filtrelenmis.filter(h => {
        if (!h.timestamp) return false;
        const hareketTarihi = new Date(h.timestamp).toISOString().split('T')[0];
        return hareketTarihi >= filtreBaslangicTarihi && hareketTarihi <= filtreBitisTarihi;
      });
    } else if (filtreBaslangicTarihi) {
      filtrelenmis = filtrelenmis.filter(h => {
        if (!h.timestamp) return false;
        const hareketTarihi = new Date(h.timestamp).toISOString().split('T')[0];
        return hareketTarihi >= filtreBaslangicTarihi;
      });
    } else if (filtreBitisTarihi) {
      filtrelenmis = filtrelenmis.filter(h => {
        if (!h.timestamp) return false;
        const hareketTarihi = new Date(h.timestamp).toISOString().split('T')[0];
        return hareketTarihi <= filtreBitisTarihi;
      });
    }

    return filtrelenmis;
  };

  // Hareketleri kategorilere ayır
  // Sistem İşlemleri: Giriş/çıkış hariç tüm işlemler
  const girisCikisHareketleri = filtreleHareketler(
    hareketler.filter(h => 
      h.action !== 'login' && 
      h.action !== 'logout' &&
      (h.action === 'excel_download' || 
      h.action === 'excel_full_export' ||
      h.action === 'pdf_download' || 
      h.action === 'teklif_create' || 
      h.action === 'teklif_update' ||
      h.action === 'teklif_delete' || 
      h.action === 'teklif_to_card' ||
      h.action === 'stok_create' ||
      h.action === 'stok_delete' ||
      h.action === 'stok_update' ||
      h.action === 'stok_restore' ||
      h.action === 'oneri_send' ||
      h.action === 'oneri_approve' ||
      h.action === 'oneri_reject' ||
      h.action === 'payment_update' ||
      h.action === 'password_change' ||
      h.action === 'profile_update' ||
      h.action === 'theme_change' ||
      h.action === 'membership_add' ||
      h.action === 'membership_request_approve' ||
      h.action === 'membership_request_reject' ||
      h.action === 'contact_message' ||
      h.action === 'card_create' ||
      h.action === 'card_edit' ||
      h.action === 'card_delete')
    )
  );
  // Düzenlemeler: Sadece kart işlemleri
  const duzenlemeHareketleri = filtreleHareketler(
    hareketler.filter(h => h.action === 'card_edit' || h.action === 'card_create' || h.action === 'card_delete')
  );

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
        setIsProfileModalOpen={() => {}}
        setIsChangePasswordModalOpen={() => {}}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <ProtectedPage>
          <div className="p-3 md:p-4 lg:p-6 pt-4 md:pt-6 lg:pt-8 mt-16 lg:ml-64 dark-bg-primary">
            <div className="p-3 md:p-4 lg:p-6 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl">
              <div className="flex items-center pb-4 justify-between">
                <div className="flex items-center">
                  <div className="pr-4 items-center">
                    <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between">
                      <p className="font-semibold text-base md:text-lg dark-text-primary">Son Hareketler</p>
                    </div>
                  </div>
                </div>
              </div>
            
            {/* Filtreler */}
            <div className="mb-4 dark-card-bg neumorphic-card rounded-lg p-3 md:p-4">
              <h3 className="text-sm md:text-base font-medium dark-text-primary mb-3">Filtreler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Arama</label>
                  <input
                    type="text"
                    placeholder="İşlem, kullanıcı veya detay ara..."
                    value={filtreArama}
                    onChange={(e) => setFiltreArama(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Kullanıcı</label>
                  <input
                    type="text"
                    placeholder="Kullanıcı adı..."
                    value={filtreKullanici}
                    onChange={(e) => setFiltreKullanici(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">İşlem Tipi</label>
                  <select
                    value={filtreAction}
                    onChange={(e) => setFiltreAction(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                  >
                    <option value="hepsi">Hepsi</option>
                    <option value="card_create">Kart Ekleme</option>
                    <option value="card_edit">Kart Düzenleme</option>
                    <option value="card_delete">Kart Silme</option>
                    <option value="teklif_create">Teklif Oluşturma</option>
                    <option value="teklif_update">Teklif Güncelleme</option>
                    <option value="teklif_delete">Teklif Silme</option>
                    <option value="teklif_to_card">Teklif → Kart</option>
                    <option value="stok_create">Stok Ekleme</option>
                    <option value="stok_update">Stok Güncelleme</option>
                    <option value="stok_delete">Stok Silme</option>
                    <option value="stok_restore">Stok Geri Yükleme</option>
                    <option value="oneri_send">Öneri Gönderme</option>
                    <option value="oneri_approve">Öneri Onaylama</option>
                    <option value="oneri_reject">Öneri Reddetme</option>
                    <option value="excel_download">Excel İndirme</option>
                    <option value="excel_full_export">Veri Yedekleme</option>
                    <option value="pdf_download">PDF İndirme</option>
                    <option value="payment_update">Ödeme Güncelleme</option>
                    <option value="password_change">Şifre Değiştirme</option>
                    <option value="profile_update">Profil Güncelleme</option>
                    <option value="theme_change">Tema Değiştirme</option>
                    <option value="membership_add">Üyelik Ekleme</option>
                    <option value="membership_request_approve">Üyelik Teklifi Onaylama</option>
                    <option value="membership_request_reject">Üyelik Teklifi Reddetme</option>
                    <option value="contact_message">Bize Ulaş Mesajı</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Başlangıç</label>
                    <input
                      type="date"
                      value={filtreBaslangicTarihi}
                      onChange={(e) => setFiltreBaslangicTarihi(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Bitiş</label>
                    <input
                      type="date"
                      value={filtreBitisTarihi}
                      onChange={(e) => setFiltreBitisTarihi(e.target.value)}
                      className="w-full px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
              {(filtreArama || filtreKullanici || filtreAction !== 'hepsi' || filtreBaslangicTarihi || filtreBitisTarihi) && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => {
                      setFiltreArama('');
                      setFiltreKullanici('');
                      setFiltreAction('hepsi');
                      setFiltreBaslangicTarihi('');
                      setFiltreBitisTarihi('');
                    }}
                    className="px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-blue-500 hover:bg-blue-600 transition-all touch-manipulation min-h-[36px] active:scale-95 text-white"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>
            
            {/* Tab Navigation */}
            <div className="dark-card-bg neumorphic-card rounded-lg mb-4 sm:mb-6">
              <div className="border-b dark-border">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => {
                      setActiveTab('sistem-islemleri');
                      setGirisCikisPage(1);
                    }}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-semibold text-sm transition-colors ${
                      activeTab === 'sistem-islemleri'
                        ? 'border-green-400 text-green-400'
                        : 'border-transparent dark-text-muted hover:dark-text-secondary hover:border-dark-border'
                    }`}
                  >
                    Sistem İşlemleri
                    {girisCikisHareketleri.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs neumorphic-inset ${
                        activeTab === 'sistem-islemleri' ? 'bg-green-500/20 text-green-400' : 'dark-bg-tertiary dark-text-muted'
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

            {/* Sistem İşlemleri Tab Content */}
            {activeTab === 'sistem-islemleri' && (
              <div className="dark-card-bg neumorphic-card rounded-lg p-4 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                  </div>
                ) : girisCikisHareketleri.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="dark-text-muted text-base sm:text-lg">Henüz sistem işlemi kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                          <table className="min-w-full text-xs divide-y dark-border">
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
                                    <div className="text-xs font-medium dark-text-primary">{hareket.username}</div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(hareket.action)}`}>
                                        {getActionLabel(hareket.action)}
                                      </span>
                                      {hareket.action === 'stok_restore' && hareket.duzenleyen && (
                                        <span className="text-xs dark-text-muted whitespace-nowrap">{hareket.duzenleyen}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs dark-text-secondary">
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
                          <table className="min-w-full text-xs divide-y dark-border">
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
                                    <div className="text-xs font-medium dark-text-primary">{hareket.username}</div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${getActionColor(hareket.action)}`}>
                                      {getActionLabel(hareket.action)}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                    <div className="text-xs dark-text-secondary">{hareket.duzenleyen || '-'}</div>
                                  </td>
                                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs dark-text-secondary">
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

    </div>
  );
}

export default withAuth(SonHareketler);

