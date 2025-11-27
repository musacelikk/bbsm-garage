import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';

export default function Teklif() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const username = getUsername() || 'Kullanıcı';
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

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
  const [teklifler, setTeklifler] = useState([]);
  const [secilenTeklifler, setSecilenTeklifler] = useState([]);
  const [aramaTerimi, setAramaTerimi] = useState('');

  const DetailPage = (id) => {
    return (id ? `/login/teklifler/detayT?id=${id}` : '/login/teklif');
  };

  const capitalizeWords = (string) => {
    return string.split(' ').map(word => {
      return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
    }).join(' ');
  };

  const toUpperCase = (string) => {
    return string.toUpperCase();
  };

  const toggleMenu = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  };

  const fetchTeklifListesi = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/teklif`, {
        method: 'GET',
        redirect: 'follow'
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeklifler(data);
      }
    } catch (error) {
      console.log('error', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTeklifListesi();
  }, []);

  const handleCheckboxChange = (e, teklifId) => {
    if (e.target.checked) {
      setSecilenTeklifler([...secilenTeklifler, teklifId]);
    } else {
      setSecilenTeklifler(secilenTeklifler.filter(id => id !== teklifId));
    }
  };

  const silSecilenleri = async () => {
    setLoading(true);
    try {
      const deleteRequests = secilenTeklifler.map(teklifId =>
        fetchWithAuth(`${API_URL}/teklif/${teklifId}`, { method: 'DELETE' })
      );
      await Promise.all(deleteRequests);

      const guncellenmisTeklifler = teklifler.filter(teklif => !secilenTeklifler.includes(teklif.teklif_id));
      setTeklifler(guncellenmisTeklifler);
      setSecilenTeklifler([]);
    } catch (error) {
      console.error('Silme işlemi sırasında hata oluştu', error);
    }
    setLoading(false);
  };

  function formatKm(km) {
    return km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  const handleTeklifEkle = async (teklif) => {
    setLoading(true);
    const updatedTeklif = {
      ...teklif,
      km: teklif.km ? parseInt(teklif.km, 10) : null,
      modelYili: teklif.modelYili ? parseInt(teklif.modelYili, 10) : null,
      adSoyad: teklif.adSoyad || "Tanımsız",
      markaModel: teklif.markaModel || "Tanımsız",
      plaka: teklif.plaka || "Tanımsız",
      sasi: teklif.sasi || "Tanımsız",
      girisTarihi: teklif.girisTarihi || "Tanımsız",
      yapilanlar: teklif.yapilanlar || [],
    };

    console.log("teklif ekle teklif");
    try {
      const [deleteResponse] = await Promise.all([
        fetchWithAuth(`${API_URL}/teklif/${teklif.teklif_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      ]);

      // POST işlemi başarılı olup olmadığını kontrol et
      if (deleteResponse.ok)
      {
          console.log("delete teklif");
          const [postResponse] = await Promise.all([
            fetchWithAuth(`${API_URL}/card`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updatedTeklif),
            }),
          ]);

          if (postResponse.ok)
          {
            setTeklifler(teklifler.filter(t => t.teklif_id !== teklif.teklif_id));
          } 
          else 
          {
            console.error('Kart eklenirken bir hata oluştu');
          }
      } 
      else 
      {
        console.error('Teklif silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('İşlem sırasında bir hata oluştu:', error);
    }

    setLoading(false);
  };

  const filtrelenmisTeklifler = teklifler.filter(teklif => {
    const searchLower = aramaTerimi.toLowerCase();
    return (
      (teklif.adSoyad?.toLowerCase().includes(searchLower)) ||
      (teklif.markaModel?.toLowerCase().includes(searchLower)) ||
      (teklif.plaka?.toLowerCase().includes(searchLower)) ||
      (teklif.sasi?.toLowerCase().includes(searchLower)) ||
      (teklif.girisTarihi?.toString().includes(aramaTerimi))
    );
  });

  const handleExcelDownload = async (teklifId) => {
    setLoading(true);

    const teklif = teklifler.find(t => t.teklif_id === teklifId);

    if (!teklif) {
        console.error("Seçilen teklif bulunamadı");
        setLoading(false);
        return;
    }

    const dataToSend = {
        vehicleInfo: {
            adSoyad: teklif.adSoyad,
            telNo: teklif.telNo,
            markaModel: teklif.markaModel,
            plaka: teklif.plaka,
            km: teklif.km,
            modelYili: teklif.modelYili,
            sasi: teklif.sasi,
            renk: teklif.renk,
            girisTarihi: teklif.girisTarihi,
            notlar: teklif.notlar,
            adres: teklif.adres,
        },
        data: teklif.yapilanlar.map(item => ({
            birimAdedi: item.birimAdedi,
            parcaAdi: item.parcaAdi,
            birimFiyati: item.birimFiyati,
            toplamFiyat: item.birimFiyati * item.birimAdedi,
        })),
        notes: teklif.notlar
    };

    try {
        const response = await fetchWithAuth(`${API_URL}/excel/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'output.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Excel download error:', error);
    }
    setLoading(false);
};

const handlePDFDownload = async (teklifId) => {
  setLoading(true);

  const teklif = teklifler.find(t => t.teklif_id === teklifId);

  if (!teklif) {
      console.error("Seçilen teklif bulunamadı");
      setLoading(false);
      return;
  }

  const dataToSend = {
      vehicleInfo: {
          adSoyad: teklif.adSoyad,
          telNo: teklif.telNo,
          markaModel: teklif.markaModel,
          plaka: teklif.plaka,
          km: teklif.km,
          modelYili: teklif.modelYili,
          sasi: teklif.sasi,
          renk: teklif.renk,
          girisTarihi: teklif.girisTarihi,
          notlar: teklif.notlar,
          adres: teklif.adres,
      },
      data: teklif.yapilanlar.map(item => ({
          birimAdedi: item.birimAdedi,
          parcaAdi: item.parcaAdi,
          birimFiyati: item.birimFiyati,
          toplamFiyat: item.birimFiyati * item.birimAdedi,
      })),
      notes: teklif.notlar
  };

  try {
      const response = await fetchWithAuth(`${API_URL}/excel/pdf`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'output.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
  } catch (error) {
      console.error('PDF download error:', error);
  }
  setLoading(false);
};

const secilenTeklifleriIndir = async (type) => {
  setLoading(true);

  if (secilenTeklifler.length === 0) {
      console.error("İndirilecek teklif bulunamadı");
      setLoading(false);
      return;
  }

  // Seçilen tüm teklifleri indir
  for (const teklifId of secilenTeklifler) {
      if (type === 'excel') {
          await handleExcelDownload(teklifId);
      } else {
          await handlePDFDownload(teklifId);
      }
  }

  setLoading(false);
};

  return (
    <div className={`min-h-screen transition-all duration-1000 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <Head>
        <title>BBSM Garage - Teklifler</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz">
          <ul className="space-y-4">
            <li>
              <Link href="/login/kartlar" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Kartlar</Link>
            </li>
            <li>
              <Link href="/login/teklif" className="block p-2 text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Teklif</Link>
            </li>
            <li>
              <Link href="/login/stok" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Stok Takibi</Link>
            </li>
            <li>
              <Link href="/login/bizeulasin" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Bize Ulaşın</Link>
            </li>
          </ul>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
          <div className="px-3 py-3 lg:px-5 lg:pl-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button onClick={toggleMenu} className={`lg:hidden p-3 font-bold text-lg leading-tight antialiased ${isOpen ? 'hidden' : ''}`}>
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
                  <p className="text-center text-my-siyah font-semibold items-center pr-8">{username}</p>
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
                          <p className="text-sm font-semibold text-my-siyah">{username}</p>
                          <p className="text-xs text-gray-500 mt-1">Firma Hesabı</p>
                        </div>
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            alert('Profil ayarları yakında eklenecek');
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
                            alert('Şifre değiştirme yakında eklenecek');
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

        {/* MOBILE LAYOUT */}
        <div className="md:hidden bg-white min-h-screen pt-24 px-2">
          {/* Search bar at the top */}
          <div className="w-full mb-2">
            <input
              type="text"
              id="table-search-mobile"
              className="block w-full p-2 text-md text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Teklifleri ara"
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
            />
          </div>
          {/* Action buttons stacked */}
          <div className="flex flex-col gap-2 w-full mb-4">
            <button onClick={silSecilenleri} className="w-full bg-red-600 text-white font-semibold py-2 rounded-full">Seçilenleri Sil</button>
            <button onClick={() => secilenTeklifleriIndir('excel')} className="w-full bg-green-500 text-white font-semibold py-2 rounded-full">Seçilenleri Excel İndir</button>
            <button onClick={() => secilenTeklifleriIndir('pdf')} className="w-full bg-orange-600 text-white font-semibold py-2 rounded-full">Seçilenleri PDF İndir</button>
          </div>
          {/* Teklif list as cards */}
          <div className="w-full">
            {filtrelenmisTeklifler.map((teklif) => (
              <div key={teklif.teklif_id} className="w-full border-b last:border-b-0 px-2 py-2 flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                  checked={secilenTeklifler.includes(teklif.teklif_id)}
                  onChange={(e) => handleCheckboxChange(e, teklif.teklif_id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{capitalizeWords(teklif.adSoyad || "Tanımsız")}</div>
                  <div className="text-xs text-gray-600 truncate">{capitalizeWords(teklif.markaModel || "Tanımsız")}</div>
                  <div className="text-xs text-green-600 font-semibold">{toUpperCase(teklif.plaka || "Tanımsız")}</div>
                  <div className="text-xs text-gray-600">{teklif.km !== undefined && teklif.km !== null ? formatKm(teklif.km) : "Tanımsız"} km</div>
                  <div className="text-xs text-blue-500">{teklif.girisTarihi || "Tanımsız"}</div>
                </div>
                <div className="flex flex-col items-center ml-2 gap-2">
                  <button onClick={() => handleTeklifEkle(teklif)} className="text-blue-500 hover:text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <a href={DetailPage(teklif.teklif_id)} className="text-yellow-500 hover:text-yellow-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <div className="flex gap-2">
                    <button onClick={() => handleExcelDownload(teklif.teklif_id)} className="text-green-500 hover:text-green-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button onClick={() => handlePDFDownload(teklif.teklif_id)} className="text-orange-600 hover:text-orange-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DESKTOP TABLE (unchanged) */}
        <div className="hidden md:block p-6 pt-8 lg:ml-64">
          <div className="p-6 mt-20 bg-my-beyaz rounded-3xl">
            <div className="flex items-center pb-4 justify-between">
              <div className="flex items-center">
                <div className="pr-4 items-center ">
                  <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between ">
                    <p className="font-bold text-xl text-my-siyah">Tekliflerim</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="items-center bg-red-600 p-2 pl-4 pr-4 rounded-full ml-4">
                  <button onClick={silSecilenleri} className="font-semibold text-my-beyaz text-md">Seçilenleri Sil</button>
                </div>
                <div className="items-center bg-green-500 p-2 pl-4 pr-4 rounded-full ml-4">
                  <button onClick={() => secilenTeklifleriIndir('excel')} className="font-semibold text-my-beyaz text-md">Seçilenleri Excel İndir</button>
                </div>
                <div className="items-center bg-blue-500 p-2 pl-4 pr-4 rounded-full ml-4">
                  <button onClick={() => secilenTeklifleriIndir('pdf')} className="font-semibold text-my-beyaz text-md">Seçilenleri PDF İndir</button>
                </div>

                <div className="pr-4 items-center pl-4">
                  <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between">
                    <label htmlFor="table-search" className="sr-only">Search</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 " aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      <input type="text" id="table-search"
                        className="block p-2 ps-10 text-md text-gray-900 border border-gray-300 rounded-full w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Teklifleri ara"
                        value={aramaTerimi}
                        onChange={(e) => setAramaTerimi(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-auto h-140">
              <table className="w-full text-sm text-left text-gray-500 font-medium">
                <thead className="text-xs text-gray-600 uppercase bg-my-edbeyaz">
                  <tr>
                    <th scope="col" className="p-4"></th>
                    <th scope="col" className="px-6 py-3">
                      Ad-Soyad
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Marka-Model
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Plaka
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Km
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Şasİ No
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Giriş Tarihi
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Kartlara Ekle
                    </th>
                    <th scope="col" className="pl-5 px-4 py-3">
                      Görüntüle
                    </th>
                    <th scope="col" className="pl-10 px-4 py-3">
                      İndİr
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrelenmisTeklifler.map((teklif) => (
                    <tr key={teklif.teklif_id}>
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            checked={secilenTeklifler.includes(teklif.teklif_id)}
                            onChange={(e) => handleCheckboxChange(e, teklif.teklif_id)}
                          />
                          <label htmlFor={`checkbox-table-${teklif.teklif_id}`} className="sr-only">checkbox</label>
                        </div>
                      </td>
                      <td className="px-6 py-2 font-medium text-gray-900 whitespace-nowrap">
                        {capitalizeWords(teklif.adSoyad || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2">
                        {(teklif.markaModel || "Tanımsız").length > 20 ? `${toUpperCase((teklif.markaModel || "Tanımsız").substring(0, 20))}...` : capitalizeWords(teklif.markaModel || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2 text-green-500">
                        {toUpperCase(teklif.plaka || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2">
                        {teklif.km !== undefined && teklif.km !== null ? formatKm(teklif.km) : "Tanımsız"}
                      </td>
                      <td className="px-6 py-2 uppercase">
                        {(teklif.sasi || "Tanımsız").length > 7 ? `${toUpperCase((teklif.sasi || "Tanımsız").substring(0, 7))}...` : toUpperCase(teklif.sasi || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2 text-blue-500">
                        {teklif.girisTarihi || "Tanımsız"}
                      </td>
                      <td className="px-8 py-2">
                        <button onClick={() => handleTeklifEkle(teklif)} className="bg-blue-500 p-2 pl-6 pr-6 rounded-full font-medium text-my-beyaz hover:underline">Ekle</button>
                      </td>
                      <td className="px-6 py-2">
                        <a href={DetailPage(teklif.teklif_id)} className="bg-yellow-500 p-2 pl-4 pr-4 rounded-full font-medium text-my-siyah hover:underline">Detay</a>
                      </td>
                      <td className="px-6 py-2 flex gap-2">
                        <button onClick={() => handleExcelDownload(teklif.teklif_id)} className="bg-green-500 p-2 pl-4 pr-4 rounded-full font-medium text-my-beyaz hover:underline">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button onClick={() => handlePDFDownload(teklif.teklif_id)} className="bg-blue-500 p-2 pl-4 pr-4 rounded-full font-medium text-my-beyaz hover:underline">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
