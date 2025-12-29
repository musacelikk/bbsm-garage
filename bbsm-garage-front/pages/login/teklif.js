import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useRouter } from 'next/router';
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe, useVerticalSwipe } from '../../hooks/useTouchGestures';
import { useToast } from '../../contexts/ToastContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useTheme } from '../../contexts/ThemeContext';

function Teklif() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { success, error: showError, warning } = useToast();
  const { profileData, refreshProfile } = useProfile();
  const { activeTheme } = useTheme();
  const router = useRouter();
  const username = getUsername() || 'Kullanıcı';
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [teklifler, setTeklifler] = useState([]);
  const [secilenTeklifler, setSecilenTeklifler] = useState([]);
  const [aramaTerimi, setAramaTerimi] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'teklif_id', direction: 'desc' });
  const [isActionDropdownOpen, setIsActionDropdownOpen] = useState(false);
  const [stoklar, setStoklar] = useState([]);
  const actionDropdownRef = useRef(null);

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

  // Stok listesini yükle
  const fetchStokListesi = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/stok`, { method: 'GET' });
      if (response && response.ok) {
        const data = await response.json();
        setStoklar(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Stoklar yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchTeklifListesi();
    fetchStokListesi();
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

    // Stok listesini güncelle (aktarım öncesi güncel stok bilgisi için)
    await fetchStokListesi();

    setLoading(true);
    try {
      const secilenTeklifObjesi = teklifler.filter(teklif => 
        secilenTeklifler.includes(teklif.teklif_id)
      );

      // Tüm teklifler için stok kontrolü yap
      const stokHatalari = [];
      for (const teklif of secilenTeklifObjesi) {
        const teklifYapilanlar = teklif.yapilanlar || [];
        teklifYapilanlar.forEach((yapilan, index) => {
          const isFromStock = yapilan.isFromStock === true || yapilan.isFromStock === 'true' || yapilan.isFromStock === 1 || yapilan.isFromStock === '1';
          const stockId = yapilan.stockId ? Number(yapilan.stockId) : null;
          
          if (isFromStock && stockId) {
            const stok = stoklar.find(s => s.id === stockId);
            const birimAdedi = Number(yapilan.birimAdedi) || 0;
            
            if (stok && stok.adet < birimAdedi) {
              stokHatalari.push({
                teklifId: teklif.teklif_id,
                teklifAdSoyad: teklif.adSoyad || 'Bilinmeyen',
                satir: index + 1,
                parcaAdi: yapilan.parcaAdi || 'Bilinmeyen',
                stokAdet: stok.adet,
                istenenAdet: birimAdedi
              });
            }
          }
        });
      }

      // Stok hataları varsa uyarı göster ve aktarımı engelle
      if (stokHatalari.length > 0) {
        const hataMesaji = stokHatalari.map(h => 
          `Teklif #${h.teklifId} (${h.teklifAdSoyad}) - Satır ${h.satir} - ${h.parcaAdi}: Stokta ${h.stokAdet} adet var, ${h.istenenAdet} adet istendi.`
        ).join('\n');
        warning(`Stok yetersiz! Aktarım yapılamadı.\n\n${hataMesaji}`);
        setLoading(false);
        return;
      }

      let basariliSayisi = 0;
      let hataSayisi = 0;

      for (const teklif of secilenTeklifObjesi) {
        try {
          // yapilanlar array'ini DTO formatına dönüştür (stok bilgilerini koru)
          const yapilanlarDTO = (teklif.yapilanlar || []).map(y => {
            // isFromStock değerini boolean'a çevir (string 'true' veya boolean true olabilir)
            const isFromStock = y.isFromStock === true || y.isFromStock === 'true' || y.isFromStock === 1 || y.isFromStock === '1';
            const stockId = y.stockId ? Number(y.stockId) : null;
            
            return {
              birimAdedi: Number(y.birimAdedi) || 0,
            parcaAdi: y.parcaAdi || "",
              birimFiyati: Number(y.birimFiyati) || 0,
              toplamFiyat: Number(y.toplamFiyat) || 0,
              stockId: stockId, // Stok ID'sini koru (number olarak)
              isFromStock: isFromStock, // Stok flag'ini koru (boolean olarak)
            };
          });
          
          // Debug: Stok bilgilerini kontrol et
          console.log('Teklif yapilanlar:', teklif.yapilanlar);
          console.log('Yapilanlar DTO (stok bilgileri ile):', yapilanlarDTO);

          // Sadece DTO'da olan alanları gönder (teklif_id, tenant_id gibi alanları çıkar)
          const updatedTeklif = {
            adSoyad: teklif.adSoyad || "Tanımsız",
            telNo: teklif.telNo || "",
            markaModel: teklif.markaModel || "Tanımsız",
            plaka: teklif.plaka || "Tanımsız",
            km: teklif.km ? parseInt(teklif.km, 10) : 0,
            modelYili: teklif.modelYili ? parseInt(teklif.modelYili, 10) : 0,
            sasi: teklif.sasi || "Tanımsız",
            renk: teklif.renk || "",
            girisTarihi: teklif.girisTarihi || "Tanımsız",
            notlar: teklif.notlar || "",
            adres: teklif.adres || "",
            duzenleyen: teklif.duzenleyen || username,
            yapilanlar: yapilanlarDTO,
          };

          // Önce kartı oluştur
          const postResponse = await fetchWithAuth(`${API_URL}/card`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTeklif),
          });

          if (postResponse && postResponse.ok) {
            // Kart başarıyla oluşturuldu, teklifi sil
            const deleteResponse = await fetchWithAuth(`${API_URL}/teklif/${teklif.teklif_id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (deleteResponse && deleteResponse.ok) {
              // Log kaydı oluştur
              try {
                await fetchWithAuth(`${API_URL}/log/create`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'teklif_to_card', duzenleyen: updatedTeklif.duzenleyen || username })
                });
              } catch (logError) {
                console.error('Log kaydetme hatası:', logError);
                // Log hatası işlemi engellemez
              }
              basariliSayisi++;
            } else {
              console.error('Teklif silinirken hata:', deleteResponse);
              hataSayisi++;
            }
          } else {
            const errorData = await postResponse?.json().catch(() => ({}));
            console.error('Kart oluşturulurken hata:', errorData);
            console.error('Gönderilen veri:', JSON.stringify(updatedTeklif, null, 2));
            if (errorData.message && Array.isArray(errorData.message)) {
              console.error('Validation hataları:', errorData.message);
            }
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
    // Stok listesini güncelle (aktarım öncesi güncel stok bilgisi için)
    await fetchStokListesi();

    // Stok kontrolü - Aktarım öncesi tüm stoktan seçilen ürünleri kontrol et
    const stokHatalari = [];
    const teklifYapilanlar = teklif.yapilanlar || [];
    teklifYapilanlar.forEach((yapilan, index) => {
      const isFromStock = yapilan.isFromStock === true || yapilan.isFromStock === 'true' || yapilan.isFromStock === 1 || yapilan.isFromStock === '1';
      const stockId = yapilan.stockId ? Number(yapilan.stockId) : null;
      
      if (isFromStock && stockId) {
        const stok = stoklar.find(s => s.id === stockId);
        const birimAdedi = Number(yapilan.birimAdedi) || 0;
        
        if (stok && stok.adet < birimAdedi) {
          stokHatalari.push({
            satir: index + 1,
            parcaAdi: yapilan.parcaAdi || 'Bilinmeyen',
            stokAdet: stok.adet,
            istenenAdet: birimAdedi
          });
        }
      }
    });

    // Stok hataları varsa uyarı göster ve aktarımı engelle
    if (stokHatalari.length > 0) {
      const hataMesaji = stokHatalari.map(h => 
        `Satır ${h.satir} - ${h.parcaAdi}: Stokta ${h.stokAdet} adet var, ${h.istenenAdet} adet istendi.`
      ).join('\n');
      warning(`Stok yetersiz! Aktarım yapılamadı.\n\n${hataMesaji}`);
      return;
    }

    setLoading(true);
    // yapilanlar array'ini DTO formatına dönüştür (stok bilgilerini koru)
    const yapilanlarDTO = teklifYapilanlar.map(y => {
      // isFromStock değerini boolean'a çevir (string 'true' veya boolean true olabilir)
      const isFromStock = y.isFromStock === true || y.isFromStock === 'true' || y.isFromStock === 1 || y.isFromStock === '1';
      const stockId = y.stockId ? Number(y.stockId) : null;
      
      return {
        birimAdedi: Number(y.birimAdedi) || 0,
      parcaAdi: y.parcaAdi || "",
        birimFiyati: Number(y.birimFiyati) || 0,
        toplamFiyat: Number(y.toplamFiyat) || 0,
        stockId: stockId, // Stok ID'sini koru (number olarak)
        isFromStock: isFromStock, // Stok flag'ini koru (boolean olarak)
      };
    });
    
    // Debug: Stok bilgilerini kontrol et
    console.log('Teklif ekle - yapilanlar:', teklif.yapilanlar);
    console.log('Teklif ekle - yapilanlarDTO:', yapilanlarDTO);

    // Sadece DTO'da olan alanları gönder (teklif_id, tenant_id gibi alanları çıkar)
    const updatedTeklif = {
      adSoyad: teklif.adSoyad || "Tanımsız",
      telNo: teklif.telNo || "",
      markaModel: teklif.markaModel || "Tanımsız",
      plaka: teklif.plaka || "Tanımsız",
      km: teklif.km ? parseInt(teklif.km, 10) : 0,
      modelYili: teklif.modelYili ? parseInt(teklif.modelYili, 10) : 0,
      sasi: teklif.sasi || "Tanımsız",
      renk: teklif.renk || "",
      girisTarihi: teklif.girisTarihi || "Tanımsız",
      notlar: teklif.notlar || "",
      adres: teklif.adres || "",
      duzenleyen: teklif.duzenleyen || username,
      yapilanlar: yapilanlarDTO,
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

      if (postResponse && postResponse.ok) {
        // Kart başarıyla oluşturuldu, teklifi sil
        const deleteResponse = await fetchWithAuth(`${API_URL}/teklif/${teklif.teklif_id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (deleteResponse && deleteResponse.ok) {
          // Log kaydı oluştur
          try {
            await fetchWithAuth(`${API_URL}/log/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'teklif_to_card', duzenleyen: updatedTeklif.duzenleyen || username })
            });
          } catch (logError) {
            console.error('Log kaydetme hatası:', logError);
            // Log hatası işlemi engellemez
          }
          
          setTeklifler(teklifler.filter(t => t.teklif_id !== teklif.teklif_id));
          success('Teklif başarıyla kartlara aktarıldı!');
          // Kartlar sayfasına yönlendir
          setTimeout(() => {
            router.push('/login/kartlar');
          }, 1500);
        } else {
          const errorData = await deleteResponse?.json().catch(() => ({}));
          console.error('Teklif silinirken hata:', errorData);
          showError('Teklif silinirken bir hata oluştu.');
        }
      } else {
        const errorData = await postResponse?.json().catch(() => ({}));
        console.error('Kart eklenirken hata:', errorData);
        console.error('Gönderilen veri:', JSON.stringify(updatedTeklif, null, 2));
        if (errorData.message && Array.isArray(errorData.message)) {
          console.error('Validation hataları:', errorData.message);
          showError(`Kart eklenirken hata: ${errorData.message.join(', ')}`);
        } else {
          showError(errorData.message || 'Kart eklenirken bir hata oluştu.');
        }
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
  
    // Varsayılan olarak ID'ye göre sırala (en son eklenen en üstte)
    const currentSortKey = sortConfig.key || 'teklif_id';
    const currentDirection = sortConfig.key ? sortConfig.direction : 'desc';
  
      sortableItems.sort((a, b) => {
      if (currentSortKey === 'teklif_id') {
        // ID'ye göre sırala (en yüksek ID = en son eklenen)
        const idA = a.teklif_id || 0;
        const idB = b.teklif_id || 0;
        if (idA < idB) {
          return currentDirection === 'asc' ? -1 : 1;
        }
        if (idA > idB) {
          return currentDirection === 'asc' ? 1 : -1;
        }
        return 0;
      } else if (currentSortKey === 'girisTarihi') {
          const dateA = parseDate(a.girisTarihi);
          const dateB = parseDate(b.girisTarihi);
    
          if (dateA === null && dateB !== null) return 1;
          if (dateA !== null && dateB === null) return -1;
          if (dateA === null && dateB === null) return 0;
    
          if (dateA < dateB) {
          return currentDirection === 'asc' ? -1 : 1;
          }
          if (dateA > dateB) {
          return currentDirection === 'asc' ? 1 : -1;
          }
          return 0;
        } else {
        if (a[currentSortKey] < b[currentSortKey]) {
          return currentDirection === 'asc' ? -1 : 1;
          }
        if (a[currentSortKey] > b[currentSortKey]) {
          return currentDirection === 'asc' ? 1 : -1;
          }
          return 0;
        }
      });
  
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

const handlePrint = async (teklifId) => {
  setLoading(true);

  const teklif = teklifler.find(t => t.teklif_id === teklifId);
  if (!teklif) {
    console.error("Seçilen teklif bulunamadı");
    setLoading(false);
    return;
  }

  const dataToSend = {
    vehicleInfo: {
      firmaAdi: profileData?.firmaAdi || '',
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
      birimAdedi: parseInt(item.birimAdedi, 10) || 0,
      parcaAdi: item.parcaAdi,
      birimFiyati: parseFloat(item.birimFiyati) || 0,
      toplamFiyat: (parseFloat(item.birimFiyati) || 0) * (parseInt(item.birimAdedi, 10) || 0),
    })),
    notes: teklif.notlar
  };

  try {
    const response = await fetchWithAuth(`${API_URL}/excel/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend)
    });

    if (!response || !response.ok) {
      const errorText = await response.text().catch(() => 'Bilinmeyen hata');
      throw new Error(`PDF yazdırma hatası: ${response?.status || 'Bilinmeyen'} - ${errorText}`);
    }

    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('PDF dosyası boş geldi');
    }

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
    showError(error.message || 'PDF yazdırma sırasında bir hata oluştu.');
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
          firmaAdi: profileData?.firmaAdi || '',
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

      if (!response || !response.ok) {
          const errorText = await response.text().catch(() => 'Bilinmeyen hata');
          throw new Error(`PDF indirme hatası: ${response?.status || 'Bilinmeyen'} - ${errorText}`);
      }

      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
          throw new Error('PDF dosyası boş geldi');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'output.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success('PDF başarıyla indirildi');
  } catch (error) {
      console.error('PDF download error:', error);
      showError(error.message || 'PDF indirme sırasında bir hata oluştu. Lütfen Java servisinin çalıştığından emin olun.');
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
        setIsProfileModalOpen={() => {}}
        setIsChangePasswordModalOpen={() => {}}
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
              className="w-full font-semibold py-3.5 rounded-full active:scale-95 transition-transform touch-manipulation min-h-[44px] text-white bg-blue-500"
            >
              Kartlara Aktar
            </button>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsActionDropdownOpen(false);
                      setTimeout(() => {
                        silSecilenleri();
                      }, 100);
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
                      secilenTeklifleriIndir('excel');
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
                      secilenTeklifleriIndir('pdf');
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
                    className="bg-blue-500 p-1.5 rounded-md hover:bg-blue-600 active:scale-90 transition-transform text-white inline-flex items-center justify-center touch-manipulation"
                    title="Kartlara Ekle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <Link 
                    href={DetailPage(teklif.teklif_id)} 
                    className="text-yellow-500 hover:text-yellow-600 active:scale-90 transition-transform p-1.5 touch-manipulation inline-flex items-center justify-center"
                    title="Detay"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </Link>
                  <div className="flex gap-1 justify-center items-center">
                    <button
                      onClick={() => handlePDFDownload(teklif.teklif_id)}
                      className="bg-green-600 p-1.5 rounded-md hover:bg-green-700 active:scale-95 transition-transform text-white inline-flex items-center justify-center"
                      title="PDF indir"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePrint(teklif.teklif_id)}
                      className="p-1.5 rounded-md active:scale-95 transition-transform text-white bg-red-600 hover:bg-red-600 inline-flex items-center justify-center"
                      title="Yazdır"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
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
                <div className="items-center p-2 pl-4 pr-4 rounded-full ml-2 md:ml-4 bg-blue-500">
                  <button onClick={secilenTeklifleriKartlaraAktar} className="font-semibold text-md whitespace-nowrap text-white">Kartlara Aktar</button>
                </div>
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
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsActionDropdownOpen(false);
                            setTimeout(() => {
                              silSecilenleri();
                            }, 100);
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
                            secilenTeklifleriIndir('excel');
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
                            secilenTeklifleriIndir('pdf');
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
              <table className="w-full text-xs text-left dark-text-secondary font-medium rounded-xl overflow-hidden">
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
                    <th scope="col" className="px-2 py-3 text-center">
                      Detay
                    </th>
                    <th scope="col" className="px-2 py-3 text-center">
                      İndir
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
                      <td className="px-6 py-2 text-blue-400 whitespace-nowrap text-xs">
                        {teklif.girisTarihi || "Tanımsız"}
                      </td>
                      <td className="px-6 py-2">
                        <button onClick={() => handleTeklifEkle(teklif)} className="bg-blue-500 p-2 pl-4 pr-4 rounded-full font-medium text-white hover:bg-blue-600 active:scale-95 transition-transform">Ekle</button>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <Link href={DetailPage(teklif.teklif_id)} className="bg-yellow-500 p-1.5 rounded-md hover:bg-yellow-600 active:scale-95 transition-transform inline-flex items-center justify-center" title="Detay">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </Link>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <div className="flex gap-1 justify-center items-center">
                          <button
                            onClick={() => handlePDFDownload(teklif.teklif_id)}
                            className="bg-green-600 p-1.5 rounded-md hover:bg-green-700 active:scale-95 transition-transform text-white inline-flex items-center justify-center"
                            title="PDF indir"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePrint(teklif.teklif_id)}
                            className="p-1.5 rounded-md active:scale-95 transition-transform text-white bg-red-600 hover:bg-red-600 inline-flex items-center justify-center"
                            title="Yazdır"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                        </div>
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

    </div>
  );
}

export default withAuth(Teklif);