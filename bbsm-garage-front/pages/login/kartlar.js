import React, { useState, useEffect, useRef } from 'react';
import Head from "next/head";
import Link from "next/link";
import AnaBilesen from '@/components/AnaBilesen';
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
import { useTheme } from '../../contexts/ThemeContext';

const Kartlar = () => {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { success, error: showError, warning } = useToast();
  const { profileData, refreshProfile } = useProfile();
  const { activeTheme } = useTheme();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isYeniKartEkleModalOpen, setIsYeniKartEkleModalOpen] = useState(false);
  const [isPeriyodikBakimMode, setIsPeriyodikBakimMode] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [kartlar, setKartlar] = useState([]);
  const [secilenKartlar, setSecilenKartlar] = useState([]);
  const [aramaTerimi, setAramaTerimi] = useState('');
  const [teklifler, setTeklifler] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isSilmeModalOpen, setIsSilmeModalOpen] = useState(false);
  const [silmeDuzenleyen, setSilmeDuzenleyen] = useState('');
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const actionDropdownRef = useRef(null);
  const defaultColumns = [
    { id: 'adSoyad', label: 'Ad-Soyad', sortKey: 'adSoyad', width: '17%', minWidth: 110 },
    { id: 'markaModel', label: 'Marka-Model', sortKey: 'markaModel', width: '17%', minWidth: 110 },
    { id: 'plaka', label: 'Plaka', sortKey: 'plaka', width: '10%', minWidth: 90 },
    { id: 'km', label: 'Km', sortKey: 'km', width: '9%', minWidth: 90 },
    { id: 'telNo', label: 'Telefon No', sortKey: 'telNo', width: '14%', minWidth: 110 },
    { id: 'girisTarihi', label: 'Giriş Tarihi', sortKey: 'girisTarihi', width: '12%', minWidth: 110 },
    { id: 'periyodikBakim', label: 'Türü', sortKey: 'periyodikBakim', width: '10%', minWidth: 100 },
    { id: 'odeme', label: 'Ödeme', width: '3%', minWidth: 60 },
    { id: 'goruntule', label: 'Detay', width: '2%', minWidth: 45 },
    { id: 'indir', label: 'İndir', width: '5%', minWidth: 80 },
  ];
  const [columns, setColumns] = useState(defaultColumns);
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [resizingInfo, setResizingInfo] = useState(null);
  const [resizeGuideX, setResizeGuideX] = useState(null);
  const tableWrapperRef = useRef(null);

  // Kolon ayarlarını yerelde sakla
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedColumns = window.localStorage.getItem('kartlarTableColumns');
    if (savedColumns) {
      try {
        setColumns(JSON.parse(savedColumns));
      } catch (err) {
        console.error('Kolonları yükleme hatası', err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('kartlarTableColumns', JSON.stringify(columns));
  }, [columns]);

  const handleColumnDragStart = (columnId) => {
    setDraggedColumnId(columnId);
  };

  const handleColumnDrop = (targetColumnId) => {
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;
    setColumns((prev) => {
      const draggedIndex = prev.findIndex((col) => col.id === draggedColumnId);
      const targetIndex = prev.findIndex((col) => col.id === targetColumnId);
      if (draggedIndex === -1 || targetIndex === -1) return prev;
      const updated = [...prev];
      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, removed);
      return updated;
    });
    setDraggedColumnId(null);
  };

  const handleResizeMouseDown = (e, columnId) => {
    e.stopPropagation();
    e.preventDefault();
    const col = columns.find((c) => c.id === columnId);
    if (!col) return;
    setResizingInfo({
      columnId,
      startX: e.clientX,
      startWidth: col.width || 120,
    });
  };

  useEffect(() => {
    if (!resizingInfo) return;
    const handleMouseMove = (e) => {
      const deltaX = e.clientX - resizingInfo.startX;
      const nextWidth = Math.min(
        420,
        Math.max(90, (resizingInfo.startWidth || 120) + deltaX)
      );
      setColumns((prev) =>
        prev.map((col) =>
          col.id === resizingInfo.columnId ? { ...col, width: nextWidth } : col
        )
      );
      if (tableWrapperRef.current) {
        const rect = tableWrapperRef.current.getBoundingClientRect();
        setResizeGuideX(Math.max(0, Math.min(rect.width, e.clientX - rect.left)));
      }
    };
    const handleMouseUp = () => {
      setResizingInfo(null);
      setResizeGuideX(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingInfo]);


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

  const formatWhatsAppLink = (telNo) => {
    if (!telNo || telNo === "Tanımsız") return null;
    // Sadece rakamları al (boşluk, tire, parantez gibi karakterleri temizle)
    const cleanedNumber = telNo.replace(/\D/g, '');
    // Türkiye için +90 ekle (eğer yoksa)
    const formattedNumber = cleanedNumber.startsWith('90') ? cleanedNumber : 
                           cleanedNumber.startsWith('0') ? '90' + cleanedNumber.substring(1) :
                           '90' + cleanedNumber;
    return `https://wa.me/${formattedNumber}`;
  };

  const handleCheckboxChange = (e, kartId) => {
    if (e.target.checked) {
      setSecilenKartlar([...secilenKartlar, kartId]);
    } else {
      setSecilenKartlar(secilenKartlar.filter(card_id => card_id !== kartId));
    }
  };

  const silSecilenleri = () => {
    if (secilenKartlar.length === 0) {
      warning("Silmek için en az bir kart seçmelisiniz.");
      return;
    }
    // Silme modalını aç
    setSilmeDuzenleyen('');
    setIsSilmeModalOpen(true);
  };

  const getTdClass = (columnId) => {
    switch (columnId) {
      case 'adSoyad':
        return 'px-6 py-4 font-medium dark-text-primary whitespace-nowrap';
      case 'markaModel':
      case 'km':
        return 'px-6 py-4 dark-text-secondary';
      case 'plaka':
        return 'px-6 py-4 text-green-400';
      case 'telNo':
        return 'px-6 py-4';
      case 'girisTarihi':
        return 'px-6 py-4 text-blue-400 whitespace-nowrap text-xs';
      case 'periyodikBakim':
        return 'px-6 py-4';
      case 'odeme':
      case 'goruntule':
      case 'indir':
        return 'px-2 py-3 text-center';
      default:
        return 'px-6 py-4';
    }
  };

  const renderCellContent = (column, kart) => {
    switch (column.id) {
      case 'adSoyad':
        return capitalizeWords(kart.adSoyad || "Tanımsız");
      case 'markaModel':
        return capitalizeWords(kart.markaModel || "Tanımsız");
      case 'plaka':
        return toUpperCase(kart.plaka || "Tanımsız");
      case 'km':
        return kart.km !== undefined && kart.km !== null ? formatKm(kart.km) : "Tanımsız";
      case 'telNo':
        return kart.telNo && kart.telNo !== "Tanımsız" ? (
          <a 
            href={formatWhatsAppLink(kart.telNo)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
            title="WhatsApp ile aç"
          >
            {kart.telNo}
          </a>
        ) : (
          <span className="dark-text-secondary">Tanımsız</span>
        );
      case 'girisTarihi':
        return kart.girisTarihi || "Tanımsız";
      case 'periyodikBakim':
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex flex-col items-center justify-center leading-tight ${
            kart.periyodikBakim === true || kart.periyodikBakim === 1 || kart.periyodikBakim === 'true' || kart.periyodikBakim === '1'
              ? 'bg-red-500/20 text-red-300' 
              : 'dark-bg-tertiary dark-text-secondary'
          }`}>
            {kart.periyodikBakim === true || kart.periyodikBakim === 1 || kart.periyodikBakim === 'true' || kart.periyodikBakim === '1' ? (
              <>
                <span>Periyodik</span>
                <span>Bakım</span>
              </>
            ) : 'Normal'}
          </span>
        );
      case 'odeme':
        return (
          <button
            onClick={() => toggleOdemeDurumu(kart.card_id)}
            className={`p-2 pl-4 pr-4 rounded-full font-medium transition-all neumorphic-inset ${
              kart.odemeAlindi 
                ? `bg-green-500 hover:bg-green-600 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}` 
                : 'dark-bg-tertiary dark-text-secondary hover:dark-bg-secondary'
            }`}
            title={kart.odemeAlindi ? 'Ödeme Alındı' : 'Ödeme Alınmadı'}
          >
            {kart.odemeAlindi ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        );
      case 'goruntule':
        return (
          <Link href={DetailPage(kart.card_id)} className="bg-yellow-500 p-1.5 rounded-md hover:bg-yellow-600 active:scale-95 transition-transform inline-flex items-center justify-center" title="Detay">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Link>
        );
      case 'indir':
        return (
          <div className="flex gap-1 justify-center items-center">
            <button
              onClick={() => handlePDFDownload(kart.card_id)}
              className="bg-green-600 p-1.5 rounded-md hover:bg-green-700 active:scale-95 transition-transform text-white inline-flex items-center justify-center"
              title="PDF indir"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={() => handlePrint(kart.card_id)}
              className="p-1.5 rounded-md active:scale-95 transition-transform text-white bg-blue-500 hover:bg-blue-600 inline-flex items-center justify-center"
              title="Yazdır"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleConfirmDelete = async () => {
    // Düzenleyen alanı zorunlu kontrolü
    if (!silmeDuzenleyen || silmeDuzenleyen.trim() === '') {
      warning('Lütfen Düzenleyen alanını doldurun.');
      return;
    }

    setIsSilmeModalOpen(false);
    setLoading(true);
    
    try {
      const deleteRequests = secilenKartlar.map(kartId =>
        fetchWithAuth(`${API_URL}/card/${kartId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duzenleyen: silmeDuzenleyen.trim() })
        })
      );
      await Promise.all(deleteRequests);

      const guncellenmisKartlar = kartlar.filter(kart => !secilenKartlar.includes(kart.card_id));
      setKartlar(guncellenmisKartlar);
      setSecilenKartlar([]);
      setSilmeDuzenleyen('');
      success(`${secilenKartlar.length} kart başarıyla silindi.`);
    } catch (error) {
      console.error('Silme işlemi sırasında hata oluştu', error);
      showError('Silme işlemi sırasında bir hata oluştu.');
    }
    setLoading(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Pull to refresh için
  const handlePullToRefresh = () => {
    fetchKartListesi();
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

  const closeModal = () => {
    setIsYeniKartEkleModalOpen(false);
    setIsPeriyodikBakimMode(false);
  };

  const toggleYeniKartEkleModal = () => {
    setIsPeriyodikBakimMode(false);
    setIsYeniKartEkleModalOpen(!isYeniKartEkleModalOpen);
  };

  const togglePeriyodikBakimModal = () => {
    setIsPeriyodikBakimMode(true);
    setIsYeniKartEkleModalOpen(true);
  };

  const fetchTeklifListesi = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/teklif`, { method: 'GET' });
      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
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
      const response = await fetchWithAuth(`${API_URL}/card`, { method: 'GET' });
      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
      }
      const data = await response.json();
      console.log('fetchKartListesi - Gelen kartlar:', data);
      console.log('fetchKartListesi - İlk kartın periyodikBakim değeri:', data[0]?.periyodikBakim, typeof data[0]?.periyodikBakim);
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

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target)) {
        setIsActionDropdownOpen(false);
      }
    };

    if (isActionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isActionDropdownOpen]);

  const handleKartEkle = async (yeniKart) => {
    setLoading(true);
    // Eğer girisTarihi yoksa bugünün tarihini ekle
    const getTodayDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const kartData = {
      ...yeniKart,
      girisTarihi: yeniKart.girisTarihi || getTodayDate(),
      periyodikBakim: yeniKart.periyodikBakim === true || yeniKart.periyodikBakim === 1 || yeniKart.periyodikBakim === 'true', // Periyodik bakım değerini kesinlikle ekle
    };

    console.log('handleKartEkle - yeniKart:', yeniKart);
    console.log('handleKartEkle - kartData:', kartData);

    try {
      const response = await fetchWithAuth(`${API_URL}/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kartData),
      });

      if (response && response.ok) {
        // Kart başarıyla eklendi, listeyi yeniden yükle
        await fetchKartListesi();
        closeModal();
        success('Yeni kayıt başarıyla eklendi!');
      } else {
        const errorData = await response?.json().catch(() => ({}));
        console.error('Kart eklenirken bir hata oluştu:', errorData);
        showError('Kart eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Kart eklenirken bir hata oluştu:', error);
      showError('Kart eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
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
      const response = await fetchWithAuth(`${API_URL}/teklif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teklif),
      });

      if (response && response.ok) {
        // Teklif başarıyla eklendi, listeyi yeniden yükle
        await fetchTeklifListesi();
        // Modalı kapat
        toggleYeniKartEkleModal();
        success('Yeni teklif başarıyla eklendi!');
      } else {
        const errorData = await response?.json().catch(() => ({}));
        console.error('Teklif eklenirken bir hata oluştu:', errorData);
        showError('Teklif eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('İşlem sırasında bir hata oluştu:', error);
      showError('Teklif eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
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
    kart.telNo?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
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
      } else if (sortConfig.key === 'periyodikBakim') {
        const aValue = a.periyodikBakim === true || a.periyodikBakim === 1 || a.periyodikBakim === 'true' || a.periyodikBakim === '1';
        const bValue = b.periyodikBakim === true || b.periyodikBakim === 1 || b.periyodikBakim === 'true' || b.periyodikBakim === '1';
        
        if (aValue === bValue) return 0;
        if (aValue && !bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (!aValue && bValue) {
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

const handlePrint = async (kartId) => {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  } catch (error) {
    console.error('PDF yazdırma hatası:', error);
    showError('PDF yazdırma sırasında bir hata oluştu.');
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

  const toggleOdemeDurumu = async (kartId) => {
    const kart = kartlar.find(k => k.card_id === kartId);
    if (!kart) return;

    const yeniOdemeDurumu = !kart.odemeAlindi;
    
    try {
      const response = await fetchWithAuth(`${API_URL}/card/${kartId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ odemeAlindi: yeniOdemeDurumu }),
      });

      if (response && response.ok) {
        // Kart listesini güncelle
        setKartlar(kartlar.map(k => 
          k.card_id === kartId ? { ...k, odemeAlindi: yeniOdemeDurumu } : k
        ));
        success('Ödeme durumu başarıyla güncellendi.');
      } else {
        console.error('Ödeme durumu güncellenemedi');
        showError('Ödeme durumu güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Ödeme durumu güncelleme hatası:', error);
      showError('Ödeme durumu güncellenirken bir hata oluştu.');
    }
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
    <div 
      className="min-h-screen dark-bg-primary"
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Kartlar</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="kartlar"
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
          <div className="p-3 md:p-4 lg:p-6 pt-4 md:pt-6 lg:pt-8 lg:ml-64 dark-bg-primary">
            <div className="p-3 md:p-4 lg:p-6 mt-16 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl">
              <div className="flex items-center pb-4 justify-between">
              <div className="flex items-center">
                <div className="pr-4 items-center ">
                  <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between ">
                    <p className="font-semibold text-base md:text-lg dark-text-primary">Kartlarım</p>
                  </div>
                </div>
              </div>

              {/* Desktop action buttons and search bar - only show on md and up */}
              <div className="flex items-center">
                <div className="hidden md:flex items-center">
                  <div className="relative" ref={actionDropdownRef}>
                    <div className="items-center p-2 pl-4 pr-4 rounded-full ml-2 md:ml-4 bg-blue-500">
                      <button 
                        onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)} 
                        className="font-semibold text-md whitespace-nowrap text-white flex items-center gap-2"
                      >
                        Action
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {isActionDropdownOpen && (
                      <div className="absolute top-full left-4 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
                        <button
                          onClick={() => {
                            silSecilenleri();
                            setIsActionDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Seçilenleri Sil
                        </button>
                        <button
                          onClick={() => {
                            secilenKartlariIndir('excel');
                            setIsActionDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Seçilenleri Excel İndir
                        </button>
                        <button
                          onClick={() => {
                            secilenKartlariIndir('pdf');
                            setIsActionDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Seçilenleri PDF İndir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="items-center p-2 pl-4 pr-4 rounded-full ml-2 md:ml-4 bg-blue-500">
                  <button onClick={toggleYeniKartEkleModal} className="font-semibold text-md whitespace-nowrap text-white">Yeni Kart Ekle</button>
                </div>
                <div className="items-center p-2 pl-4 pr-4 rounded-full ml-2 md:ml-4 bg-blue-500">
                  <button onClick={togglePeriyodikBakimModal} className="font-semibold text-md whitespace-nowrap text-white">Periyodik Bakım</button>
                </div>
                <div className="hidden md:block pr-4 items-center pl-4">
                  <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between">
                    <label htmlFor="table-search" className="sr-only">Search</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
                        <svg className="w-5 h-5 dark-text-muted" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      <input type="text" id="table-search"
                        className="block p-2 ps-10 text-sm md:text-md dark-text-primary neumorphic-input rounded-full w-64 md:w-80"
                        placeholder="Kartları ara"
                        value={aramaTerimi}
                        onChange={(e) => setAramaTerimi(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto md:overflow-x-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block relative" ref={tableWrapperRef}>
                {resizeGuideX !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-slate-400 pointer-events-none"
                    style={{ left: resizeGuideX }}
                  />
                )}
                <table className="w-full text-xs text-left dark-text-secondary font-medium rounded-xl overflow-hidden">
                  <thead className="text-xs dark-text-primary uppercase dark-bg-tertiary neumorphic-inset">
                    <tr>
                      <th scope="col" className="p-3 w-10"></th>
                      {columns.map((column) => (
                        <th
                          key={column.id}
                          scope="col"
                          draggable
                          onDragStart={() => handleColumnDragStart(column.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleColumnDrop(column.id)}
                          onClick={() => column.sortKey && handleSort(column.sortKey)}
                          className={`px-6 py-3 select-none ${
                            column.sortKey ? 'cursor-pointer' : 'cursor-move'
                          } relative`}
                          style={{ width: column.width || 'auto', minWidth: column.minWidth || 90 }}
                        >
                          <div className="flex items-center gap-2">
                            <span>{column.label}</span>
                            {column.sortKey && sortConfig.key === column.sortKey && (
                              <span>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </div>
                          <span
                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                            onMouseDown={(e) => handleResizeMouseDown(e, column.id)}
                          />
                      </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="dark-card-bg divide-y dark-border">
                    {sortedKartlar.filter(kart =>
                      kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.telNo?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.km?.toString().includes(aramaTerimi) ||
                      kart.girisTarihi?.toString().includes(aramaTerimi)
                    ).map((kart) => (
                      <tr key={kart.card_id}>
                        <td className="w-10 p-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-500 dark-bg-tertiary dark-border rounded focus:ring-blue-500"
                              checked={secilenKartlar.includes(kart.card_id)}
                              onChange={(e) => handleCheckboxChange(e, kart.card_id)}
                            />
                            <label htmlFor={`checkbox-table-${kart.card_id}`} className="sr-only">checkbox</label>
                          </div>
                        </td>
                        {columns.map((column) => (
                          <td
                            key={`${kart.card_id}-${column.id}`}
                            className={getTdClass(column.id)}
                            style={{ width: column.width || 'auto', minWidth: column.minWidth || 90 }}
                            >
                            {renderCellContent(column, kart)}
                        </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE LAYOUT */}
              <div 
                className="md:hidden"
                {...pullToRefresh}
              >
                {/* Search bar at the top */}
                <div className="w-full mb-3">
                  <input
                    type="text"
                    id="table-search-mobile"
                    className="block w-full p-3 text-sm md:text-md dark-text-primary neumorphic-input rounded-full touch-manipulation min-h-[44px]"
                    placeholder="Kartları ara"
                    value={aramaTerimi}
                    onChange={(e) => setAramaTerimi(e.target.value)}
                  />
                </div>
                {/* Action buttons stacked - Mobil için daha büyük touch target */}
                <div className="flex flex-col gap-3 w-full mb-4">
                  <div className="relative" ref={actionDropdownRef}>
                    <button 
                      onClick={() => setIsActionDropdownOpen(!isActionDropdownOpen)} 
                      className="w-full font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px] text-white bg-blue-500 flex items-center justify-center gap-2"
                    >
                      Action
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isActionDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 w-full bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
                        <button
                          onClick={() => {
                            silSecilenleri();
                            setIsActionDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors flex items-center gap-2 touch-manipulation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Seçilenleri Sil
                        </button>
                        <button
                          onClick={() => {
                            secilenKartlariIndir('excel');
                            setIsActionDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors flex items-center gap-2 touch-manipulation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Seçilenleri Excel İndir
                        </button>
                        <button
                          onClick={() => {
                            secilenKartlariIndir('pdf');
                            setIsActionDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-white hover:bg-gray-700 transition-colors flex items-center gap-2 touch-manipulation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Seçilenleri PDF İndir
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={toggleYeniKartEkleModal} 
                    className="w-full font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px] text-white bg-blue-500"
                  >
                    Yeni Kart Ekle
                  </button>
                  <button 
                    onClick={togglePeriyodikBakimModal} 
                    className="w-full font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px] text-white bg-blue-500"
                  >
                    Periyodik Bakım Ekle
                  </button>
                </div>
                {/* Card list, full width, white bg, compact - Mobil için optimize edilmiş */}
                <div className="w-full dark-card-bg neumorphic-card rounded-xl overflow-hidden">
                  {sortedKartlar.filter(kart =>
                    kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.telNo?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.km?.toString().includes(aramaTerimi) ||
                    kart.girisTarihi?.toString().includes(aramaTerimi)
                  ).map((kart) => (
                    <div key={kart.card_id} className="w-full border-b last:border-b-0 dark-border px-3 py-3 flex items-center active:dark-bg-tertiary transition-colors">
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-500 dark-bg-tertiary dark-border rounded focus:ring-blue-500 mr-3 touch-manipulation"
                        checked={secilenKartlar.includes(kart.card_id)}
                        onChange={(e) => handleCheckboxChange(e, kart.card_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold dark-text-primary text-base truncate mb-1">{capitalizeWords(kart.adSoyad || "Tanımsız")}</div>
                        <div className="text-sm dark-text-secondary truncate mb-1">{capitalizeWords(kart.markaModel || "Tanımsız")}</div>
                        <div className="text-sm text-green-400 font-semibold mb-1">{toUpperCase(kart.plaka || "Tanımsız")}</div>
                        <div className="text-xs dark-text-secondary mb-1">
                          {kart.telNo && kart.telNo !== "Tanımsız" ? (
                            <a 
                              href={formatWhatsAppLink(kart.telNo)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                              title="WhatsApp ile aç"
                            >
                              {kart.telNo}
                            </a>
                          ) : (
                            <span className="dark-text-secondary">Tanımsız</span>
                          )}
                        </div>
                        <div className="text-xs dark-text-secondary mb-1">{kart.km !== undefined && kart.km !== null ? formatKm(kart.km) : "Tanımsız"} km</div>
                        <div className="text-xs text-blue-400 mb-1">{kart.girisTarihi || "Tanımsız"}</div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex flex-col items-center justify-center leading-tight ${
                            kart.periyodikBakim === true || kart.periyodikBakim === 1 || kart.periyodikBakim === 'true' || kart.periyodikBakim === '1'
                              ? 'bg-red-500/20 text-red-300' 
                              : 'dark-bg-tertiary dark-text-secondary'
                          }`}>
                            {kart.periyodikBakim === true || kart.periyodikBakim === 1 || kart.periyodikBakim === 'true' || kart.periyodikBakim === '1' ? (
                              <>
                                <span>Periyodik</span>
                                <span>Bakım</span>
                              </>
                            ) : 'Normal'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center ml-3 gap-3">
                        <button
                          onClick={() => toggleOdemeDurumu(kart.card_id)}
                          className={`p-2 rounded-full transition-all touch-manipulation active:scale-90 neumorphic-inset ${
                            kart.odemeAlindi 
                              ? `bg-green-500 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}` 
                              : 'dark-bg-tertiary dark-text-secondary'
                          }`}
                          title={kart.odemeAlindi ? 'Ödeme Alındı' : 'Ödeme Alınmadı'}
                        >
                          {kart.odemeAlindi ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <Link 
                          href={DetailPage(kart.card_id)} 
                          className="text-yellow-500 hover:text-yellow-600 active:scale-90 transition-transform p-1.5 touch-manipulation inline-flex items-center justify-center"
                          title="Detay"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </Link>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleExcelDownload(kart.card_id)} 
                            className="text-green-500 hover:text-green-600 active:scale-90 transition-transform p-2 touch-manipulation"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handlePDFDownload(kart.card_id)} 
                            className="text-orange-600 hover:text-orange-600 active:scale-90 transition-transform p-2 touch-manipulation"
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
            </div>
          </div>
          </div>
        </ProtectedPage>
      </div>

      {/* Silme Onay Modali */}
      {isSilmeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setIsSilmeModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl dark-card-bg neumorphic-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold dark-text-primary mb-4">
              Seçilen kartları sil
            </h3>
            <p className="dark-text-secondary text-sm mb-4">
              Silme işlemine devam etmek için düzenleyen bilgisini girin.
            </p>
            <label className="block text-sm font-medium dark-text-secondary mb-2">
              Düzenleyen
            </label>
            <input
              type="text"
              className="w-full neumorphic-input rounded-xl p-3 dark-text-primary"
              placeholder="Ad Soyad"
              value={silmeDuzenleyen}
              onChange={(e) => setSilmeDuzenleyen(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsSilmeModalOpen(false)}
                className="px-4 py-2 rounded-full dark-bg-tertiary dark-text-secondary active:scale-95 transition-transform"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-full font-semibold active:scale-95 transition-transform text-white bg-blue-500"
              >
                Onayla ve Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - moved outside the main content div */}
      {isYeniKartEkleModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 modal-overlay" onClick={closeModal}>
          <div className="relative modal-content" onClick={(e) => e.stopPropagation()}>
            <AnaBilesen 
              onClose={closeModal} 
              onKartEkle={handleKartEkle} 
              onTeklifEkle={handleTeklifEkle}
              isPeriyodikBakimMode={isPeriyodikBakimMode}
              fetchWithAuth={fetchWithAuth}
              API_URL={API_URL}
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
};

export default withAuth(Kartlar);
