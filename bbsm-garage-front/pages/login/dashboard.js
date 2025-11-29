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

function Dashboard() {
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
  
  const [kartlar, setKartlar] = useState([]);
  const [teklifler, setTeklifler] = useState([]);
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

  const fetchKartlar = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/card`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setKartlar(data);
      }
    } catch (error) {
      console.error('Kartlar yükleme hatası:', error);
    }
  };

  const fetchTeklifler = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/teklif`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setTeklifler(data);
      }
    } catch (error) {
      console.error('Teklifler yükleme hatası:', error);
    }
  };

  const fetchHareketler = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/log/son-hareketler?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setHareketler(data);
      }
    } catch (error) {
      console.error('Hareketler yükleme hatası:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchKartlar(),
        fetchTeklifler(),
        fetchHareketler()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // İstatistikleri hesapla
  const hesaplaIstatistikler = () => {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    const bugunStr = bugun.toISOString().split('T')[0];

    const buAyBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
    const birOncekiAyBaslangic = new Date(bugun.getFullYear(), bugun.getMonth() - 1, 1);
    const birOncekiAyBitis = new Date(bugun.getFullYear(), bugun.getMonth(), 0);

    // Bugün eklenen kartlar
    const bugunEklenenKartlar = kartlar.filter(kart => {
      if (!kart.girisTarihi) return false;
      const kartTarihi = new Date(kart.girisTarihi);
      kartTarihi.setHours(0, 0, 0, 0);
      return kartTarihi.getTime() === bugun.getTime();
    });

    // Bu ayki kartlar
    const buAykiKartlar = kartlar.filter(kart => {
      if (!kart.girisTarihi) return false;
      const kartTarihi = new Date(kart.girisTarihi);
      return kartTarihi >= buAyBaslangic;
    });

    // Bir önceki ayki kartlar
    const birOncekiAykiKartlar = kartlar.filter(kart => {
      if (!kart.girisTarihi) return false;
      const kartTarihi = new Date(kart.girisTarihi);
      return kartTarihi >= birOncekiAyBaslangic && kartTarihi <= birOncekiAyBitis;
    });

    // Bu ayki gelir hesapla
    const hesaplaToplamFiyat = (yapilanlar) => {
      if (!yapilanlar || !Array.isArray(yapilanlar)) return 0;
      return yapilanlar.reduce((toplam, item) => {
        const birimFiyati = parseFloat(item.birimFiyati) || 0;
        const birimAdedi = parseInt(item.birimAdedi) || 0;
        return toplam + (birimFiyati * birimAdedi);
      }, 0);
    };

    const buAykiGelir = buAykiKartlar.reduce((toplam, kart) => {
      return toplam + hesaplaToplamFiyat(kart.yapilanlar);
    }, 0);

    const birOncekiAykiGelir = birOncekiAykiKartlar.reduce((toplam, kart) => {
      return toplam + hesaplaToplamFiyat(kart.yapilanlar);
    }, 0);

    // Son 7 günlük ciro
    const yediGunOnce = new Date();
    yediGunOnce.setDate(yediGunOnce.getDate() - 6);
    yediGunOnce.setHours(0, 0, 0, 0);
    const yediGunOnceStr = yediGunOnce.toISOString().split('T')[0];

    const son7GunKartlar = kartlar.filter(kart => {
      if (!kart.girisTarihi) return false;
      const kartTarihi = new Date(kart.girisTarihi);
      kartTarihi.setHours(0, 0, 0, 0);
      const kartTarihiStr = kartTarihi.toISOString().split('T')[0];
      return kartTarihiStr >= yediGunOnceStr && kartTarihiStr <= bugunStr;
    });

    const son7GunlukCiro = son7GunKartlar.reduce((toplam, kart) => {
      return toplam + hesaplaToplamFiyat(kart.yapilanlar);
    }, 0);

    // Son 7 günlük günlük gelir verileri (grafik için)
    const gunlukGelirVerileri = [];
    for (let i = 6; i >= 0; i--) {
      const tarih = new Date();
      tarih.setDate(tarih.getDate() - i);
      tarih.setHours(0, 0, 0, 0);
      const tarihStr = tarih.toISOString().split('T')[0];
      
      const oGunKartlar = kartlar.filter(kart => {
        if (!kart.girisTarihi) return false;
        const kartTarihi = new Date(kart.girisTarihi);
        kartTarihi.setHours(0, 0, 0, 0);
        return kartTarihi.getTime() === tarih.getTime();
      });

      const oGunGelir = oGunKartlar.reduce((toplam, kart) => {
        return toplam + hesaplaToplamFiyat(kart.yapilanlar);
      }, 0);

      gunlukGelirVerileri.push({
        tarih: tarihStr,
        gelir: oGunGelir,
        islemSayisi: oGunKartlar.length
      });
    }

    // En çok işlem yapılan kartlar (yapılanlar sayısına göre)
    const enCokIslemYapilanKartlar = [...kartlar]
      .map(kart => ({
        ...kart,
        islemSayisi: kart.yapilanlar ? kart.yapilanlar.length : 0,
        toplamGelir: hesaplaToplamFiyat(kart.yapilanlar)
      }))
      .sort((a, b) => b.islemSayisi - a.islemSayisi)
      .slice(0, 5);

    // En aktif kullanıcılar (hareketlerden)
    const kullaniciHareketSayilari = {};
    hareketler.forEach(hareket => {
      if (hareket.username) {
        kullaniciHareketSayilari[hareket.username] = (kullaniciHareketSayilari[hareket.username] || 0) + 1;
      }
    });
    const enAktifKullanicilar = Object.entries(kullaniciHareketSayilari)
      .map(([username, sayi]) => ({ username, sayi }))
      .sort((a, b) => b.sayi - a.sayi)
      .slice(0, 5);

    // Trend hesaplamaları
    const gelirTrend = birOncekiAykiGelir > 0 
      ? ((buAykiGelir - birOncekiAykiGelir) / birOncekiAykiGelir * 100).toFixed(1)
      : buAykiGelir > 0 ? 100 : 0;
    
    const kartTrend = birOncekiAykiKartlar.length > 0
      ? ((buAykiKartlar.length - birOncekiAykiKartlar.length) / birOncekiAykiKartlar.length * 100).toFixed(1)
      : buAykiKartlar.length > 0 ? 100 : 0;

    return {
      toplamKart: kartlar.length,
      toplamTeklif: teklifler.length,
      bugunEklenenKart: bugunEklenenKartlar.length,
      buAykiGelir,
      son7GunlukCiro,
      gunlukGelirVerileri,
      enCokIslemYapilanKartlar,
      enAktifKullanicilar,
      gelirTrend: parseFloat(gelirTrend),
      kartTrend: parseFloat(kartTrend),
      buAykiKartSayisi: buAykiKartlar.length,
      birOncekiAykiKartSayisi: birOncekiAykiKartlar.length
    };
  };

  const istatistikler = hesaplaIstatistikler();

  // Para formatı
  const formatPara = (tutar) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(tutar);
  };

  // Tarih formatı
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
    if (action === 'card_create') return 'Kart Ekledi';
    if (action === 'card_edit') return 'Kart Düzenledi';
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

  return (
    <div 
      className={`min-h-screen transition-all duration-1000 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Dashboard</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-all duration-500 ease-out ${isSidebarOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full sidebar-exit'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz relative z-40">
          <ul className="space-y-4">
            <li>
              <Link href="/login/dashboard" className="block p-3 text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Dashboard</Link>
            </li>
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
              <Link href="/login/son-hareketler" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Son Hareketler</Link>
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
                  <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-my-siyah"></span>
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
                    src="/images/yasin.webp" 
                    className="h-16 w-16 rounded-full object-cover" 
                    alt="Kullanıcı"
                  />
                </button>
                
                {isSettingsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSettingsOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dropdown-enter">
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
                          Profil Bilgileri
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
                        <div className="border-t border-gray-200 my-1"></div>
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

        <div className="p-6 pt-8 mt-20 lg:ml-64">
          <div className="p-4 md:p-6 mt-5 bg-my-beyaz rounded-3xl">
            {/* Başlık */}
            <div className="mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-my-siyah">Hoş Geldiniz, {firmaAdi}!</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Bugün mağazanızda neler oluyor?</p>
            </div>

            {/* KPI Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
              {/* Toplam Gelir */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base md:text-lg font-medium">Toplam Gelir</h3>
                  <div className={`flex items-center ${istatistikler.gelirTrend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    <svg className={`w-4 h-4 mr-1 ${istatistikler.gelirTrend < 0 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold">{Math.abs(istatistikler.gelirTrend).toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 break-words">{formatPara(istatistikler.buAykiGelir)}</p>
                <p className="text-xs text-blue-100">Bu ay</p>
              </div>

              {/* Toplam Kart */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base md:text-lg font-medium">Toplam Kart</h3>
                  <div className={`flex items-center ${istatistikler.kartTrend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    <svg className={`w-4 h-4 mr-1 ${istatistikler.kartTrend < 0 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold">{Math.abs(istatistikler.kartTrend).toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1">{istatistikler.toplamKart}</p>
                <p className="text-xs text-green-100">Toplam kayıt</p>
              </div>

              {/* Toplam Teklif */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base md:text-lg font-medium">Toplam Teklif</h3>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1">{istatistikler.toplamTeklif}</p>
                <p className="text-xs text-purple-100">Bekleyen teklifler</p>
              </div>

              {/* Bugün Eklenen */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base md:text-lg font-medium">Bugün Eklenen</h3>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1">{istatistikler.bugunEklenenKart}</p>
                <p className="text-xs text-orange-100">Yeni kayıt</p>
              </div>

              {/* Son 7 Günlük Ciro */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 md:p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base md:text-lg font-medium">Son 7 Günlük Ciro</h3>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 break-words">{formatPara(istatistikler.son7GunlukCiro)}</p>
                <p className="text-xs text-indigo-100">Haftalık ciro</p>
              </div>
            </div>

            {/* Grafik ve Liste Bölümü */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
              {/* Gelir Grafiği */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-my-siyah">Gelir Özeti</h2>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-gray-600">Gelir</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-300"></div>
                      <span className="text-gray-600">İşlem Sayısı</span>
                    </div>
                  </div>
                </div>
                <div className="h-64 relative">
                  {istatistikler.gunlukGelirVerileri && istatistikler.gunlukGelirVerileri.length > 0 ? (
                    <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
                      {(() => {
                        const maxGelir = Math.max(...istatistikler.gunlukGelirVerileri.map(d => d.gelir), 1);
                        const maxIslem = Math.max(...istatistikler.gunlukGelirVerileri.map(d => d.islemSayisi), 1);
                        const width = 400;
                        const height = 200;
                        const padding = 40;
                        const chartWidth = width - (padding * 2);
                        const chartHeight = height - (padding * 2);
                        const points = istatistikler.gunlukGelirVerileri.map((d, i) => {
                          const x = padding + (i / (istatistikler.gunlukGelirVerileri.length - 1 || 1)) * chartWidth;
                          const y = padding + chartHeight - (d.gelir / maxGelir) * chartHeight;
                          return { x, y, gelir: d.gelir, islem: d.islemSayisi };
                        });
                        const islemPoints = istatistikler.gunlukGelirVerileri.map((d, i) => {
                          const x = padding + (i / (istatistikler.gunlukGelirVerileri.length - 1 || 1)) * chartWidth;
                          const y = padding + chartHeight - (d.islemSayisi / maxIslem) * chartHeight;
                          return { x, y };
                        });
                        const gelirPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        const islemPath = islemPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                        return (
                          <>
                            <path d={gelirPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
                            <path d={islemPath} fill="none" stroke="#86efac" strokeWidth="2" strokeDasharray="5,5" />
                            {points.map((p, i) => (
                              <g key={i}>
                                <circle cx={p.x} cy={p.y} r="4" fill="#10b981" />
                                <text x={p.x} y={height - 5} textAnchor="middle" fill="#6b7280" fontSize="11">
                                  {new Date(istatistikler.gunlukGelirVerileri[i].tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                </text>
                              </g>
                            ))}
                            {/* Y ekseni etiketleri */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                              <text key={i} x={5} y={padding + chartHeight - (ratio * chartHeight)} textAnchor="start" fill="#9ca3af" fontSize="10">
                                {Math.round(maxGelir * ratio).toLocaleString('tr-TR')}
                              </text>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p className="text-sm">Grafik verisi bulunmamaktadır.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* En Çok İşlem Yapılan Kartlar */}
              <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-my-siyah">En Çok İşlem Yapılan Kartlar</h2>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : istatistikler.enCokIslemYapilanKartlar && istatistikler.enCokIslemYapilanKartlar.length > 0 ? (
                    istatistikler.enCokIslemYapilanKartlar.map((kart, index) => (
                      <div key={kart.id || index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {kart.markaModel ? kart.markaModel.substring(0, 2).toUpperCase() : 'KT'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-my-siyah truncate">{kart.markaModel || 'İsimsiz Kart'}</p>
                          <p className="text-xs text-gray-500">ID: {kart.id || '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-my-siyah">{kart.islemSayisi || 0}</p>
                          <p className="text-xs text-gray-500">İşlem</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">Henüz işlem yapılan kart bulunmamaktadır.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alt Bölüm - Son İşlemler ve En Aktif Kullanıcılar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Son İşlemler */}
              <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-my-siyah">Son İşlemler</h2>
                  <Link href="/login/son-hareketler" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Tümünü Gör
                  </Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                  </div>
                ) : hareketler.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-sm">Henüz hareket kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hareketler.slice(0, 5).map((hareket) => (
                      <div key={hareket.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(hareket.action)}`}>
                            <span className="text-xs font-semibold">
                              {hareket.action === 'login' ? '🔓' : hareket.action === 'logout' ? '🔒' : hareket.action === 'card_create' ? '➕' : hareket.action === 'card_edit' ? '✏️' : '🗑️'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-my-siyah truncate">{getActionLabel(hareket.action)}</p>
                            <p className="text-xs text-gray-500 truncate">{hareket.action_detail || '-'}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs font-medium text-my-siyah">{hareket.username}</p>
                          <p className="text-xs text-gray-500">{formatTarih(hareket.timestamp).split(' ')[0]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* En Aktif Kullanıcılar */}
              <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-my-siyah">En Aktif Kullanıcılar</h2>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : istatistikler.enAktifKullanicilar && istatistikler.enAktifKullanicilar.length > 0 ? (
                  <div className="space-y-3">
                    {istatistikler.enAktifKullanicilar.map((kullanici, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {kullanici.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-my-siyah truncate">{kullanici.username}</p>
                            <p className="text-xs text-gray-500">{kullanici.sayi} işlem</p>
                          </div>
                        </div>
                        <Link href="/login/son-hareketler" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          Görüntüle
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">Henüz aktif kullanıcı bulunmamaktadır.</p>
                  </div>
                )}
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
  );
}

export default withAuth(Dashboard);

