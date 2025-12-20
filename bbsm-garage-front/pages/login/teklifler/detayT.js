import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../../_app';
import withAuth from '../../../withAuth';
import { useAuth } from '../../../auth-context';
import { API_URL } from '../../../config';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import { aracMarkalari, aracModelleri, yillar, renkler } from '../../../data/aracVerileri';
import { useToast } from '../../../contexts/ToastContext';
import { useProfile } from '../../../contexts/ProfileContext';
import { useTheme } from '../../../contexts/ThemeContext';

function Detay() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { success, error: showError, warning, info } = useToast();
  const { profileData, refreshProfile } = useProfile();
  const { activeTheme } = useTheme();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [detay_id, setDetay_id] = useState(0);
  const [veri, setVeri] = useState({});
  const [adSoyad, setadSoyad] = useState('');
  const [telNo, settelNo] = useState('');
  const [marka, setMarka] = useState('');
  const [model, setModel] = useState('');
  const [markaModel, setmarkaModel] = useState('');
  const [plaka, setplaka] = useState('');
  const [km, setkm] = useState('');
  const [modelYili, setmodelYili] = useState('');
  const [sasi, setsasi] = useState('');
  const [renk, setrenk] = useState('');
  const [girisTarihi, setgirisTarihi] = useState('');
  const [notlar, setnotlar] = useState('');
  const [adres, setadres] = useState('');
  const [odemeAlindi, setOdemeAlindi] = useState(false);
  const [duzenleyen, setduzenleyen] = useState('');
  const [isDuzenleyenModalOpen, setIsDuzenleyenModalOpen] = useState(false);
  const [tempDuzenleyen, setTempDuzenleyen] = useState('');
  const [yapilanlar, setYapilanlar] = useState([]);
  const [toplamFiyat, setToplamFiyat] = useState(0);
  const [mevcutModeller, setMevcutModeller] = useState([]);
  const [stoklar, setStoklar] = useState([]);
  const [aktifStokSatiri, setAktifStokSatiri] = useState(null);
  const [stokArama, setStokArama] = useState('');

  // Marka değiştiğinde model listesini güncelle
  useEffect(() => {
    if (marka && aracModelleri[marka]) {
      setMevcutModeller(aracModelleri[marka]);
      // Marka değiştiğinde modeli sıfırla
      if (!aracModelleri[marka].includes(model)) {
        setModel('');
      }
    } else {
      setMevcutModeller([]);
      setModel('');
    }
  }, [marka]);

  // Marka ve model değiştiğinde markaModel'i güncelle
  useEffect(() => {
    const combined = marka && model ? `${marka} ${model}` : (marka || model || '');
    setmarkaModel(combined);
  }, [marka, model]);

  const handleChange = (event) => {
    const { id, value } = event.target;
    switch (id) {
      case 'adSoyad':
        setadSoyad(value);
        break;
      case 'telNo':
        settelNo(value);
        break;
      case 'marka':
        setMarka(value);
        break;
      case 'model':
        setModel(value);
        break;
      case 'markaModel':
        setmarkaModel(value);
        // markaModel'den marka ve model'i parse et
        const markaModelStr = value || '';
        if (markaModelStr) {
          const bulunanMarka = aracMarkalari.find(m => markaModelStr.startsWith(m));
          if (bulunanMarka) {
            setMarka(bulunanMarka);
            const modelStr = markaModelStr.substring(bulunanMarka.length).trim();
            if (aracModelleri[bulunanMarka]?.includes(modelStr)) {
              setModel(modelStr);
            } else {
              setModel(modelStr);
            }
          }
        }
        break;
      case 'plaka':
        setplaka(value);
        break;
      case 'km':
        setkm(value);
        break;
      case 'modelYili':
        setmodelYili(value);
        break;
      case 'sasi':
        setsasi(value);
        break;
      case 'renk':
        setrenk(value);
        break;
      case 'girisTarihi':
        setgirisTarihi(value);
        break;
      case 'notlar':
        setnotlar(value);
        break;
      case 'adres':
        setadres(value);
        break;
      case 'odemeAlindi':
        setOdemeAlindi(event.target.checked);
        break;
      case 'duzenleyen':
        setduzenleyen(value);
        break;
    }
  };

  const router = useRouter();
  const { id } = router.query;

  async function fetchData(teklif_id) {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/teklif/${teklif_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setVeri(data);
      setYapilanlar(data.yapilanlar || []);
      setadSoyad(data.adSoyad || '');
      settelNo(data.telNo || '');
      
      // markaModel'i parse et
      const markaModelStr = data.markaModel || '';
      setmarkaModel(markaModelStr);
      if (markaModelStr) {
        const bulunanMarka = aracMarkalari.find(m => markaModelStr.startsWith(m));
        if (bulunanMarka) {
          setMarka(bulunanMarka);
          const modelStr = markaModelStr.substring(bulunanMarka.length).trim();
          if (aracModelleri[bulunanMarka]?.includes(modelStr)) {
            setModel(modelStr);
          }
        }
      }
      
      setplaka(data.plaka || '');
      setkm(data.km || '');
      setmodelYili(data.modelYili || '');
      setsasi(data.sasi || '');
      setrenk(data.renk || '');
      setgirisTarihi(data.girisTarihi || '');
      setnotlar(data.notlar || '');
      setadres(data.adres || '');
      setOdemeAlindi(data.odemeAlindi || false);
      setduzenleyen(data.duzenleyen || '');
    } catch (error) {
      console.error('Fetch data error:', error);
    }
    setLoading(false);
  };

  // Stok listesini yükle (detay sayfasında da stoktan seçim için)
  useEffect(() => {
    const fetchStoklar = async () => {
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
    fetchStoklar();
  }, [fetchWithAuth]);

  const handleChange2 = (event, index) => {
    setLoading(true);
    const { name, value } = event.target;
    const updatedYapilanlar = [...yapilanlar];
    const mevcut = updatedYapilanlar[index] || {};
    updatedYapilanlar[index] = { ...mevcut, [name]: value };
    
    // Parça adı manuel değişirse, stoktan bağımsız kabul et
    if (name === 'parcaAdi') {
      updatedYapilanlar[index].isFromStock = false;
      updatedYapilanlar[index].stockId = null;
    }
    
    // Birim adedi değiştiğinde ve stoktan seçilmişse stok kontrolü yap
    if (name === 'birimAdedi' && mevcut.isFromStock && mevcut.stockId) {
      const yeniAdet = parseInt(value, 10) || 0;
      const stok = stoklar.find(s => s.id === mevcut.stockId);
      if (stok && stok.adet < yeniAdet) {
        warning(`Uyarı: Stokta sadece ${stok.adet} adet var! Girdiğiniz adet: ${yeniAdet}`);
        // Adedi stok adedine sınırla
        updatedYapilanlar[index][name] = stok.adet;
      }
    }
    
    // Toplam fiyatı güncelle (birim adedi veya birim fiyatı değiştiğinde)
    if (name === 'birimAdedi' || name === 'birimFiyati') {
      const adet = name === 'birimAdedi' ? (parseInt(value, 10) || 0) : (parseInt(updatedYapilanlar[index].birimAdedi, 10) || 0);
      const fiyat = name === 'birimFiyati' ? (parseFloat(value) || 0) : (parseFloat(updatedYapilanlar[index].birimFiyati) || 0);
      updatedYapilanlar[index].toplamFiyat = adet * fiyat;
    }
    
    setYapilanlar(updatedYapilanlar);
    setLoading(false);
  };

  const handleStokDropdownToggle = (index) => {
    if (aktifStokSatiri === index) {
      setAktifStokSatiri(null);
      setStokArama('');
    } else {
      const mevcutParcaAdi = yapilanlar[index]?.parcaAdi || '';
      setAktifStokSatiri(index);
      setStokArama(mevcutParcaAdi);
    }
  };

  const handleStokSec = (index, stok) => {
    const updated = [...yapilanlar];
    const mevcut = updated[index] || {};
    const birimAdedi = parseInt(mevcut.birimAdedi, 10) || 1;
    
    // Stok kontrolü
    if (stok.adet < birimAdedi) {
      warning(`Uyarı: Stokta sadece ${stok.adet} adet var! Seçilen adet: ${birimAdedi}`);
      return;
    }
    
    updated[index] = {
      ...mevcut,
      parcaAdi: stok.stokAdi,
      birimFiyati: stok.fiyat || mevcut.birimFiyati || 0,
      stockId: stok.id,
      isFromStock: true,
    };
    setYapilanlar(updated);
    setAktifStokSatiri(null);
    setStokArama('');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/yapilanlar/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setYapilanlar(yapilanlar.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Delete yapilan error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const toplam = yapilanlar.reduce((acc, item) => {
      const birimFiyati = parseFloat(item.birimFiyati) || 0;
      const birimAdedi = parseInt(item.birimAdedi, 10) || 0;
      return acc + (birimFiyati * birimAdedi);
    }, 0);
    setToplamFiyat(toplam);
  }, [yapilanlar]);


  const test = () => {
    if (id !== undefined) {
      setDetay_id(id);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData(id).then(() => {
          test();
        });
    }
  }, [id]);

  const handleSaveCardInfo = () => {
    // Düzenleyen modalını aç
    setTempDuzenleyen(duzenleyen || '');
    setIsDuzenleyenModalOpen(true);
  };

  const handleConfirmSave = async () => {
    // Düzenleyen alanı zorunlu kontrolü
    if (!tempDuzenleyen || tempDuzenleyen.trim() === '') {
      warning('Lütfen Düzenleyen alanını doldurun.');
      return;
    }

    // Yapılanlar listesi boşsa uyarı ver
    if (!yapilanlar || yapilanlar.length === 0) {
      warning('İşlem giriniz! Lütfen en az bir işlem ekleyin.');
      return;
    }

    // Stok kontrolü - Kaydetmeden önce tüm stoktan seçilen ürünleri kontrol et
    const stokHatalari = [];
    yapilanlar.forEach((yapilan, index) => {
      if (yapilan.isFromStock && yapilan.stockId) {
        const stok = stoklar.find(s => s.id === yapilan.stockId);
        const birimAdedi = parseInt(yapilan.birimAdedi, 10) || 0;
        if (stok && stok.adet < birimAdedi) {
          stokHatalari.push({
            index: index + 1,
            parcaAdi: yapilan.parcaAdi || 'Bilinmeyen',
            stokAdet: stok.adet,
            istenenAdet: birimAdedi
          });
        }
      }
    });

    if (stokHatalari.length > 0) {
      const hataMesaji = stokHatalari.map(h => 
        `Satır ${h.index} - ${h.parcaAdi}: Stokta ${h.stokAdet} adet var, ${h.istenenAdet} adet istendi.`
      ).join('\n');
      warning(`Stok yetersiz! Kayıt yapılamadı.\n\n${hataMesaji}`);
      return;
    }

    // Düzenleyen değerini güncelle
    setduzenleyen(tempDuzenleyen.trim());
    setIsDuzenleyenModalOpen(false);

    setLoading(true);
    
    try {
      // 1. Önce kart bilgilerini kaydet
      const finalMarkaModel = markaModel.trim() || (marka && model ? `${marka} ${model}` : (marka || model || ''));
      
      // Boş string'leri undefined yap (backend validation için)
      const cardDataToSend = {
        adSoyad: adSoyad?.trim() || undefined,
        telNo: telNo?.trim() || undefined,
        markaModel: finalMarkaModel || undefined,
        plaka: plaka?.trim() || undefined,
        km: km ? (parseInt(km, 10) || null) : null,
        modelYili: modelYili ? (parseInt(modelYili, 10) || null) : null,
        sasi: sasi?.trim() || undefined,
        renk: renk?.trim() || undefined,
        girisTarihi: girisTarihi?.trim() || undefined,
        notlar: notlar?.trim() || undefined,
        adres: adres?.trim() || undefined,
        odemeAlindi: odemeAlindi || false,
        duzenleyen: tempDuzenleyen.trim() || undefined,
      };
      
      // undefined değerleri kaldır (sadece set edilmiş alanları gönder)
      Object.keys(cardDataToSend).forEach(key => {
        if (cardDataToSend[key] === undefined) {
          delete cardDataToSend[key];
        }
      });

      // detay_id veya id kullan (id öncelikli)
      const teklifId = detay_id || id;
      
      console.log('Sending card data:', cardDataToSend);
      console.log('API URL:', `${API_URL}/teklif/${teklifId}`);
      console.log('detay_id:', detay_id, 'id:', id, 'teklifId:', teklifId);

      if (!teklifId) {
        throw new Error('Teklif ID bulunamadı. Lütfen sayfayı yenileyin.');
      }

      const cardResponse = await fetchWithAuth(`${API_URL}/teklif/${teklifId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardDataToSend),
      });

      if (!cardResponse.ok) {
        const errorText = await cardResponse.text();
        console.error('Card update error response:', cardResponse.status, errorText);
        throw new Error(`Kart bilgileri kaydedilemedi (${cardResponse.status}): ${errorText || 'Bilinmeyen hata'}`);
      }

      const updatedCard = await cardResponse.json();
      setVeri(updatedCard);
      setadSoyad(updatedCard.adSoyad || '');
      settelNo(updatedCard.telNo || '');
      setmarkaModel(updatedCard.markaModel || '');
      setplaka(updatedCard.plaka || '');
      setkm(updatedCard.km || '');
      setmodelYili(updatedCard.modelYili || '');
      setsasi(updatedCard.sasi || '');
      setrenk(updatedCard.renk || '');
      setgirisTarihi(updatedCard.girisTarihi || '');
      setnotlar(updatedCard.notlar || '');
      setadres(updatedCard.adres || '');
      setOdemeAlindi(updatedCard.odemeAlindi || false);
      setduzenleyen(updatedCard.duzenleyen || '');

      // 2. Sonra yapılanları kaydet
      const yapilanlarDataToSend = yapilanlar.map(yapilan => ({
        id: yapilan.id,
        birimAdedi: parseInt(yapilan.birimAdedi, 10) || null,
        birimFiyati: parseFloat(yapilan.birimFiyati) || null,
        parcaAdi: yapilan.parcaAdi,
        toplamFiyat: yapilan.toplamFiyat,
        stockId: yapilan.stockId || null,
        isFromStock: yapilan.isFromStock || false,
      }));

      const yapilanlarResponse = await fetchWithAuth(`${API_URL}/teklif/${teklifId}/yapilanlar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(yapilanlarDataToSend),
      });

      if (!yapilanlarResponse.ok) {
        throw new Error('Yapılanlar kaydedilemedi');
      }

      const finalUpdatedCard = await yapilanlarResponse.json();
      setYapilanlar(finalUpdatedCard.yapilanlar || []);
      
      // Başarılı kayıt mesajı göster
      success('Düzenleme başarıyla kaydedildi!');
      
      // 1.5 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        router.push('/login/teklif');
      }, 1500);
    } catch (error) {
      console.error('Save error:', error);
      showError('Kayıt sırasında bir hata oluştu: ' + error.message);
    }
    setLoading(false);
  };
  

  const handleSaveYapilanlar = async () => {
    // Stok kontrolü - Kaydetmeden önce tüm stoktan seçilen ürünleri kontrol et
    const stokHatalari = [];
    yapilanlar.forEach((yapilan, index) => {
      if (yapilan.isFromStock && yapilan.stockId) {
        const stok = stoklar.find(s => s.id === yapilan.stockId);
        const birimAdedi = parseInt(yapilan.birimAdedi, 10) || 0;
        if (stok && stok.adet < birimAdedi) {
          stokHatalari.push({
            index: index + 1,
            parcaAdi: yapilan.parcaAdi || 'Bilinmeyen',
            stokAdet: stok.adet,
            istenenAdet: birimAdedi
          });
        }
      }
    });

    if (stokHatalari.length > 0) {
      const hataMesaji = stokHatalari.map(h => 
        `Satır ${h.index} - ${h.parcaAdi}: Stokta ${h.stokAdet} adet var, ${h.istenenAdet} adet istendi.`
      ).join('\n');
      warning(`Stok yetersiz! Kayıt yapılamadı.\n\n${hataMesaji}`);
      return;
    }

    setLoading(true);
    const dataToSend = yapilanlar.map(yapilan => ({
      id: yapilan.id,
      birimAdedi: parseInt(yapilan.birimAdedi, 10) || null,
      birimFiyati: parseFloat(yapilan.birimFiyati) || null,
      parcaAdi: yapilan.parcaAdi,
      toplamFiyat: yapilan.toplamFiyat,
      stockId: yapilan.stockId || null,
      isFromStock: yapilan.isFromStock || false,
    }));

    const teklifId = detay_id || id;
    if (!teklifId) {
      showError('Teklif ID bulunamadı. Lütfen sayfayı yenileyin.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/teklif/${teklifId}/yapilanlar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const updatedCard = await response.json();
      setVeri(updatedCard);
      setYapilanlar(updatedCard.yapilanlar || []);
      
      // Başarılı kayıt mesajı göster
      success('Yapılanlar başarıyla güncellendi!');
      
      // 1.5 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        router.push('/login/teklif');
      }, 1500);
    } catch (error) {
      console.error('Save yapilanlar error:', error);
      showError('Kayıt sırasında bir hata oluştu');
    }
    setLoading(false);
  };
  

  const handleEkleYapilanlar = () => {
    setLoading(true);
    const yeniYapilan = {
      id: Date.now(), // Benzersiz bir ID
      birimAdedi: '',
      parcaAdi: '',
      birimFiyati: '',
      toplamFiyat: 0,
    };
    setYapilanlar([...yapilanlar, yeniYapilan]);
    setLoading(false);
  };

  const handleExcelDownload = async () => {
    setLoading(true);
    const dataToSend = {
      vehicleInfo: {
        adSoyad: adSoyad || '',
        telNo: telNo || '',
        markaModel: markaModel || '',
        plaka: plaka || '',
        km: km || '',
        modelYili: modelYili || '',
        sasi: sasi || '',
        renk: renk || '',
        girisTarihi: girisTarihi || '',
        notlar: notlar || '',
        adres: adres || '',
      },
      data: yapilanlar.map(item => ({
        birimAdedi: parseInt(item.birimAdedi) || 0,
        parcaAdi: item.parcaAdi || '',
        birimFiyati: parseFloat(item.birimFiyati) || 0,
        toplamFiyat: (parseFloat(item.birimFiyati) || 0) * (parseInt(item.birimAdedi) || 0),
      })),
      notes: notlar || ''
    };

    try {
      const response = await fetchWithAuth(`${API_URL}/excel/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response || !response.ok) {
        throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
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
      // Show error message to user
      showError('Excel dosyası indirilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  const handlePDFDownload = async () => {
    setLoading(true);
    const dataToSend = {
        vehicleInfo: {
            adSoyad,
            telNo,
            markaModel,
            plaka,
            km,
            modelYili,
            sasi,
            renk,
            girisTarihi,
            notlar,
            adres,
        },
        data: yapilanlar.map(item => ({
            birimAdedi: item.birimAdedi,
            parcaAdi: item.parcaAdi,
            birimFiyati: item.birimFiyati,
            toplamFiyat: item.birimFiyati * item.birimAdedi,
        })),
        notes: notlar
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
            throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
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

  return (
    <>
      <Head>
        <title>BBSM Garage - Kart Detay</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="teklif"
        setIsProfileModalOpen={() => {}}
        setIsChangePasswordModalOpen={() => {}}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </div>

      <div className="p-6 pt-8 mt-12 lg:ml-64 dark-bg-primary">
        <div className="p-6 mt-5 dark-card-bg neumorphic-card rounded-3xl">
          <div className="flex p-2 items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
            <h2 className="text-2xl font-bold dark-text-primary mb-4">Kart Bilgileri</h2>
            <div className="flex items-center flex-wrap gap-2 sm:gap-0">
              <div className="items-center bg-green-500 p-2 px-4 sm:px-8 rounded-full neumorphic-inset">
                <button onClick={handleExcelDownload} className={`font-semibold text-md ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>Excel</button>
              </div>
              <div className="items-center bg-orange-600 p-2 px-4 sm:px-8 rounded-full ml-2 sm:ml-4 neumorphic-inset">
                <button onClick={handlePDFDownload} className={`font-semibold text-md ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>PDF</button>
              </div>
              <div className="items-center bg-yellow-500 p-2 px-4 sm:px-8 rounded-full ml-2 sm:ml-4 neumorphic-inset">
                <button onClick={handleSaveCardInfo} className={`font-semibold text-md ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>Kaydet</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 dark-text-primary">
            <input onChange={handleChange} placeholder="Ad Soyad" value={adSoyad} type="text" id="adSoyad" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Telefon No" value={telNo} type="text" id="telNo" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <select onChange={handleChange} value={marka} id="marka" className="neumorphic-input p-2 rounded-md w-full dark-text-primary">
              <option value="">Marka Seçin</option>
              {aracMarkalari.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select onChange={handleChange} value={model} id="model" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" disabled={!marka}>
              <option value="">Model Seçin</option>
              {mevcutModeller.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input onChange={handleChange} placeholder="Marka Model" value={markaModel} type="text" id="markaModel" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Plaka" value={plaka} type="text" id="plaka" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Km" value={km} type="text" id="km" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Model Yılı" value={modelYili} type="text" id="modelYili" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Şasi" value={sasi} type="text" id="sasi" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Renk" value={renk} type="text" id="renk" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Giriş Tarihi" value={girisTarihi} type="text" id="girisTarihi" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <textarea onChange={handleChange} placeholder="Adres" value={adres} id="adres" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" rows="1"></textarea>
            <textarea onChange={handleChange} placeholder="Notlar" value={notlar} id="notlar" className="neumorphic-input p-2 rounded-md w-full col-span-1 sm:col-span-2 dark-text-primary" rows="3"></textarea>
            <div className="flex items-center gap-6 col-span-1 sm:col-span-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="odemeAlindi" 
                  checked={odemeAlindi} 
                  onChange={handleChange} 
                  className="w-4 h-4 text-blue-400 dark-bg-tertiary dark-border rounded focus:ring-blue-400" 
                />
                <label htmlFor="odemeAlindi" className="dark-text-primary font-medium cursor-pointer">
                  Ödeme Alındı
                </label>
              </div>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium dark-text-primary mb-1">
                Düzenleyen: <span className="dark-text-muted">{duzenleyen || 'Belirtilmemiş'}</span>
              </label>
              <p className="text-xs dark-text-muted">Kaydet butonuna bastığınızda düzenleyen bilgisi sorulacaktır.</p>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mt-8'>
            <h2 className="text-2xl font-bold dark-text-primary">Yapılanlar</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleEkleYapilanlar} className={`p-2 px-4 sm:px-8 rounded-full font-semibold bg-blue-500 text-md neumorphic-inset ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>Ekle</button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full text-sm divide-y dark-border">
                <thead className="dark-bg-tertiary neumorphic-inset">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Birim Adedi</th>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Parça Adı</th>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Birim Fiyatı</th>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Toplam Fiyat</th>
                    <th className="px-3 sm:px-6 py-3 text-center font-medium dark-text-primary uppercase tracking-wider">Sil</th>
                  </tr>
                </thead>
                <tbody className="dark-card-bg divide-y dark-border">
                  {yapilanlar.map((yapilan, index) => (
                    <tr key={index} className="hover:dark-bg-tertiary transition-colors">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          onChange={(event) => handleChange2(event, index)}
                          placeholder="1"
                          value={yapilan.birimAdedi || ''}
                          type="number"
                          name="birimAdedi"
                          className="neumorphic-input p-2 rounded-md w-full dark-text-primary"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <input
                            onChange={(event) => {
                              handleChange2(event, index);
                              if (aktifStokSatiri === index) {
                                setStokArama(event.target.value);
                              }
                            }}
                            placeholder="Parça Adı (Manuel veya Stoktan)"
                            value={yapilan.parcaAdi || ''}
                            type="text"
                            name="parcaAdi"
                            className="neumorphic-input p-2 rounded-md w-full truncate dark-text-primary pr-16"
                            title={yapilan.parcaAdi || ''}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-1">
                          {yapilan.isFromStock && (
                            <img 
                              src="/images/envanterikon.png" 
                              alt="Stoktan seçildi" 
                              className="w-4 h-4 ml-1" 
                              title="Stoktan seçildi"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleStokDropdownToggle(index)}
                            className={`px-2 py-1 bg-blue-500 rounded text-xs hover:bg-blue-600 flex items-center justify-center ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                            title="Stoktan Seç"
                          >
                            <img 
                              src="/images/envanterikon.png" 
                              alt="Envanter" 
                              className="w-3 h-3"
                            />
                          </button>
                        </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          onChange={(event) => handleChange2(event, index)}
                          placeholder="0"
                          value={yapilan.birimFiyati || ''}
                          type="number"
                          name="birimFiyati"
                          className="neumorphic-input p-2 rounded-md w-full dark-text-primary"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap dark-text-secondary">{(yapilan.birimFiyati) * (yapilan.birimAdedi)}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button onClick={() => handleDelete(yapilan.id)} className="text-red-400 hover:text-red-300">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <h2 className="text-xl text-end font-bold dark-text-primary p-4 sm:p-8 m-4 mt-8">Toplam Fiyat : {toplamFiyat} </h2>
        </div>
      </div>

      {/* Stok / Envanter Modal */}
      {aktifStokSatiri !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9998]">
          <div className="dark-card-bg neumorphic-card rounded-3xl max-w-lg w-full mx-4 p-4 md:p-6 border dark-border">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold dark-text-primary">Envanterden Seç</h4>
              <button
                onClick={() => {
                  setAktifStokSatiri(null);
                  setStokArama('');
                }}
                className="dark-text-muted hover:dark-text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={stokArama}
                onChange={(e) => setStokArama(e.target.value)}
                placeholder="Stok ara..."
                className="neumorphic-input p-2 rounded-md dark-text-primary font-medium w-full text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto border dark-border rounded-lg">
              {stoklar
                .filter(stok =>
                  (stok.stokAdi || '').toLowerCase().includes((stokArama || '').toLowerCase())
                )
                .map(stok => (
                  <button
                    key={stok.id}
                    type="button"
                    onClick={() => handleStokSec(aktifStokSatiri, stok)}
                    className="w-full text-left px-4 py-2 hover:dark-bg-tertiary cursor-pointer border-b dark-border last:border-b-0 flex justify-between items-center"
                  >
                    <span className="dark-text-primary text-sm font-medium truncate">
                      {stok.stokAdi}
                    </span>
                    <span className={`text-xs ${stok.adet > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Stok: {stok.adet}
                    </span>
                  </button>
                ))}
              {stoklar.length === 0 && (
                <div className="px-4 py-3 text-center dark-text-muted text-sm">
                  Stok bulunamadı
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Düzenleyen Modal */}
      {isDuzenleyenModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="dark-card-bg neumorphic-card rounded-3xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold dark-text-primary">Düzenleyen Bilgisi</h3>
              <button 
                onClick={() => setIsDuzenleyenModalOpen(false)}
                className="dark-text-muted hover:dark-text-primary"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium dark-text-primary mb-2">
                Düzenleyen * <span className="text-red-400">(Zorunlu)</span>
              </label>
              <input
                type="text"
                value={tempDuzenleyen}
                onChange={(e) => setTempDuzenleyen(e.target.value)}
                placeholder="Düzenleyen ismini giriniz"
                className="w-full neumorphic-input p-3 rounded-md dark-text-primary"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmSave();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDuzenleyenModalOpen(false)}
                className="px-6 py-2 dark-bg-tertiary dark-text-primary rounded-full font-semibold neumorphic-inset hover:dark-bg-secondary transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmSave}
                className={`px-6 py-2 bg-blue-500 rounded-full font-semibold neumorphic-inset hover:bg-blue-600 transition-colors ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

export default withAuth(Detay);

