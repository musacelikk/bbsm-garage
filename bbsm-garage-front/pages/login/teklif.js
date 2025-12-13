import React, { useState, useEffect, useMemo } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useRouter } from 'next/router';
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import ProfileModal from '../../components/ProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe, useVerticalSwipe } from '../../hooks/useTouchGestures';
import { useToast } from '../../contexts/ToastContext';
import { useProfile } from '../../contexts/ProfileContext';

function Teklif() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { success, error: showError, warning } = useToast();
  const { profileData, refreshProfile } = useProfile();
  const router = useRouter();
  const username = getUsername() || 'Kullanıcı';
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [teklifler, setTeklifler] = useState([]);
  const [secilenTeklifler, setSecilenTeklifler] = useState([]);
  const [aramaTerimi, setAramaTerimi] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  // Pull to refresh için
  const handlePullToRefresh = () => {
    fetchTeklifListesi();
  };

  // Sidebar için swipe gesture (sağdan sola swipe ile açma)
  const sidebarSwipe = useSwipe(
    null, // swipe left
    () => setIsOpen(true), // swipe right - sidebar'ı aç
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
      console.error('Teklifler yükleme hatası:', error);
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
      success(`${secilenTeklifler.length} teklif başarıyla silindi.`);
    } catch (error) {
      console.error('Silme işlemi sırasında hata oluştu', error);
      showError('Silme işlemi sırasında bir hata oluştu.');
    }
    setLoading(false);
  };

  const secilenTeklifleriKartlaraAktar = async () => {
    if (secilenTeklifler.length === 0) {
      warning('Kartlara aktarmak için en az bir teklif seçmelisiniz.');
      return;
    }

    setLoading(true);
    try {
      const secilenTeklifObjesi = teklifler.filter(teklif => 
        secilenTeklifler.includes(teklif.teklif_id)
      );

      let basariliSayisi = 0;
      let hataSayisi = 0;

      for (const teklif of secilenTeklifObjesi) {
        try {
          const updatedTeklif = {
            ...teklif,
            km: teklif.km ? parseInt(teklif.km, 10) : null,
            modelYili: teklif.modelYili ? parseInt(teklif.modelYili, 10) : null,
            adSoyad: teklif.adSoyad || "Tanımsız",
            markaModel: teklif.markaModel || "Tanımsız",
            plaka: teklif.plaka || "Tanımsız",
            sasi: teklif.sasi || "Tanımsız",
            girisTarihi: teklif.girisTarihi || "Tanımsız",
            notlar: teklif.notlar || "",
            adres: teklif.adres || "",
            duzenleyen: teklif.duzenleyen || username,
            yapilanlar: teklif.yapilanlar || [],
          };

          // Önce kartı oluştur
          const postResponse = await fetchWithAuth(`${API_URL}/card`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTeklif),
          });

          if (postResponse.ok) {
            // Kart başarıyla oluşturuldu, teklifi sil
            await fetchWithAuth(`${API_URL}/teklif/${teklif.teklif_id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            basariliSayisi++;
          } else {
            hataSayisi++;
          }
        } catch (error) {
          console.error(`Teklif ${teklif.teklif_id} aktarılırken hata:`, error);
          hataSayisi++;
        }
      }

      // Listeyi güncelle
      await fetchTeklifListesi();
      setSecilenTeklifler([]);

      if (basariliSayisi > 0) {
        success(`${basariliSayisi} teklif başarıyla kartlara aktarıldı!`);
        // Kartlar sayfasına yönlendir
        setTimeout(() => {
          router.push('/login/kartlar');
        }, 1500);
      }
      
      if (hataSayisi > 0) {
        showError(`${hataSayisi} teklif aktarılırken hata oluştu.`);
      }
    } catch (error) {
      console.error('Aktarım işlemi sırasında hata oluştu', error);
      showError('Teklifler kartlara aktarılırken bir hata oluştu.');
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
      notlar: teklif.notlar || "",
      adres: teklif.adres || "",
      duzenleyen: teklif.duzenleyen || username,
      yapilanlar: teklif.yapilanlar || [],
    };

    try {
      // Önce kartı oluştur
      const postResponse = await fetchWithAuth(`${API_URL}/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTeklif),
      });

      if (postResponse.ok) {
        // Kart başarıyla oluşturuldu, teklifi sil
        const deleteResponse = await fetchWithAuth(`${API_URL}/teklif/${teklif.teklif_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (deleteResponse.ok) {
          setTeklifler(teklifler.filter(t => t.teklif_id !== teklif.teklif_id));
          success('Teklif başarıyla kartlara aktarıldı!');
          // Kartlar sayfasına yönlendir
          setTimeout(() => {
            router.push('/login/kartlar');
          }, 1500);
        } else {
          showError('Teklif silinirken bir hata oluştu.');
        }
      } else {
        showError('Kart eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('İşlem sırasında bir hata oluştu:', error);
      showError('Teklif kartlara aktarılırken bir hata oluştu.');
    }

    setLoading(false);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const sortedTeklifler = useMemo(() => {
    let sortableItems = [...teklifler];
  
    if (sortConfig.key) {
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
    }
  
    return sortableItems;
  }, [teklifler, sortConfig]);

  const filtrelenmisTeklifler = sortedTeklifler.filter(teklif => {
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
    <div 
      className="min-h-screen dark-bg-primary"
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Teklifler</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        activePage="teklif"
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={toggleMenu}
          isSidebarOpen={isOpen}
        />

        <ProtectedPage>
          {/* MOBILE LAYOUT */}
          <div 
            className="md:hidden dark-bg-primary min-h-screen pt-24 px-2"
            {...pullToRefresh}
          >
            {/* Search bar at the top */}
          <div className="w-full mb-3">
            <input
              type="text"
              id="table-search-mobile"
              className="block w-full p-3 text-sm md:text-md dark-text-primary neumorphic-input rounded-full touch-manipulation min-h-[44px]"
              placeholder="Teklifleri ara"
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
            />
          </div>
          {/* Action buttons stacked - Mobil için daha büyük touch target */}
          <div className="flex flex-col gap-3 w-full mb-4">
            <button 
              onClick={secilenTeklifleriKartlaraAktar} 
              className="w-full text-white font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px]"
              style={{ backgroundColor: '#0A0875' }}
            >
              Seçilenleri Kartlara Aktar
            </button>
            <button 
              onClick={silSecilenleri} 
              className="w-full text-white font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px]"
              style={{ backgroundColor: '#4D1961' }}
            >
              Seçilenleri Sil
            </button>
            <button 
              onClick={() => secilenTeklifleriIndir('excel')} 
              className="w-full text-white font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px]"
              style={{ backgroundColor: '#8F294D' }}
            >
              Seçilenleri Excel İndir
            </button>
            <button 
              onClick={() => secilenTeklifleriIndir('pdf')} 
              className="w-full text-white font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px]"
              style={{ backgroundColor: '#D43A38' }}
            >
              Seçilenleri PDF İndir
            </button>
          </div>
          {/* Teklif list as cards - Mobil için optimize edilmiş */}
          <div className="w-full dark-card-bg neumorphic-card rounded-xl overflow-hidden">
            {filtrelenmisTeklifler.map((teklif) => (
              <div key={teklif.teklif_id} className="w-full border-b last:border-b-0 dark-border px-3 py-3 flex items-center active:dark-bg-tertiary transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-500 dark-bg-tertiary dark-border rounded focus:ring-blue-500 mr-3 touch-manipulation"
                  checked={secilenTeklifler.includes(teklif.teklif_id)}
                  onChange={(e) => handleCheckboxChange(e, teklif.teklif_id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold dark-text-primary text-base truncate mb-1">{capitalizeWords(teklif.adSoyad || "Tanımsız")}</div>
                  <div className="text-sm dark-text-secondary truncate mb-1">{capitalizeWords(teklif.markaModel || "Tanımsız")}</div>
                  <div className="text-sm text-green-400 font-semibold mb-1">{toUpperCase(teklif.plaka || "Tanımsız")}</div>
                  <div className="text-xs dark-text-secondary mb-1">{teklif.km !== undefined && teklif.km !== null ? formatKm(teklif.km) : "Tanımsız"} km</div>
                  <div className="text-xs text-blue-400">{teklif.girisTarihi || "Tanımsız"}</div>
                </div>
                <div className="flex flex-col items-center ml-3 gap-3">
                  <button 
                    onClick={() => handleTeklifEkle(teklif)} 
                    className="text-blue-400 hover:text-blue-300 active:scale-90 transition-transform p-2 touch-manipulation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <a 
                    href={DetailPage(teklif.teklif_id)} 
                    className="text-yellow-400 hover:text-yellow-300 active:scale-90 transition-transform p-2 touch-manipulation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleExcelDownload(teklif.teklif_id)} 
                      className="text-green-400 hover:text-green-300 active:scale-90 transition-transform p-2 touch-manipulation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handlePDFDownload(teklif.teklif_id)} 
                      className="text-orange-400 hover:text-orange-300 active:scale-90 transition-transform p-2 touch-manipulation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="hidden md:block p-3 md:p-4 lg:p-6 pt-4 md:pt-6 lg:pt-8 lg:ml-64 dark-bg-primary">
          <div className="p-3 md:p-4 lg:p-6 mt-16 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl">
            <div className="flex items-center pb-4 justify-between">
              <div className="flex items-center">
                <div className="pr-4 items-center ">
                  <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between ">
                    <p className="font-semibold text-base md:text-lg dark-text-primary">Tekliflerim</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="items-center p-2 md:p-2 pl-3 md:pl-4 pr-3 md:pr-4 rounded-full ml-2 md:ml-4" style={{ backgroundColor: '#0A0875' }}>
                  <button onClick={secilenTeklifleriKartlaraAktar} className="font-semibold text-white text-xs md:text-sm lg:text-md whitespace-nowrap">Kartlara Aktar</button>
                </div>
                <div className="items-center p-2 md:p-2 pl-3 md:pl-4 pr-3 md:pr-4 rounded-full ml-2 md:ml-4" style={{ backgroundColor: '#4D1961' }}>
                  <button onClick={silSecilenleri} className="font-semibold text-white text-xs md:text-sm lg:text-md whitespace-nowrap">Seçilenleri Sil</button>
                </div>
                <div className="items-center p-2 md:p-2 pl-3 md:pl-4 pr-3 md:pr-4 rounded-full ml-2 md:ml-4" style={{ backgroundColor: '#8F294D' }}>
                  <button onClick={() => secilenTeklifleriIndir('excel')} className="font-semibold text-white text-xs md:text-sm lg:text-md whitespace-nowrap">Excel İndir</button>
                </div>
                <div className="items-center p-2 md:p-2 pl-3 md:pl-4 pr-3 md:pr-4 rounded-full ml-2 md:ml-4" style={{ backgroundColor: '#D43A38' }}>
                  <button onClick={() => secilenTeklifleriIndir('pdf')} className="font-semibold text-white text-xs md:text-sm lg:text-md whitespace-nowrap">PDF İndir</button>
                </div>

                <div className="pr-4 items-center pl-4">
                  <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between">
                    <label htmlFor="table-search" className="sr-only">Search</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
                        <svg className="w-5 h-5 dark-text-muted" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      <input type="text" id="table-search"
                        className="block p-2 ps-10 text-md dark-text-primary neumorphic-input rounded-full w-80"
                        placeholder="Teklifleri ara"
                        value={aramaTerimi}
                        onChange={(e) => setAramaTerimi(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-auto h-140">
              <table className="w-full text-sm text-left dark-text-secondary font-medium">
                <thead className="text-xs dark-text-primary uppercase dark-bg-tertiary neumorphic-inset">
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
                    <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('girisTarihi')}>
                      Giriş Tarihi {sortConfig.key === 'girisTarihi' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
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
                <tbody className="dark-card-bg divide-y dark-border">
                  {filtrelenmisTeklifler.map((teklif) => (
                    <tr key={teklif.teklif_id}>
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-500 dark-bg-tertiary dark-border rounded focus:ring-blue-500"
                            checked={secilenTeklifler.includes(teklif.teklif_id)}
                            onChange={(e) => handleCheckboxChange(e, teklif.teklif_id)}
                          />
                          <label htmlFor={`checkbox-table-${teklif.teklif_id}`} className="sr-only">checkbox</label>
                        </div>
                      </td>
                      <td className="px-6 py-2 font-medium dark-text-primary whitespace-nowrap">
                        {capitalizeWords(teklif.adSoyad || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2 dark-text-secondary">
                        {(teklif.markaModel || "Tanımsız").length > 20 ? `${toUpperCase((teklif.markaModel || "Tanımsız").substring(0, 20))}...` : capitalizeWords(teklif.markaModel || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2 text-green-400">
                        {toUpperCase(teklif.plaka || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2 dark-text-secondary">
                        {teklif.km !== undefined && teklif.km !== null ? formatKm(teklif.km) : "Tanımsız"}
                      </td>
                      <td className="px-6 py-2 uppercase dark-text-secondary">
                        {(teklif.sasi || "Tanımsız").length > 7 ? `${toUpperCase((teklif.sasi || "Tanımsız").substring(0, 7))}...` : toUpperCase(teklif.sasi || "Tanımsız")}
                      </td>
                      <td className="px-6 py-2 text-blue-400">
                        {teklif.girisTarihi || "Tanımsız"}
                      </td>
                      <td className="px-8 py-2">
                        <button onClick={() => handleTeklifEkle(teklif)} className="bg-blue-500 p-2 pl-6 pr-6 rounded-full font-medium text-white hover:underline neumorphic-outset">Ekle</button>
                      </td>
                      <td className="px-6 py-2">
                        <a href={DetailPage(teklif.teklif_id)} className="bg-yellow-500 p-2 pl-4 pr-4 rounded-full font-medium dark-text-primary hover:underline neumorphic-outset">Detay</a>
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
    </div>
  );
}

export default withAuth(Teklif);