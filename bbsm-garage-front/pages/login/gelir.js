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
import { useSwipe, useVerticalSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';
import { useTheme } from '../../contexts/ThemeContext';

function Gelir() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const { activeTheme } = useTheme();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [kartlar, setKartlar] = useState([]);
  const [teklifler, setTeklifler] = useState([]);
  const [baslangicTarihi, setBaslangicTarihi] = useState('');
  const [bitisTarihi, setBitisTarihi] = useState('');
  const [filtreMarkaModel, setFiltreMarkaModel] = useState('');
  const [filtrePlaka, setFiltrePlaka] = useState('');
  const [filtreMusteri, setFiltreMusteri] = useState('');
  const [filtreTip, setFiltreTip] = useState('hepsi'); // 'hepsi', 'kartlar', 'teklifler'

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

  // Sayfa/sekme yeniden öne geldiğinde verileri tazele
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchKartlar();
        fetchTeklifler();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus);
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus);
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
    };
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

  // Yapılanlar toplam fiyatını hesapla (dashboard ile birebir aynı mantık)
  const hesaplaToplamFiyat = (yapilanlar) => {
    if (!yapilanlar || !Array.isArray(yapilanlar)) return 0;
    return yapilanlar.reduce((toplam, item) => {
      const birimFiyati = parseFloat(item.birimFiyati) || 0;
      const birimAdedi = parseInt(item.birimAdedi, 10) || 0;
      return toplam + (birimFiyati * birimAdedi);
    }, 0);
  };

  // Filtrelenmiş verileri hesapla
  const hesaplaGelirVerileri = () => {
    let filtrelenmisKartlar = [];
    let filtrelenmisTeklifler = [];

    // Tarih filtresi
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

    // Gelir hesaplamasında sadece ödemesi alınmış kartları kullan
    filtrelenmisKartlar = filtrelenmisKartlar.filter(kart => kart.odemeAlindi);

    // Marka/Model filtresi
    if (filtreMarkaModel && filtreMarkaModel.trim() !== '') {
      const markaModelLower = filtreMarkaModel.toLowerCase().trim();
      filtrelenmisKartlar = filtrelenmisKartlar.filter(kart => 
        (kart.markaModel || '').toLowerCase().includes(markaModelLower)
      );
      filtrelenmisTeklifler = filtrelenmisTeklifler.filter(teklif => 
        (teklif.markaModel || '').toLowerCase().includes(markaModelLower)
      );
    }

    // Plaka filtresi
    if (filtrePlaka && filtrePlaka.trim() !== '') {
      const plakaLower = filtrePlaka.toLowerCase().trim();
      filtrelenmisKartlar = filtrelenmisKartlar.filter(kart => 
        (kart.plaka || '').toLowerCase().includes(plakaLower)
      );
      filtrelenmisTeklifler = filtrelenmisTeklifler.filter(teklif => 
        (teklif.plaka || '').toLowerCase().includes(plakaLower)
      );
    }

    // Müşteri filtresi
    if (filtreMusteri && filtreMusteri.trim() !== '') {
      const musteriLower = filtreMusteri.toLowerCase().trim();
      filtrelenmisKartlar = filtrelenmisKartlar.filter(kart => 
        (kart.adSoyad || '').toLowerCase().includes(musteriLower)
      );
      filtrelenmisTeklifler = filtrelenmisTeklifler.filter(teklif => 
        (teklif.adSoyad || '').toLowerCase().includes(musteriLower)
      );
    }

    // Tip filtresi (kartlar/teklifler)
    if (filtreTip === 'kartlar') {
      filtrelenmisTeklifler = [];
    } else if (filtreTip === 'teklifler') {
      // Ciro hesaplarında teklifleri kullanmıyoruz ama listelemede filtre açısından kalsın
      filtrelenmisKartlar = [];
    }

    // Toplam gelir hesapla (SADECE KARTLAR, teklifler hariç)
    const kartlarToplam = filtrelenmisKartlar.reduce((toplam, kart) => {
      return toplam + hesaplaToplamFiyat(kart.yapilanlar);
    }, 0);

    const toplamGelir = kartlarToplam;
    const toplamIslemSayisi = filtrelenmisKartlar.length;
    
    // Son 7 günlük ciro hesapla
    let son7GunlukCiro = 0;
    const bugun = new Date();
    const yediGunOnce = new Date();
    yediGunOnce.setDate(yediGunOnce.getDate() - 7);
    const yediGunOnceStr = yediGunOnce.toISOString().split('T')[0];
    const bugunStr = bugun.toISOString().split('T')[0];
    
    const son7GunKartlar = kartlar.filter(kart => 
      kart.odemeAlindi && tarihAraligindaMi(kart.girisTarihi, yediGunOnceStr, bugunStr)
    );
    const son7GunKartlarToplam = son7GunKartlar.reduce((toplam, kart) => {
      return toplam + hesaplaToplamFiyat(kart.yapilanlar);
    }, 0);

    // Son 7 günlük ciro da sadece kartlardan
    son7GunlukCiro = son7GunKartlarToplam;

    // Günlük gelir hesapla (sadece kartlar)
    const gunlukGelir = {};
    filtrelenmisKartlar.forEach(item => {
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

    // Karşılaştırmalı analiz (önceki dönem)
    const oncekiDonemBaslangic = new Date(baslangicTarihi || bugun);
    const oncekiDonemBitis = new Date(bitisTarihi || bugun);
    const gunFarki = Math.ceil((oncekiDonemBitis - oncekiDonemBaslangic) / (1000 * 60 * 60 * 24));
    const oncekiDonemBaslangicYeni = new Date(oncekiDonemBaslangic);
    oncekiDonemBaslangicYeni.setDate(oncekiDonemBaslangicYeni.getDate() - gunFarki - 1);
    const oncekiDonemBitisYeni = new Date(oncekiDonemBaslangic);
    oncekiDonemBitisYeni.setDate(oncekiDonemBitisYeni.getDate() - 1);
    
    const oncekiDonemKartlar = kartlar.filter(kart => 
      tarihAraligindaMi(kart.girisTarihi, oncekiDonemBaslangicYeni.toISOString().split('T')[0], oncekiDonemBitisYeni.toISOString().split('T')[0])
    );
    const oncekiDonemTeklifler = teklifler.filter(teklif => 
      tarihAraligindaMi(teklif.girisTarihi, oncekiDonemBaslangicYeni.toISOString().split('T')[0], oncekiDonemBitisYeni.toISOString().split('T')[0])
    );
    
    const oncekiDonemGelir = [...oncekiDonemKartlar, ...oncekiDonemTeklifler].reduce((toplam, item) => {
      return toplam + hesaplaToplamFiyat(item.yapilanlar);
    }, 0);

    const karsilastirma = {
      mevcutDonem: toplamGelir,
      oncekiDonem: oncekiDonemGelir,
      fark: toplamGelir - oncekiDonemGelir,
      yuzdeDegisim: oncekiDonemGelir > 0 ? ((toplamGelir - oncekiDonemGelir) / oncekiDonemGelir * 100).toFixed(2) : 0
    };

    return {
      toplamGelir,
      toplamIslemSayisi,
      son7GunlukCiro,
      gunlukGelir,
      aylikGelir,
      enCokGelirGunler,
      karsilastirma,
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
      className="min-h-screen dark-bg-primary"
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
          <div 
            className="p-3 md:p-4 lg:p-6 pt-4 md:pt-6 lg:pt-8 mt-16 lg:ml-64 dark-bg-primary"
            {...pullToRefresh}
          >
          <div className="p-3 md:p-4 lg:p-6 mt-5 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl">
            <h1 className="text-xl md:text-2xl font-semibold dark-text-primary mb-3 md:mb-4">Gelir Raporu</h1>

            {/* Filtreler */}
            <div className="mb-4 md:mb-6 p-3 md:p-4 dark-card-bg neumorphic-card rounded-lg md:rounded-xl">
              <h3 className="text-sm md:text-base font-medium dark-text-primary mb-3 md:mb-4">Filtreler</h3>
              
              {/* Tarih Filtreleri */}
              <div className="mb-4">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <div className="flex-1">
                    <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={baslangicTarihi}
                      onChange={(e) => setBaslangicTarihi(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={bitisTarihi}
                      onChange={(e) => setBitisTarihi(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleGunlukCiro}
                      className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 transition-all touch-manipulation min-h-[44px] active:scale-95 text-xs md:text-sm text-white"
                    >
                      Bugün
                    </button>
                  </div>
                </div>
              </div>

              {/* Detaylı Filtreler */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Marka/Model</label>
                  <input
                    type="text"
                    placeholder="Marka veya model ara..."
                    value={filtreMarkaModel}
                    onChange={(e) => setFiltreMarkaModel(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Plaka</label>
                  <input
                    type="text"
                    placeholder="Plaka ara..."
                    value={filtrePlaka}
                    onChange={(e) => setFiltrePlaka(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Müşteri</label>
                  <input
                    type="text"
                    placeholder="Müşteri adı ara..."
                    value={filtreMusteri}
                    onChange={(e) => setFiltreMusteri(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium dark-text-primary mb-1.5">Tip</label>
                  <select
                    value={filtreTip}
                    onChange={(e) => setFiltreTip(e.target.value)}
                    className="w-full px-3 md:px-4 py-2 md:py-3 text-sm neumorphic-input rounded-lg dark-text-primary touch-manipulation min-h-[44px]"
                  >
                    <option value="hepsi">Hepsi</option>
                    <option value="kartlar">Kartlar</option>
                    <option value="teklifler">Teklifler</option>
                  </select>
                </div>
              </div>

              {/* Filtreleri Temizle */}
              {(filtreMarkaModel || filtrePlaka || filtreMusteri || filtreTip !== 'hepsi') && (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setFiltreMarkaModel('');
                      setFiltrePlaka('');
                      setFiltreMusteri('');
                      setFiltreTip('hepsi');
                    }}
                    className="px-4 py-2 rounded-lg font-medium text-xs md:text-sm bg-blue-500 hover:bg-blue-600 transition-all touch-manipulation min-h-[36px] active:scale-95 text-white"
                  >
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>

            {/* Özet Kartlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
              <div className={`bg-gradient-to-br from-blue-500 to-blue-600 p-4 md:p-6 rounded-xl shadow-lg ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>
                <h3 className="text-base md:text-lg font-medium mb-2">Toplam Gelir</h3>
                <p className="text-2xl md:text-3xl font-bold break-words">{formatPara(gelirVerileri.toplamGelir)}</p>
              </div>
              <div className={`bg-gradient-to-br from-green-500 to-green-600 p-4 md:p-6 rounded-xl shadow-lg ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>
                <h3 className="text-base md:text-lg font-medium mb-2">Toplam İşlem Sayısı</h3>
                <p className="text-2xl md:text-3xl font-bold">{gelirVerileri.toplamIslemSayisi}</p>
              </div>
              <div className={`bg-gradient-to-br from-red-500 to-red-600 p-4 md:p-6 rounded-xl shadow-lg ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>
                <h3 className="text-base md:text-lg font-medium mb-2">Son 7 Günlük Ciro</h3>
                <p className="text-2xl md:text-3xl font-bold break-words">{formatPara(gelirVerileri.son7GunlukCiro)}</p>
              </div>
              <div className={`bg-gradient-to-br ${gelirVerileri.karsilastirma.fark >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} p-4 md:p-6 rounded-xl shadow-lg ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>
                <h3 className="text-base md:text-lg font-medium mb-2">Önceki Dönem Karşılaştırma</h3>
                <p className="text-lg md:text-xl font-bold break-words">
                  {gelirVerileri.karsilastirma.fark >= 0 ? '+' : ''}{formatPara(gelirVerileri.karsilastirma.fark)}
                </p>
                <p className="text-sm mt-1">
                  {gelirVerileri.karsilastirma.yuzdeDegisim >= 0 ? '+' : ''}{gelirVerileri.karsilastirma.yuzdeDegisim}%
                </p>
              </div>
            </div>

            {/* PDF Export Butonu */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const reportData = {
                      baslangicTarihi,
                      bitisTarihi,
                      toplamGelir: gelirVerileri.toplamGelir,
                      toplamIslemSayisi: gelirVerileri.toplamIslemSayisi,
                      son7GunlukCiro: gelirVerileri.son7GunlukCiro,
                      karsilastirma: gelirVerileri.karsilastirma,
                    };
                    const response = await fetchWithAuth(`${API_URL}/excel/pdf`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        vehicleInfo: {
                          adSoyad: 'Gelir Raporu',
                          telNo: '',
                          markaModel: `${baslangicTarihi} - ${bitisTarihi}`,
                          plaka: '',
                          km: 0,
                          modelYili: 0,
                          sasi: '',
                          renk: '',
                          girisTarihi: new Date().toISOString().split('T')[0],
                          notlar: `Toplam Gelir: ${formatPara(gelirVerileri.toplamGelir)}\nToplam İşlem: ${gelirVerileri.toplamIslemSayisi}\nKarşılaştırma: ${gelirVerileri.karsilastirma.yuzdeDegisim}%`,
                          adres: '',
                        },
                        data: [],
                        notes: `Gelir Raporu\nTarih Aralığı: ${baslangicTarihi} - ${bitisTarihi}\nToplam Gelir: ${formatPara(gelirVerileri.toplamGelir)}`
                      }),
                    });
                    if (response && response.ok) {
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `gelir-raporu-${baslangicTarihi}-${bitisTarihi}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                    }
                  } catch (error) {
                    console.error('PDF export error:', error);
                  }
                  setLoading(false);
                }}
                className="px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 transition-all touch-manipulation min-h-[44px] active:scale-95 text-white"
              >
                PDF Rapor İndir
              </button>
            </div>

            {/* Günlük Gelir Tablosu */}
            <div className="mb-6">
              <h2 className="text-base md:text-lg font-semibold dark-text-primary mb-3">Günlük Gelir Detayları</h2>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full text-xs dark-card-bg neumorphic-card border dark-border rounded-lg">
                  <thead className="dark-bg-tertiary neumorphic-inset">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">Tarih</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">Gelir</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">İşlem</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider hidden md:table-cell">Ortalama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark-border">
                    {Object.entries(gelirVerileri.gunlukGelir)
                      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                      .map(([tarih, data]) => (
                        <tr key={tarih} className="hover:dark-bg-tertiary active:dark-bg-secondary transition-colors">
                          <td className="px-3 md:px-6 py-4 text-xs font-medium dark-text-primary whitespace-nowrap">
                            <div className="md:hidden">{new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</div>
                            <div className="hidden md:block">{formatTarihGuzel(tarih)}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs dark-text-primary font-semibold">
                            {formatPara(data.gelir)}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs dark-text-secondary">
                            {data.islemSayisi}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs dark-text-secondary hidden md:table-cell">
                            {formatPara(data.gelir / data.islemSayisi)}
                          </td>
                        </tr>
                      ))}
                    {Object.keys(gelirVerileri.gunlukGelir).length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center dark-text-muted">
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
              <h2 className="text-base md:text-lg font-semibold dark-text-primary mb-3">Aylık Gelir Özeti</h2>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="min-w-full text-xs dark-card-bg neumorphic-card border dark-border rounded-lg">
                  <thead className="dark-bg-tertiary neumorphic-inset">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">Ay</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">Gelir</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">İşlem</th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider hidden md:table-cell">Ortalama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark-border">
                    {Object.entries(gelirVerileri.aylikGelir)
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .map(([ay, data]) => {
                        const [yil, ayNumarasi] = ay.split('-');
                        const ayAdi = new Date(yil, parseInt(ayNumarasi) - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                        const ayAdiKisa = new Date(yil, parseInt(ayNumarasi) - 1).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
                        return (
                          <tr key={ay} className="hover:dark-bg-tertiary active:dark-bg-secondary transition-colors">
                            <td className="px-3 md:px-6 py-4 text-xs font-medium dark-text-primary capitalize whitespace-nowrap">
                              <div className="md:hidden">{ayAdiKisa}</div>
                              <div className="hidden md:block">{ayAdi}</div>
                            </td>
                            <td className="px-3 md:px-6 py-4 text-xs dark-text-primary font-semibold">
                              {formatPara(data.gelir)}
                            </td>
                            <td className="px-3 md:px-6 py-4 text-xs dark-text-secondary">
                              {data.islemSayisi}
                            </td>
                            <td className="px-3 md:px-6 py-4 text-xs dark-text-secondary hidden md:table-cell">
                              {formatPara(data.gelir / data.islemSayisi)}
                            </td>
                          </tr>
                        );
                      })}
                    {Object.keys(gelirVerileri.aylikGelir).length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center dark-text-muted">
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
                <h2 className="text-base md:text-lg font-semibold dark-text-primary mb-3">En Çok Gelir Getiren Günler (Top 10)</h2>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="min-w-full text-xs dark-card-bg neumorphic-card border dark-border rounded-lg">
                    <thead className="dark-bg-tertiary neumorphic-inset">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">Sıra</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">Tarih</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">Gelir</th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium dark-text-primary uppercase tracking-wider">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark-border">
                      {gelirVerileri.enCokGelirGunler.map((item, index) => (
                        <tr key={item.tarih} className="hover:dark-bg-tertiary active:dark-bg-secondary transition-colors">
                          <td className="px-3 md:px-6 py-4 text-xs font-medium dark-text-primary">
                            {index + 1}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs dark-text-primary whitespace-nowrap">
                            <div className="md:hidden">{new Date(item.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</div>
                            <div className="hidden md:block">{formatTarihGuzel(item.tarih)}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs dark-text-primary font-semibold">
                            {formatPara(item.gelir)}
                          </td>
                          <td className="px-3 md:px-6 py-4 text-xs dark-text-secondary">
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

        </ProtectedPage>
      </div>
    </div>
  );
}

export default withAuth(Gelir);
