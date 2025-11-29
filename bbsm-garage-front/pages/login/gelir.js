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
import { useSwipe, useVerticalSwipe } from '../../hooks/useTouchGestures';

function Gelir() {
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

  const [kartlar, setKartlar] = useState([]);
  const [teklifler, setTeklifler] = useState([]);
  const [baslangicTarihi, setBaslangicTarihi] = useState('');
  const [bitisTarihi, setBitisTarihi] = useState('');

  // Varsayılan tarihleri ayarla (bugün ve 30 gün öncesi)
  useEffect(() => {
    const bugun = new Date();
    const otuzGunOnce = new Date();
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);
    
    setBitisTarihi(bugun.toISOString().split('T')[0]);
    setBaslangicTarihi(otuzGunOnce.toISOString().split('T')[0]);
  }, []);

  const fetchKartlar = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/card`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setKartlar(data);
      }
    } catch (error) {
      console.error('Kartlar yükleme hatası:', error);
    }
    setLoading(false);
  };

  const fetchTeklifler = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/teklif`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setTeklifler(data);
      }
    } catch (error) {
      console.error('Teklifler yükleme hatası:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKartlar();
    fetchTeklifler();
  }, []);

  // Tarih formatını düzelt (YYYY-MM-DD formatına çevir)
  const formatTarih = (tarih) => {
    if (!tarih) return null;
    // Eğer zaten YYYY-MM-DD formatındaysa direkt döndür
    if (tarih.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return tarih;
    }
    // Diğer formatları parse et
    const date = new Date(tarih);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  };

  // Tarih aralığında mı kontrol et
  const tarihAraligindaMi = (tarih, baslangic, bitis) => {
    if (!tarih) return false;
    const tarihFormatted = formatTarih(tarih);
    const baslangicFormatted = formatTarih(baslangic);
    const bitisFormatted = formatTarih(bitis);
    
    if (!tarihFormatted || !baslangicFormatted || !bitisFormatted) return false;
    
    return tarihFormatted >= baslangicFormatted && tarihFormatted <= bitisFormatted;
  };

  // Yapılanlar toplam fiyatını hesapla
  const hesaplaToplamFiyat = (yapilanlar) => {
    if (!yapilanlar || !Array.isArray(yapilanlar)) return 0;
    return yapilanlar.reduce((toplam, item) => {
      // Önce toplamFiyat alanını kontrol et, yoksa hesapla
      if (item.toplamFiyat !== undefined && item.toplamFiyat !== null) {
        return toplam + (parseFloat(item.toplamFiyat) || 0);
      }
      // toplamFiyat yoksa birimFiyati * birimAdedi ile hesapla
      const birimFiyati = parseFloat(item.birimFiyati) || 0;
      const birimAdedi = parseInt(item.birimAdedi, 10) || 0;
      return toplam + (birimFiyati * birimAdedi);
    }, 0);
  };

  // Filtrelenmiş verileri hesapla
  const hesaplaGelirVerileri = () => {
    let filtrelenmisKartlar = [];
    let filtrelenmisTeklifler = [];

    if (baslangicTarihi && bitisTarihi) {
      filtrelenmisKartlar = kartlar.filter(kart => 
        tarihAraligindaMi(kart.girisTarihi, baslangicTarihi, bitisTarihi)
      );
      filtrelenmisTeklifler = teklifler.filter(teklif => 
        tarihAraligindaMi(teklif.girisTarihi, baslangicTarihi, bitisTarihi)
      );
    } else {
      filtrelenmisKartlar = kartlar;
      filtrelenmisTeklifler = teklifler;
    }

    // Toplam gelir hesapla
    const kartlarToplam = filtrelenmisKartlar.reduce((toplam, kart) => {
      return toplam + hesaplaToplamFiyat(kart.yapilanlar);
    }, 0);

    const tekliflerToplam = filtrelenmisTeklifler.reduce((toplam, teklif) => {
      return toplam + hesaplaToplamFiyat(teklif.yapilanlar);
    }, 0);

    const toplamGelir = kartlarToplam + tekliflerToplam;
    const toplamIslemSayisi = filtrelenmisKartlar.length + filtrelenmisTeklifler.length;
    
    // Son 7 günlük ciro hesapla
    let son7GunlukCiro = 0;
    const bugun = new Date();
    const yediGunOnce = new Date();
    yediGunOnce.setDate(yediGunOnce.getDate() - 7);
    const yediGunOnceStr = yediGunOnce.toISOString().split('T')[0];
    const bugunStr = bugun.toISOString().split('T')[0];
    
    const son7GunKartlar = kartlar.filter(kart => 
      tarihAraligindaMi(kart.girisTarihi, yediGunOnceStr, bugunStr)
    );
    const son7GunTeklifler = teklifler.filter(teklif => 
      tarihAraligindaMi(teklif.girisTarihi, yediGunOnceStr, bugunStr)
    );
    
    const son7GunKartlarToplam = son7GunKartlar.reduce((toplam, kart) => {
      return toplam + hesaplaToplamFiyat(kart.yapilanlar);
    }, 0);
    
    const son7GunTekliflerToplam = son7GunTeklifler.reduce((toplam, teklif) => {
      return toplam + hesaplaToplamFiyat(teklif.yapilanlar);
    }, 0);
    
    son7GunlukCiro = son7GunKartlarToplam + son7GunTekliflerToplam;

    // Günlük gelir hesapla
    const gunlukGelir = {};
    [...filtrelenmisKartlar, ...filtrelenmisTeklifler].forEach(item => {
      const tarih = formatTarih(item.girisTarihi);
      if (tarih) {
        if (!gunlukGelir[tarih]) {
          gunlukGelir[tarih] = { gelir: 0, islemSayisi: 0 };
        }
        gunlukGelir[tarih].gelir += hesaplaToplamFiyat(item.yapilanlar);
        gunlukGelir[tarih].islemSayisi += 1;
      }
    });

    // Aylık gelir hesapla
    const aylikGelir = {};
    Object.keys(gunlukGelir).forEach(tarih => {
      const ay = tarih.substring(0, 7); // YYYY-MM formatı
      if (!aylikGelir[ay]) {
        aylikGelir[ay] = { gelir: 0, islemSayisi: 0 };
      }
      aylikGelir[ay].gelir += gunlukGelir[tarih].gelir;
      aylikGelir[ay].islemSayisi += gunlukGelir[tarih].islemSayisi;
    });

    // En çok gelir getiren günler
    const enCokGelirGunler = Object.entries(gunlukGelir)
      .map(([tarih, data]) => ({ tarih, ...data }))
      .sort((a, b) => b.gelir - a.gelir)
      .slice(0, 10);

    return {
      toplamGelir,
      toplamIslemSayisi,
      son7GunlukCiro,
      gunlukGelir,
      aylikGelir,
      enCokGelirGunler,
      filtrelenmisKartlar,
      filtrelenmisTeklifler
    };
  };

  const gelirVerileri = hesaplaGelirVerileri();

  // Para formatı
  const formatPara = (tutar) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(tutar);
  };

  // Tarih formatı (güzel görünüm için)
  const formatTarihGuzel = (tarih) => {
    if (!tarih) return '-';
    const date = new Date(tarih);
    if (isNaN(date.getTime())) return tarih;
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Pull to refresh için
  const handlePullToRefresh = () => {
    fetchKartlar();
    fetchTeklifler();
  };

  // Sidebar için swipe gesture (sağdan sola swipe ile açma)
  const sidebarSwipe = useSwipe(
    null, // swipe left
    () => setIsSidebarOpen(true), // swipe right - sidebar'ı aç
    null,
    null,
    50
  );

  // Pull to refresh gesture
  const pullToRefresh = useVerticalSwipe(
    null,
    handlePullToRefresh, // Aşağı swipe - refresh
    100
  );

  const handleGunlukCiro = () => {
    const bugun = new Date();
    const bugunStr = bugun.toISOString().split('T')[0];
    setBaslangicTarihi(bugunStr);
    setBitisTarihi(bugunStr);
  };

  return (
    <div 
      className={`min-h-screen transition-all duration-1000 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Gelir Raporu</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="gelir"
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

        <div 
          className="p-6 pt-8 mt-20 lg:ml-64"
          {...pullToRefresh}
        >
          <div className="p-4 md:p-6 mt-5 bg-my-beyaz rounded-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-my-siyah mb-4 md:mb-6">Gelir Raporu</h1>

            {/* Filtreler */}
            <div className="mb-6 p-3 md:p-4 bg-gray-50 rounded-xl">
              <div className="flex flex-col md:flex-row md:flex-wrap gap-4 items-end">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <div className="flex-1 md:flex-none">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={baslangicTarihi}
                      onChange={(e) => setBaslangicTarihi(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px]"
                    />
                  </div>
                  <div className="flex-1 md:flex-none">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={bitisTarihi}
                      onChange={(e) => setBitisTarihi(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px]"
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-auto">
                  <button
                    onClick={handleGunlukCiro}
                    className="w-full md:w-auto px-6 py-3 rounded-full font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all touch-manipulation min-h-[44px] active:scale-95"
                  >
                    Günlük Ciro
                  </button>
                </div>
              </div>
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <h3 className="text-base md:text-lg font-medium mb-2">Toplam Gelir</h3>
                <p className="text-2xl md:text-3xl font-bold break-words">{formatPara(gelirVerileri.toplamGelir)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <h3 className="text-base md:text-lg font-medium mb-2">Toplam İşlem Sayısı</h3>
                <p className="text-2xl md:text-3xl font-bold">{gelirVerileri.toplamIslemSayisi}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <h3 className="text-base md:text-lg font-medium mb-2">Son 7 Günlük Ciro</h3>
                <p className="text-2xl md:text-3xl font-bold break-words">{formatPara(gelirVerileri.son7GunlukCiro)}</p>
              </div>
            </div>

            {/* Günlük Gelir Tablosu */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4">Günlük Gelir Detayları</h2>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gelir</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Ortalama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(gelirVerileri.gunlukGelir)
                      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                      .map(([tarih, data]) => (
                        <tr key={tarih} className="hover:bg-gray-50 active:bg-gray-100">
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-medium text-gray-900">
                            <div className="md:hidden">{new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</div>
                            <div className="hidden md:block">{formatTarihGuzel(tarih)}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900 font-semibold">
                            {formatPara(data.gelir)}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900">
                            {data.islemSayisi}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900 hidden md:table-cell">
                            {formatPara(data.gelir / data.islemSayisi)}
                          </td>
                        </tr>
                      ))}
                    {Object.keys(gelirVerileri.gunlukGelir).length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          Seçilen tarih aralığında veri bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aylık Gelir Tablosu */}
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4">Aylık Gelir Özeti</h2>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ay</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gelir</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Ortalama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(gelirVerileri.aylikGelir)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .map(([ay, data]) => {
                        const [yil, ayNumarasi] = ay.split('-');
                        const ayAdi = new Date(yil, parseInt(ayNumarasi) - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                        const ayAdiKisa = new Date(yil, parseInt(ayNumarasi) - 1).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
                        return (
                          <tr key={ay} className="hover:bg-gray-50 active:bg-gray-100">
                            <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-medium text-gray-900 capitalize">
                              <div className="md:hidden">{ayAdiKisa}</div>
                              <div className="hidden md:block">{ayAdi}</div>
                            </td>
                            <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900 font-semibold">
                              {formatPara(data.gelir)}
                            </td>
                            <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900">
                              {data.islemSayisi}
                            </td>
                            <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900 hidden md:table-cell">
                              {formatPara(data.gelir / data.islemSayisi)}
                            </td>
                          </tr>
                        );
                      })}
                    {Object.keys(gelirVerileri.aylikGelir).length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          Seçilen tarih aralığında veri bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* En Çok Gelir Getiren Günler */}
            {gelirVerileri.enCokGelirGunler.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4">En Çok Gelir Getiren Günler (Top 10)</h2>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gelir</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {gelirVerileri.enCokGelirGunler.map((item, index) => (
                        <tr key={item.tarih} className="hover:bg-gray-50 active:bg-gray-100">
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900">
                            <div className="md:hidden">{new Date(item.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</div>
                            <div className="hidden md:block">{formatTarihGuzel(item.tarih)}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900 font-semibold">
                            {formatPara(item.gelir)}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs md:text-sm text-gray-900">
                            {item.islemSayisi}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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

        {/* WhatsApp Destek Butonu */}
        <a
          href="https://wa.me/905424873202"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[9999] bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
          aria-label="WhatsApp Destek"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="ml-2 text-sm font-medium">Destek</span>
        </a>
      </div>
    </div>
  );
}

export default withAuth(Gelir);

