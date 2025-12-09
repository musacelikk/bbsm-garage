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

function Dashboard() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, firmaAdi, refreshProfile } = useProfile();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [kartlar, setKartlar] = useState([]);
  const [teklifler, setTeklifler] = useState([]);
  const [hareketler, setHareketler] = useState([]);
  const [tarihBaslangic, setTarihBaslangic] = useState(() => {
    const yil = new Date().getFullYear();
    return `${yil}-01-01`;
  });
  const [tarihBitis, setTarihBitis] = useState(() => {
    const bugun = new Date();
    return bugun.toISOString().split('T')[0];
  });


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

    // Tarih aralığına göre gelir verileri (aylık veya günlük)
    const baslangicTarihi = new Date(tarihBaslangic);
    const bitisTarihi = new Date(tarihBitis);
    bitisTarihi.setHours(23, 59, 59, 999);
    
    const gunFarki = Math.ceil((bitisTarihi - baslangicTarihi) / (1000 * 60 * 60 * 24));
    const aylikGosterim = gunFarki > 90;
    
    const gelirVerileri = [];
    
    if (aylikGosterim) {
      const baslangicAy = baslangicTarihi.getMonth();
      const baslangicYil = baslangicTarihi.getFullYear();
      const bitisAy = bitisTarihi.getMonth();
      const bitisYil = bitisTarihi.getFullYear();
      
      let mevcutAy = baslangicAy;
      let mevcutYil = baslangicYil;
      
      while (mevcutYil < bitisYil || (mevcutYil === bitisYil && mevcutAy <= bitisAy)) {
        const ayBaslangic = new Date(mevcutYil, mevcutAy, 1);
        const ayBitis = new Date(mevcutYil, mevcutAy + 1, 0, 23, 59, 59, 999);
        
        const ayBaslangicKontrol = ayBaslangic < baslangicTarihi ? baslangicTarihi : ayBaslangic;
        const ayBitisKontrol = ayBitis > bitisTarihi ? bitisTarihi : ayBitis;
        
        const oAyKartlar = kartlar.filter(kart => {
          if (!kart.girisTarihi) return false;
          const kartTarihi = new Date(kart.girisTarihi);
          return kartTarihi >= ayBaslangicKontrol && kartTarihi <= ayBitisKontrol;
        });

        const oAyGelir = oAyKartlar.reduce((toplam, kart) => {
          return toplam + hesaplaToplamFiyat(kart.yapilanlar);
        }, 0);

        gelirVerileri.push({
          tarih: `${mevcutYil}-${String(mevcutAy + 1).padStart(2, '0')}-01`,
          gelir: oAyGelir,
          islemSayisi: oAyKartlar.length,
          tip: 'ay'
        });
        
        mevcutAy++;
        if (mevcutAy > 11) {
          mevcutAy = 0;
          mevcutYil++;
        }
      }
    } else {
      for (let i = 0; i <= gunFarki; i++) {
        const tarih = new Date(baslangicTarihi);
        tarih.setDate(tarih.getDate() + i);
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

        gelirVerileri.push({
          tarih: tarihStr,
          gelir: oGunGelir,
          islemSayisi: oGunKartlar.length,
          tip: 'gun'
        });
      }
    }

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
      gelirVerileri,
      enAktifKullanicilar,
      gelirTrend: parseFloat(gelirTrend),
      kartTrend: parseFloat(kartTrend),
      buAykiKartSayisi: buAykiKartlar.length,
      birOncekiAykiKartSayisi: birOncekiAykiKartlar.length
    };
  };

  const istatistikler = hesaplaIstatistikler();

  // Periyodik bakım hatırlatıcısı hesaplama
  const hesaplaPeriyodikBakim = () => {
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);

    const periyodikBakimKartlari = kartlar.filter(kart => kart.periyodikBakim === true);

    const bakimListesi = periyodikBakimKartlari
      .map(kart => {
        if (!kart.girisTarihi) return null;
        
        const girisTarihi = new Date(kart.girisTarihi);
        girisTarihi.setHours(0, 0, 0, 0);
        
        // Ay farkını hesapla
        const ayFarki = Math.floor((bugun - girisTarihi) / (1000 * 60 * 60 * 24 * 30));
        
        // Renk durumu belirle
        let durum = 'green'; // 0-6 ay
        if (ayFarki >= 7 && ayFarki <= 9) {
          durum = 'yellow'; // 7-9 ay
        } else if (ayFarki > 9) {
          durum = 'red'; // 9+ ay
        }

        return {
          ...kart,
          ayFarki,
          durum,
          girisTarihi: girisTarihi.toISOString().split('T')[0]
        };
      })
      .filter(kart => kart !== null)
      .sort((a, b) => b.ayFarki - a.ayFarki); // En geç olanlar önce

    const yesilSayisi = bakimListesi.filter(k => k.durum === 'green').length;
    const sariSayisi = bakimListesi.filter(k => k.durum === 'yellow').length;
    const kirmiziSayisi = bakimListesi.filter(k => k.durum === 'red').length;

    return {
      toplam: bakimListesi.length,
      yesil: yesilSayisi,
      sari: sariSayisi,
      kirmizi: kirmiziSayisi,
      liste: bakimListesi
    };
  };

  const periyodikBakimData = hesaplaPeriyodikBakim();

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
      className="min-h-screen dark-bg-primary"
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Dashboard</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="dashboard"
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
          <div className="p-4 md:p-6 lg:p-8 pt-6 md:pt-8 mt-16 lg:ml-64 max-w-[1920px] mx-auto">
            {/* Başlık Bölümü */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold dark-text-primary mb-2">
                    Hoş Geldiniz, <span className="text-blue-400">{firmaAdi}</span>!
                  </h1>
                  <p className="dark-text-secondary text-sm md:text-base">
                    Bugün mağazanızda neler oluyor?
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm dark-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">

            {/* KPI Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
              {/* Toplam Gelir */}
              <div className="dark-card-bg neumorphic-outset rounded-xl p-4 md:p-5 border border-blue-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-6-6h12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-blue-200/80 font-semibold">Finans</p>
                      <h3 className="text-base md:text-lg font-semibold dark-text-primary">Toplam Gelir</h3>
                    </div>
                  </div>
                  <div className={`flex items-center text-xs font-semibold ${istatistikler.gelirTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <svg className={`w-4 h-4 mr-1 ${istatistikler.gelirTrend < 0 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    {Math.abs(istatistikler.gelirTrend).toFixed(1)}%
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 break-words text-blue-100">{formatPara(istatistikler.buAykiGelir)}</p>
                <p className="text-xs text-blue-200/80">Bu ay</p>
              </div>

              {/* Toplam Kart */}
              <div className="dark-card-bg neumorphic-outset rounded-xl p-4 md:p-5 border border-emerald-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0l-3-3m3 3l3-3m-9 7h12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-emerald-200/80 font-semibold">Kayıt</p>
                      <h3 className="text-base md:text-lg font-semibold dark-text-primary">Toplam Kart</h3>
                    </div>
                  </div>
                  <div className={`flex items-center text-xs font-semibold ${istatistikler.kartTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <svg className={`w-4 h-4 mr-1 ${istatistikler.kartTrend < 0 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    {Math.abs(istatistikler.kartTrend).toFixed(1)}%
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 text-emerald-100">{istatistikler.toplamKart}</p>
                <p className="text-xs text-emerald-200/80">Toplam kayıt</p>
              </div>

              {/* Toplam Teklif */}
              <div className="dark-card-bg neumorphic-outset rounded-xl p-4 md:p-5 border border-purple-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 .895-2 3-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12c0 4 3.582 7 8 7s8-3 8-7-3.582-7-8-7-8 3-8 7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-200/80 font-semibold">Teklif</p>
                      <h3 className="text-base md:text-lg font-semibold dark-text-primary">Toplam Teklif</h3>
                    </div>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 text-purple-100">{istatistikler.toplamTeklif}</p>
                <p className="text-xs text-purple-200/80">Bekleyen teklifler</p>
              </div>

              {/* Bugün Eklenen */}
              <div className="dark-card-bg neumorphic-outset rounded-xl p-4 md:p-5 border border-amber-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-900/40">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0l-3-3m3 3l3-3m-9 7h12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-amber-200/80 font-semibold">Bugün</p>
                      <h3 className="text-base md:text-lg font-semibold dark-text-primary">Bugün Eklenen</h3>
                    </div>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 text-amber-100">{istatistikler.bugunEklenenKart}</p>
                <p className="text-xs text-amber-200/80">Yeni kayıt</p>
              </div>

              {/* Son 7 Günlük Ciro */}
              <div className="dark-card-bg neumorphic-outset rounded-xl p-4 md:p-5 border border-cyan-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-900/40">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 12l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cyan-200/80 font-semibold">7 Gün</p>
                      <h3 className="text-base md:text-lg font-semibold dark-text-primary">Son 7 Günlük Ciro</h3>
                    </div>
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-bold mb-1 break-words text-cyan-100">{formatPara(istatistikler.son7GunlukCiro)}</p>
                <p className="text-xs text-cyan-200/80">Haftalık ciro</p>
              </div>
            </div>

            {/* Grafik ve Liste Bölümü */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Gelir Grafiği */}
              <div className="lg:col-span-2 dark-card-bg neumorphic-card rounded-2xl p-6 md:p-8 border border-green-500/20">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h2 className="text-xl md:text-2xl font-semibold dark-text-primary">Gelir Özeti</h2>
                    </div>
                    <p className="text-sm dark-text-muted ml-13">
                      {istatistikler.gelirVerileri && istatistikler.gelirVerileri.length > 0 && istatistikler.gelirVerileri[0].tip === 'ay' 
                        ? 'Aylık gelir analizi' 
                        : 'Günlük gelir analizi'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 dark-bg-tertiary rounded-lg neumorphic-inset border border-green-500/20">
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400"></div>
                      <span className="text-xs font-semibold dark-text-primary">Gelir</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 dark-bg-tertiary rounded-lg neumorphic-inset border border-blue-500/20">
                      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                      <span className="text-xs font-semibold dark-text-primary">İşlem</span>
                    </div>
                  </div>
                </div>

                {/* Tarih Filtreleme */}
                <div className="dark-card-bg neumorphic-card rounded-xl p-4 mb-6">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold dark-text-primary mb-2">Başlangıç Tarihi</label>
                      <input
                        type="date"
                        value={tarihBaslangic}
                        onChange={(e) => setTarihBaslangic(e.target.value)}
                        max={tarihBitis}
                        className="w-full px-4 py-2 neumorphic-input rounded-lg dark-text-primary"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold dark-text-primary mb-2">Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={tarihBitis}
                        onChange={(e) => setTarihBitis(e.target.value)}
                        min={tarihBaslangic}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 neumorphic-input rounded-lg dark-text-primary"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const yil = new Date().getFullYear();
                        setTarihBaslangic(`${yil}-01-01`);
                        setTarihBitis(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg neumorphic-inset hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
                    >
                      Bu Yıl
                    </button>
                  </div>
                </div>

                <div className="h-96 relative dark-card-bg neumorphic-card rounded-xl p-6">
                  {istatistikler.gelirVerileri && istatistikler.gelirVerileri.length > 0 ? (
                    <svg viewBox="0 0 600 320" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <linearGradient id="gelirGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
                          <stop offset="50%" stopColor="#22c55e" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.08" />
                        </linearGradient>
                        <linearGradient id="islemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.14" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.06" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      {(() => {
                        const veriler = istatistikler.gelirVerileri;
                        const aylikGosterim = veriler.length > 0 && veriler[0]?.tip === 'ay';
                        const maxGelir = Math.max(...veriler.map(d => d.gelir), 1);
                        const maxIslem = Math.max(...veriler.map(d => d.islemSayisi), 1);
                        const width = 600;
                        const height = 320;
                        const padding = { top: 30, right: 40, bottom: 60, left: 70 };
                        const chartWidth = width - padding.left - padding.right;
                        const chartHeight = height - padding.top - padding.bottom;
                        
                        const gelirPoints = veriler.map((d, i) => {
                          const x = padding.left + (i / (veriler.length - 1 || 1)) * chartWidth;
                          const y = padding.top + chartHeight - (d.gelir / maxGelir) * chartHeight;
                          return { x, y, gelir: d.gelir, islem: d.islemSayisi, tarih: d.tarih, index: i, tip: d.tip };
                        });
                        
                        const islemPoints = veriler.map((d, i) => {
                          const x = padding.left + (i / (veriler.length - 1 || 1)) * chartWidth;
                          const y = padding.top + chartHeight - (d.islemSayisi / maxIslem) * chartHeight;
                          return { x, y, islem: d.islemSayisi };
                        });
                        
                        const gelirAreaPath = gelirPoints.map((p, i) => {
                          if (i === 0) return `M ${p.x} ${height - padding.bottom} L ${p.x} ${p.y}`;
                          return `L ${p.x} ${p.y}`;
                        }).join(' ') + ` L ${gelirPoints[gelirPoints.length - 1].x} ${height - padding.bottom} Z`;
                        
                        const islemAreaPath = islemPoints.map((p, i) => {
                          if (i === 0) return `M ${p.x} ${height - padding.bottom} L ${p.x} ${p.y}`;
                          return `L ${p.x} ${p.y}`;
                        }).join(' ') + ` L ${islemPoints[islemPoints.length - 1].x} ${height - padding.bottom} Z`;
                        
                        const gelirLinePath = gelirPoints.map((p, i) => {
                          if (i === 0) return `M ${p.x} ${p.y}`;
                          return `L ${p.x} ${p.y}`;
                        }).join(' ');
                        
                        const islemLinePath = islemPoints.map((p, i) => {
                          if (i === 0) return `M ${p.x} ${p.y}`;
                          return `L ${p.x} ${p.y}`;
                        }).join(' ');
                        
                        return (
                          <>
                            {/* Grid çizgileri */}
                            {[0.25, 0.5, 0.75].map((ratio, i) => (
                              <line
                                key={`grid-${i}`}
                                x1={padding.left}
                                y1={padding.top + chartHeight - (ratio * chartHeight)}
                                x2={width - padding.right}
                                y2={padding.top + chartHeight - (ratio * chartHeight)}
                                stroke="#334155"
                                strokeWidth="1"
                                strokeDasharray="3,3"
                              />
                            ))}
                            
                            {/* Area gradyanları */}
                            <path d={gelirAreaPath} fill="url(#gelirGradient)" />
                            <path d={islemAreaPath} fill="url(#islemGradient)" />
                            
                            {/* Çizgiler */}
                            <path d={gelirLinePath} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d={islemLinePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" opacity="0.85" />
                            
                            {/* Noktalar */}
                            {gelirPoints.map((p, i) => (
                              <g key={i}>
                                <circle 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r="5" 
                                  fill="#10b981" 
                                  stroke="white" 
                                  strokeWidth="2" 
                                  className="hover:r-7 transition-all cursor-pointer" 
                                />
                                <circle 
                                  cx={islemPoints[i].x} 
                                  cy={islemPoints[i].y} 
                                  r="4" 
                                  fill="#3b82f6" 
                                  stroke="white" 
                                  strokeWidth="2" 
                                  className="hover:r-6 transition-all cursor-pointer" 
                                />
                              </g>
                            ))}
                            
                            {/* Tarih etiketleri */}
                            {gelirPoints.map((p, i) => {
                              if (aylikGosterim && i % Math.ceil(gelirPoints.length / 12) !== 0 && i !== gelirPoints.length - 1) {
                                return null;
                              }
                              return (
                                <text 
                                  key={`date-${i}`}
                                  x={p.x} 
                                  y={height - 15} 
                                  textAnchor="middle" 
                                  fill="#6b7280" 
                                  fontSize="11" 
                                  fontWeight="500"
                                >
                                  {aylikGosterim 
                                    ? new Date(p.tarih).toLocaleDateString('tr-TR', { month: 'short' })
                                    : new Date(p.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                </text>
                              );
                            })}
                            
                            {/* Y ekseni etiketleri */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                              const value = Math.round(maxGelir * ratio);
                              return (
                                <text 
                                  key={`y-label-${i}`}
                                  x={padding.left - 10} 
                                  y={padding.top + chartHeight - (ratio * chartHeight) + 4} 
                                  textAnchor="end" 
                                  fill="#9ca3af" 
                                  fontSize="10"
                                  fontWeight="500"
                                >
                                  {value > 0 ? formatPara(value).replace('₺', '').trim() : '0'}
                                </text>
                              );
                            })}
                            
                            {/* Eksen çizgileri */}
                            <line
                              x1={padding.left}
                              y1={padding.top}
                              x2={padding.left}
                              y2={height - padding.bottom}
                              stroke="#475569"
                              strokeWidth="1.25"
                            />
                            <line
                              x1={padding.left}
                              y1={height - padding.bottom}
                              x2={width - padding.right}
                              y2={height - padding.bottom}
                              stroke="#475569"
                              strokeWidth="1.25"
                            />
                          </>
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full dark-text-muted">
                      <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-base font-semibold mb-1 dark-text-primary">Grafik verisi bulunmamaktadır</p>
                      <p className="text-xs dark-text-muted">Veri geldiğinde detaylı grafik otomatik olarak görüntülenecektir</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Periyodik Bakım Hatırlatıcısı */}
              {periyodikBakimData.toplam > 0 && (
                <div className="lg:col-span-1 dark-card-bg neumorphic-card rounded-2xl p-4 md:p-6 border border-cyan-500/25">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-900/40">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-semibold dark-text-primary">Periyodik Bakım</h2>
                        <p className="text-xs dark-text-muted">Bakım hatırlatıcısı</p>
                      </div>
                    </div>
                    <Link href="/login/kartlar" className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold">
                      Tümü
                    </Link>
                  </div>

                  {/* Durum Özeti */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="dark-bg-tertiary rounded-xl p-2.5 text-center border border-green-500/30">
                      <p className="text-xl font-bold text-green-300">{periyodikBakimData.yesil}</p>
                      <p className="text-[11px] text-green-200/80 mt-0.5">0-6 Ay</p>
                    </div>
                    <div className="dark-bg-tertiary rounded-xl p-2.5 text-center border border-amber-500/30">
                      <p className="text-xl font-bold text-amber-300">{periyodikBakimData.sari}</p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">7-9 Ay</p>
                    </div>
                    <div className="dark-bg-tertiary rounded-xl p-2.5 text-center border border-red-500/30">
                      <p className="text-xl font-bold text-red-300">{periyodikBakimData.kirmizi}</p>
                      <p className="text-[11px] text-red-200/80 mt-0.5">9+ Ay</p>
                    </div>
                  </div>

                  {/* Bakım Listesi */}
                  {periyodikBakimData.liste.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {periyodikBakimData.liste.slice(0, 5).map((kart) => {
                        const durumRenk = kart.durum === 'green' 
                          ? 'bg-green-500/15 border-green-500/40 text-green-200' 
                          : kart.durum === 'yellow'
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                          : 'bg-red-500/15 border-red-500/40 text-red-200';
                        
                        const durumText = kart.durum === 'green' 
                          ? 'Normal' 
                          : kart.durum === 'yellow'
                          ? 'Yaklaşıyor'
                          : 'Acil';

                        return (
                          <Link 
                            key={kart.card_id} 
                            href={`/login/kartlar/detay?card_id=${kart.card_id}`}
                            className="block p-3 rounded-lg neumorphic-inset hover:dark-bg-tertiary transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${kart.durum === 'green' ? 'bg-green-400' : kart.durum === 'yellow' ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold dark-text-primary truncate">
                                    {kart.plaka || 'Plaka Yok'}
                                  </p>
                                  <p className="text-xs dark-text-secondary truncate">
                                    {kart.markaModel || 'Marka/Model Yok'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end flex-shrink-0 gap-1">
                                <div className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${durumRenk}`}>
                                  {durumText}
                                </div>
                                <p className="text-xs font-medium dark-text-primary">{kart.ayFarki} Ay</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Alt Bölüm - Son İşlemler ve En Aktif Kullanıcılar */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Son İşlemler */}
              <div className="dark-card-bg neumorphic-card rounded-xl p-5 md:p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg md:text-xl font-semibold dark-text-primary">Son İşlemler</h2>
                  </div>
                  <Link href="/login/son-hareketler" className="text-xs md:text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                    Tümünü Gör →
                  </Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : hareketler.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="dark-text-secondary text-sm">Henüz hareket kaydı bulunmamaktadır.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hareketler.slice(0, 5).map((hareket) => (
                      <div key={hareket.id} className="flex items-center justify-between p-3 hover:dark-bg-tertiary rounded-lg transition-all neumorphic-inset group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-110 ${getActionColor(hareket.action)}`}>
                            <span className="text-base">
                              {hareket.action === 'login' ? '🔓' : hareket.action === 'logout' ? '🔒' : hareket.action === 'card_create' ? '➕' : hareket.action === 'card_edit' ? '✏️' : '🗑️'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold dark-text-primary truncate">{getActionLabel(hareket.action)}</p>
                            <p className="text-xs dark-text-muted truncate">{hareket.action_detail || '-'}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="text-xs font-semibold dark-text-primary">{hareket.username}</p>
                          <p className="text-xs dark-text-muted">{formatTarih(hareket.timestamp).split(' ')[0]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* En Aktif Kullanıcılar */}
              <div className="dark-card-bg neumorphic-card rounded-xl p-5 md:p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center border border-purple-500/30">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h2 className="text-lg md:text-xl font-semibold dark-text-primary">En Aktif Kullanıcılar</h2>
                  </div>
                </div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : istatistikler.enAktifKullanicilar && istatistikler.enAktifKullanicilar.length > 0 ? (
                  <div className="space-y-3">
                    {istatistikler.enAktifKullanicilar.map((kullanici, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:dark-bg-tertiary rounded-lg transition-all neumorphic-inset group">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-900/40 transition-all group-hover:scale-110">
                            {kullanici.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold dark-text-primary truncate">{kullanici.username}</p>
                            <p className="text-xs dark-text-muted">{kullanici.sayi} işlem</p>
                          </div>
                        </div>
                        <Link href="/login/son-hareketler" className="text-xs md:text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors flex-shrink-0">
                          Görüntüle →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm dark-text-secondary">Henüz aktif kullanıcı bulunmamaktadır.</p>
                  </div>
                )}
              </div>
            </div>
            </div>
            </div>
        </ProtectedPage>
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

