import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import AnaBilesen from '@/components/AnaBilesen';
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';

const Kartlar = () => {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isYeniKartEkleModalOpen, setIsYeniKartEkleModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Sayfa yüklendiğinde fade-in animasyonu
  useEffect(() => {
    setIsPageLoaded(false);
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Profil verilerini yükle
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
  const [secilenKartlar, setSecilenKartlar] = useState([]);
  const [aramaTerimi, setAramaTerimi] = useState('');
  const [teklifler, setTeklifler] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });


  const DetailPage = (id) => {
    return (id ? `/login/kartlar/detay?id=${id}` : '/login/kartlar');
  };

  const capitalizeWords = (string) => {
    return string.split(' ').map(word => {
      return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
    }).join(' ');
  };

  const toUpperCase = (string) => {
    return string.toUpperCase();
  };

  const handleCheckboxChange = (e, kartId) => {
    if (e.target.checked) {
      setSecilenKartlar([...secilenKartlar, kartId]);
    } else {
      setSecilenKartlar(secilenKartlar.filter(card_id => card_id !== kartId));
    }
  };

  const silSecilenleri = async () => {
    setLoading(true);
    if (secilenKartlar.length === 0) {
      alert("Silmek için en az bir kart seçmelisiniz.");
      setLoading(false);
      return;
    }
    try {
      const deleteRequests = secilenKartlar.map(kartId =>
        fetch(`${API_URL}/card/${kartId}`, { method: 'DELETE' })
      );
      await Promise.all(deleteRequests);

      const guncellenmisKartlar = kartlar.filter(kart => !secilenKartlar.includes(kart.card_id));
      setKartlar(guncellenmisKartlar);
      setSecilenKartlar([]);
    } catch (error) {
      console.error('Silme işlemi sırasında hata oluştu', error);
    }
    setLoading(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleYeniKartEkleModal = () => {
    setIsYeniKartEkleModalOpen(!isYeniKartEkleModalOpen);
  };

  const fetchTeklifListesi = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/teklif`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTeklifler(data);
    } catch (error) {
      console.error('Teklifler API çağrısı başarısız:', error);
    }
    setLoading(false);
  };
  
  const fetchKartListesi = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/card`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setKartlar(data);
    } catch (error) {
      console.error('Kartlar API çağrısı başarısız:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchTeklifListesi();
      await fetchKartListesi();
    };
  
    fetchData();
  }, []);

  const handleKartEkle = async (yeniKart) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(yeniKart),
      });

      if (response.ok) {
        const eklenenKart = await response.json();
        setKartlar([...kartlar, eklenenKart]);
        toggleYeniKartEkleModal();
      } else {
        console.error('Kart eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Kart eklenirken bir hata oluştu:', error);
    }
    setLoading(false);
  };

  const handleTeklifEkle = async (yeniTeklif) => {
    setLoading(true);
    // Boş veya eksik değerleri kontrol et ve varsayılan değerlere ayarla
    const teklif = {
      ...yeniTeklif,
      km: yeniTeklif.km ? parseInt(yeniTeklif.km, 10) : 0, // km alanı eksikse varsayılan olarak 0 ata
      modelYili: yeniTeklif.modelYili ? parseInt(yeniTeklif.modelYili, 10) : 0, // modelYili alanı eksikse varsayılan olarak 0 ata
      adSoyad: yeniTeklif.adSoyad || "Tanımsız", // adSoyad alanı eksikse varsayılan olarak "Tanımsız" ata
      markaModel: yeniTeklif.markaModel || "Tanımsız", // markaModel alanı eksikse varsayılan olarak "Tanımsız" ata
      plaka: yeniTeklif.plaka || "Tanımsız", // plaka alanı eksikse varsayılan olarak "Tanımsız" ata
      sasi: yeniTeklif.sasi || "Tanımsız", // sasi alanı eksikse varsayılan olarak "Tanımsız" ata
      girisTarihi: yeniTeklif.girisTarihi || "Tanımsız", // girisTarihi alanı eksikse varsayılan olarak "Tanımsız" ata
      yapilanlar: yeniTeklif.yapilanlar || [],
    };

    try {
      // Teklifi teklif tablosuna ekle
      const response = await fetch(`${API_URL}/teklif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teklif),
      });

      if (response.ok) {
        const eklenenTeklif = await response.json();
        setTeklifler(prevTeklifler => [...prevTeklifler, eklenenTeklif]);

        // Modalı kapat
        toggleYeniKartEkleModal();
      } else {
        console.error('Teklif eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('İşlem sırasında bir hata oluştu:', error);
    }
    setLoading(false);
  };

  function formatKm(km) {
    return km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  const filtrelenmisKartlar = kartlar.filter(kart =>
    kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.sasi?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.km?.toString().includes(aramaTerimi) ||
    kart.girisTarihi?.toString().includes(aramaTerimi)
  );


  const parseDate = (str) => {
    if (!str || str.toLowerCase() === "tanımsız") return null;
    const [day, month, year] = str.split('-');
    if (!day || !month || !year) return null;
    const formattedDate = `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return new Date(formattedDate);
  };
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedKartlar = React.useMemo(() => {
    let sortableItems = [...kartlar];
  
    sortableItems.sort((a, b) => {
      if (sortConfig.key === 'girisTarihi') {
        const dateA = parseDate(a.girisTarihi);
        const dateB = parseDate(b.girisTarihi);
  
        if (dateA === null && dateB !== null) return 1;
        if (dateA !== null && dateB === null) return -1;
        if (dateA === null && dateB === null) return 0;
  
        if (dateA < dateB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (dateA > dateB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      } else {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  
    return sortableItems;
  }, [kartlar, sortConfig]);

  const handleExcelDownload = async (kartId) => {
    setLoading(true);

    const kart = kartlar.find(k => k.card_id === kartId);

    if (!kart) {
        console.error("Seçilen kart bulunamadı");
        setLoading(false);
        return;
    }

    const dataToSend = {
        vehicleInfo: {
            adSoyad: kart.adSoyad,
            telNo: kart.telNo,
            markaModel: kart.markaModel,
            plaka: kart.plaka,
            km: kart.km,
            modelYili: kart.modelYili,
            sasi: kart.sasi,
            renk: kart.renk,
            girisTarihi: kart.girisTarihi,
            notlar: kart.notlar,
            adres: kart.adres,
        },
        data: kart.yapilanlar.map(item => ({
            birimAdedi: item.birimAdedi,
            parcaAdi: item.parcaAdi,
            birimFiyati: item.birimFiyati,
            toplamFiyat: item.birimFiyati * item.birimAdedi,
        })),
        notes: kart.notlar
    };

    try {
        const response = await fetchWithAuth(`${API_URL}/excel/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
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

const handlePDFDownload = async (kartId) => {
  setLoading(true);

  const kart = kartlar.find(k => k.card_id === kartId);

  if (!kart) {
      console.error("Seçilen kart bulunamadı");
      setLoading(false);
      return;
  }

  const dataToSend = {
      vehicleInfo: {
          adSoyad: kart.adSoyad,
          telNo: kart.telNo,
          markaModel: kart.markaModel,
          plaka: kart.plaka,
          km: kart.km,
          modelYili: kart.modelYili,
          sasi: kart.sasi,
          renk: kart.renk,
          girisTarihi: kart.girisTarihi,
          notlar: kart.notlar,
          adres: kart.adres,
      },
      data: kart.yapilanlar.map(item => ({
          birimAdedi: item.birimAdedi,
          parcaAdi: item.parcaAdi,
          birimFiyati: item.birimFiyati,
          toplamFiyat: item.birimFiyati * item.birimAdedi,
      })),
      notes: kart.notlar
  };

  try {
      const response = await fetchWithAuth(`${API_URL}/excel/pdf`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend)
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

const secilenKartlariIndir = async (type) => {
  setLoading(true);

  if (secilenKartlar.length === 0) {
      alert("İndirilecek kart bulunamadı");
      setLoading(false);
      return;
  }

  // Seçilen tüm kartları indir
  for (const kartId of secilenKartlar) {
      if (type === 'excel') {
          await handleExcelDownload(kartId);
      } else {
          await handlePDFDownload(kartId);
      }
  }

  setLoading(false);
};


  

  return (
    <div className={`min-h-screen transition-all duration-1000 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <Head>
        <title>BBSM Garage - Kartlar</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-all duration-500 ease-out ${isSidebarOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full sidebar-exit'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz">
          <ul className="space-y-4">
            <li>
              <Link href="#" className="block p-2 text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Kartlar</Link>
            </li>
            <li>
              <Link href="/login/teklif" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Teklif</Link>
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
                <button onClick={toggleSidebar} className={`lg:hidden p-3 font-bold text-lg leading-tight antialiased ${isSidebarOpen ? 'hidden' : ''}`}>
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
                  <p className="text-center text-my-siyah font-semibold items-center pr-8">{username}</p>
                  <img 
                    src="/images/yasin.webp" 
                    className="h-16 w-16 rounded-full object-cover" 
                    alt="Kullanıcı"
                  />
                </button>
                
                {/* Settings Dropdown */}
                {isSettingsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSettingsOpen(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 dropdown-enter">
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-semibold text-my-siyah">{username}</p>
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

        <div className="p-6 pt-8 lg:ml-64 ">
          <div className="p-6 mt-20 bg-my-beyaz rounded-3xl">
            <div className="flex items-center pb-4 justify-between">
              <div className="flex items-center">
                <div className="pr-4 items-center ">
                  <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between ">
                    <p className="font-bold text-xl text-my-siyah">Kartlarım</p>
                  </div>
                </div>
              </div>

              {/* Desktop action buttons and search bar - only show on md and up */}
              <div className="flex items-center">
                <div className="hidden md:flex items-center">
                  <div className="items-center bg-red-600 p-2 pl-4 pr-4 rounded-full ml-4">
                    <button onClick={silSecilenleri} className="font-semibold text-my-beyaz text-md">Seçilenleri Sil</button>
                  </div>
                  <div className="items-center bg-green-500 p-2 pl-4 pr-4 rounded-full ml-4">
                    <button onClick={() => secilenKartlariIndir('excel')} className="font-semibold text-my-beyaz text-md">Seçilenleri Excel İndir</button>
                  </div>
                  <div className="items-center bg-orange-600 p-2 pl-4 pr-4 rounded-full ml-4">
                    <button onClick={() => secilenKartlariIndir('pdf')} className="font-semibold text-my-beyaz text-md">Seçilenleri PDF İndir</button>
                  </div>
                </div>
                <div className="items-center bg-my-mavi p-2 pl-4 pr-4 rounded-full ml-4">
                  <button onClick={toggleYeniKartEkleModal} className="font-semibold text-my-beyaz text-md">Yeni Kart Ekle</button>
                </div>
                <div className="hidden md:block pr-4 items-center pl-4">
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
                        placeholder="Kartları ara"
                        value={aramaTerimi}
                        onChange={(e) => setAramaTerimi(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-sm text-left text-gray-500 font-medium">
                  <thead className="text-xs text-gray-600 uppercase bg-my-edbeyaz">
                    <tr>
                      <th scope="col" className="p-4"></th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('adSoyad')}>
                        Ad-Soyad {sortConfig.key === 'adSoyad' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('markaModel')}>
                        Marka-Model {sortConfig.key === 'markaModel' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('plaka')}>
                        Plaka {sortConfig.key === 'plaka' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('km')}>
                        Km {sortConfig.key === 'km' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('sasi')}>
                        Şasİ No {sortConfig.key === 'sasi' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('girisTarihi')}>
                        Giriş Tarihi {sortConfig.key === 'girisTarihi' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Görüntüle
                      </th>
                      <th scope="col" className="px-6 py-3">
                        İndİr
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedKartlar.filter(kart =>
                      kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.sasi?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.km?.toString().includes(aramaTerimi) ||
                      kart.girisTarihi?.toString().includes(aramaTerimi)
                    ).map((kart) => (
                      <tr key={kart.card_id}>
                        <td className="w-4 p-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              checked={secilenKartlar.includes(kart.card_id)}
                              onChange={(e) => handleCheckboxChange(e, kart.card_id)}
                            />
                            <label htmlFor={`checkbox-table-${kart.card_id}`} className="sr-only">checkbox</label>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {capitalizeWords(kart.adSoyad || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4">
                          {capitalizeWords(kart.markaModel || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4 text-green-500">
                          {toUpperCase(kart.plaka || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4">
                          {kart.km !== undefined && kart.km !== null ? formatKm(kart.km) : "Tanımsız"}
                        </td>
                        <td className="px-6 py-4 uppercase">
                          {(kart.sasi || "Tanımsız").length > 17  ? `${toUpperCase((kart.sasi || "Tanımsız").substring(0, 17))}...` : toUpperCase(kart.sasi || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4 text-blue-500">
                          {kart.girisTarihi || "Tanımsız"}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={DetailPage(kart.card_id)} className="bg-yellow-500 p-2 pl-4 pr-4 rounded-full font-medium text-my-siyah hover:underline">Detay</Link>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => handleExcelDownload(kart.card_id)} className="bg-green-500 p-2 pl-4 pr-4 rounded-full font-medium text-my-beyaz hover:underline">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button onClick={() => handlePDFDownload(kart.card_id)} className="bg-orange-600 p-2 pl-4 pr-4 rounded-full font-medium text-my-beyaz hover:underline">
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

              {/* MOBILE LAYOUT */}
              <div className="md:hidden">
                {/* Search bar at the top */}
                <div className="w-full mb-2">
                  <input
                    type="text"
                    id="table-search-mobile"
                    className="block w-full p-2 text-md text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Kartları ara"
                    value={aramaTerimi}
                    onChange={(e) => setAramaTerimi(e.target.value)}
                  />
                </div>
                {/* Action buttons stacked */}
                <div className="flex flex-col gap-2 w-full mb-4">
                  <button onClick={silSecilenleri} className="w-full bg-red-600 text-white font-semibold py-2 rounded-full">Seçilenleri Sil</button>
                  <button onClick={() => secilenKartlariIndir('excel')} className="w-full bg-green-500 text-white font-semibold py-2 rounded-full">Seçilenleri Excel İndir</button>
                  <button onClick={() => secilenKartlariIndir('pdf')} className="w-full bg-blue-500 text-white font-semibold py-2 rounded-full">Seçilenleri PDF İndir</button>
                </div>
                {/* Card list, full width, white bg, compact */}
                <div className="w-full bg-white">
                  {sortedKartlar.filter(kart =>
                    kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.sasi?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.km?.toString().includes(aramaTerimi) ||
                    kart.girisTarihi?.toString().includes(aramaTerimi)
                  ).map((kart) => (
                    <div key={kart.card_id} className="w-full border-b last:border-b-0 px-2 py-2 flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                        checked={secilenKartlar.includes(kart.card_id)}
                        onChange={(e) => handleCheckboxChange(e, kart.card_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{capitalizeWords(kart.adSoyad || "Tanımsız")}</div>
                        <div className="text-xs text-gray-600 truncate">{capitalizeWords(kart.markaModel || "Tanımsız")}</div>
                        <div className="text-xs text-green-600 font-semibold">{toUpperCase(kart.plaka || "Tanımsız")}</div>
                        <div className="text-xs text-gray-600">{kart.km !== undefined && kart.km !== null ? formatKm(kart.km) : "Tanımsız"} km</div>
                        <div className="text-xs text-blue-500">{kart.girisTarihi || "Tanımsız"}</div>
                      </div>
                      <div className="flex flex-col items-center ml-2 gap-2">
                        <Link href={DetailPage(kart.card_id)} className="text-yellow-500 hover:text-yellow-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <div className="flex gap-2">
                          <button onClick={() => handleExcelDownload(kart.card_id)} className="text-green-500 hover:text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button onClick={() => handlePDFDownload(kart.card_id)} className="text-orange-600 hover:text-orange-600">
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
            </div>
          </div>
        </div>
      </div>

      {/* Modal - moved outside the main content div */}
      {isYeniKartEkleModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 modal-overlay" onClick={() => setIsYeniKartEkleModalOpen(false)}>
          <div className="relative modal-content" onClick={(e) => e.stopPropagation()}>
            <AnaBilesen 
              onClose={() => setIsYeniKartEkleModalOpen(false)} 
              onKartEkle={handleKartEkle} 
              onTeklifEkle={handleTeklifEkle} 
            />
          </div>
        </div>
      )}

      {/* Profil Bilgileri Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={async () => {
            setIsProfileModalOpen(false);
            setIsEditingProfile(false);
              // Modal kapandığında profil verilerini yeniden yükle
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
};

// Profil Bilgileri Modal Component
const ProfileModal = ({ isOpen, onClose, profileData, setProfileData, isEditing, setIsEditing, fetchWithAuth, API_URL, setLoading }) => {
  const [formData, setFormData] = useState({
    firmaAdi: '',
    yetkiliKisi: '',
    telefon: '',
    email: '',
    adres: '',
    vergiNo: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFormData({
        firmaAdi: profileData.firmaAdi || '',
        yetkiliKisi: profileData.yetkiliKisi || '',
        telefon: profileData.telefon || '',
        email: profileData.email || '',
        adres: profileData.adres || '',
        vergiNo: profileData.vergiNo || ''
      });
    }
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !profileData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-overlay overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 my-8 modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-my-siyah">Profil Bilgileri</h2>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Düzenle
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">Profil başarıyla güncellendi!</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Sistem Bilgileri - Düzenlenemez */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Sistem Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-my-siyah">{profileData.username}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant ID</label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-my-siyah font-mono">{profileData.tenant_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firma Bilgileri - Düzenlenebilir */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Firma Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Firma Adı</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firmaAdi"
                      value={formData.firmaAdi}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Firma Adı"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-my-siyah">{formData.firmaAdi || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vergi No</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="vergiNo"
                      value={formData.vergiNo}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Vergi Numarası"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-my-siyah">{formData.vergiNo || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri - Düzenlenebilir */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">İletişim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Yetkili Kişi</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="yetkiliKisi"
                      value={formData.yetkiliKisi}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Yetkili Kişi Adı"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-my-siyah">{formData.yetkiliKisi || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="05XX XXX XX XX"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-my-siyah">{formData.telefon || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">E-posta</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="ornek@firma.com"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-my-siyah">{formData.email || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Adres</label>
                  {isEditing ? (
                    <textarea
                      name="adres"
                      value={formData.adres}
                      onChange={handleChange}
                      rows="3"
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      placeholder="Firma Adresi"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-my-siyah whitespace-pre-wrap">{formData.adres || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    // Form verilerini sıfırla
                    if (profileData) {
                      setFormData({
                        firmaAdi: profileData.firmaAdi || '',
                        yetkiliKisi: profileData.yetkiliKisi || '',
                        telefon: profileData.telefon || '',
                        email: profileData.email || '',
                        adres: profileData.adres || '',
                        vergiNo: profileData.vergiNo || ''
                      });
                    }
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-my-siyah text-white rounded-lg hover:bg-my-4b4b4bgri transition-colors"
                >
                  Kaydet
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-my-siyah text-white rounded-lg hover:bg-my-4b4b4bgri transition-colors"
              >
                Kapat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Şifre Değiştirme Modal Component
const ChangePasswordModal = ({ isOpen, onClose, fetchWithAuth, API_URL, setLoading }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 3) {
      setError('Yeni şifre en az 3 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (oldPassword === newPassword) {
      setError('Yeni şifre eski şifre ile aynı olamaz');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Şifre değiştirilemedi');
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      setError('Şifre değiştirilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-my-siyah">Şifre Değiştir</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-600">Şifre başarıyla değiştirildi!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Eski Şifre</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  minLength={3}
                />
                <p className="text-xs text-gray-500 mt-1">En az 3 karakter olmalıdır</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Yeni Şifre Tekrar</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  minLength={3}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-my-siyah text-white rounded-lg hover:bg-my-4b4b4bgri transition-colors"
                >
                  Değiştir
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(Kartlar);
