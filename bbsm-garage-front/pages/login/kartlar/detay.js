import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../../_app';
import withAuth from '../../../withAuth';
import { useAuth } from '../../../auth-context';
import { API_URL } from '../../../config';
import ProfileModal from '../../../components/ProfileModal';
import { aracMarkalari, aracModelleri, yillar, renkler } from '../../../data/aracVerileri';
import { useToast } from '../../../contexts/ToastContext';

export default function Detay() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { success, error: showError, warning, info } = useToast();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const firmaAdi = profileData?.firmaAdi ? profileData.firmaAdi.toUpperCase() : 'KULLANICI';
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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
  const [duzenleyen, setduzenleyen] = useState('');
  const [isDuzenleyenModalOpen, setIsDuzenleyenModalOpen] = useState(false);
  const [tempDuzenleyen, setTempDuzenleyen] = useState('');
  const [yapilanlar, setYapilanlar] = useState([]);
  const [toplamFiyat, setToplamFiyat] = useState(0);
  const [mevcutModeller, setMevcutModeller] = useState([]);

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
      case 'duzenleyen':
        setduzenleyen(value);
        break;
    }
  };

  const router = useRouter();
  const { id } = router.query;

  async function fetchData(card_id) {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/card/${card_id}/yapilanlar`, {
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
      setduzenleyen(data.duzenleyen || '');
    } catch (error) {
      console.error('Fetch data error:', error);
    }
    setLoading(false);
  };

  const handleChange2 = (event, index) => {
    setLoading(true);
    const { name, value } = event.target;
    const updatedYapilanlar = [...yapilanlar];
    updatedYapilanlar[index] = { ...updatedYapilanlar[index], [name]: value };
    setYapilanlar(updatedYapilanlar);
    setLoading(false);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

    // Düzenleyen değerini güncelle
    setduzenleyen(tempDuzenleyen.trim());
    setIsDuzenleyenModalOpen(false);

    setLoading(true);
    
    try {
      // 1. Önce kart bilgilerini kaydet
      const finalMarkaModel = markaModel.trim() || (marka && model ? `${marka} ${model}` : (marka || model || ''));
      const cardDataToSend = {
      adSoyad,
      telNo,
        markaModel: finalMarkaModel,
      plaka,
      km: parseInt(km, 10) || null,
      modelYili: parseInt(modelYili, 10) || null,
      sasi,
      renk,
      girisTarihi,
      notlar,
      adres,
        duzenleyen: tempDuzenleyen.trim(),
    };

      const cardResponse = await fetchWithAuth(`${API_URL}/card/${detay_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardDataToSend),
      });

      if (!cardResponse.ok) {
        throw new Error('Kart bilgileri kaydedilemedi');
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
      setduzenleyen(updatedCard.duzenleyen || '');

      // 2. Sonra yapılanları kaydet
      const yapilanlarDataToSend = yapilanlar.map(yapilan => ({
        id: yapilan.id,
        birimAdedi: parseInt(yapilan.birimAdedi, 10) || null,
        birimFiyati: parseFloat(yapilan.birimFiyati) || null,
        parcaAdi: yapilan.parcaAdi,
        toplamFiyat: yapilan.toplamFiyat,
      }));

      const yapilanlarResponse = await fetchWithAuth(`${API_URL}/card/${detay_id}/yapilanlar`, {
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
        router.push('/login/kartlar');
      }, 1500);
    } catch (error) {
      console.error('Save error:', error);
      showError('Kayıt sırasında bir hata oluştu: ' + error.message);
    }
    setLoading(false);
  };

  const handleSaveYapilanlar = async () => {
    setLoading(true);
    const dataToSend = yapilanlar.map(yapilan => ({
      id: yapilan.id,
      birimAdedi: parseInt(yapilan.birimAdedi, 10) || null,
      birimFiyati: parseFloat(yapilan.birimFiyati) || null,
      parcaAdi: yapilan.parcaAdi,
      toplamFiyat: yapilan.toplamFiyat,
    }));

    try {
      const response = await fetchWithAuth(`${API_URL}/card/${detay_id}/yapilanlar`, {
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
        router.push('/login/kartlar');
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

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz">
          <ul className="space-y-4">
            <li>
              <Link href="/login/kartlar" className="block p-2 f text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Kartlar</Link>
            </li>
            <li>
              <Link href="/login/teklif" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Teklif</Link>
            </li>
            <li>
              <Link href="/login/stok" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Stok Takibi</Link>
            </li>
            <li>
              <Link href="/login/gelir" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Gelir Raporu</Link>
            </li>
            <li>
              <Link href="/login/son-hareketler" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Son Hareketler</Link>
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

                </a>
              </div>
              <div className="flex items-center relative">
                <button 
                  type="button" 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center text-sm hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="sr-only">Open user menu</span>
                  <p className="text-center text-my-siyah font-semibold items-center pr-8">{firmaAdi}</p>
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
                                showError('Profil bilgileri yüklenemedi');
                              }
                            } catch (error) {
                              console.error('Profil yükleme hatası:', error);
                              showError('Profil bilgileri yüklenirken bir hata oluştu');
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
                            info('Şifre değiştirme yakında eklenecek');
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
      </div>

      <div className="p-6 pt-8 mt-14 lg:ml-64">
        <div className="p-6 mt-5 bg-my-beyaz rounded-3xl">
          <div className="flex p-2 items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
            <h2 className="text-2xl font-bold text-my-siyah mb-4">Kart Bilgileri</h2>
            <div className="flex items-center flex-wrap gap-2 sm:gap-0">
              <div className="items-center bg-green-500 p-2 px-4 sm:px-8 rounded-full">
                <button onClick={handleExcelDownload} className="font-semibold text-my-beyaz text-md">Excel</button>
              </div>
              <div className="items-center bg-orange-600 p-2 px-4 sm:px-8 rounded-full ml-2 sm:ml-4">
                <button onClick={handlePDFDownload} className="font-semibold text-my-beyaz text-md">PDF</button>
              </div>
              <div className="items-center bg-yellow-500 p-2 px-4 sm:px-8 rounded-full ml-2 sm:ml-4">
                <button onClick={handleSaveCardInfo} className="font-semibold text-my-beyaz text-md">Kaydet</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-my-siyah">
            <input onChange={handleChange} placeholder="Ad Soyad" value={adSoyad} type="text" id="adSoyad" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Telefon No" value={telNo} type="text" id="telNo" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Marka Model" value={markaModel} type="text" id="markaModel" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Plaka" value={plaka} type="text" id="plaka" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Km" value={km} type="text" id="km" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Model Yılı" value={modelYili} type="text" id="modelYili" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Şasi" value={sasi} type="text" id="sasi" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Renk" value={renk} type="text" id="renk" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <input onChange={handleChange} placeholder="Giriş Tarihi" value={girisTarihi} type="text" id="girisTarihi" className="bg-my-beyaz border p-2 rounded-md w-full" />
            <textarea onChange={handleChange} placeholder="Adres" value={adres} id="adres" className="bg-my-beyaz border p-2 rounded-md w-full" rows="1"></textarea>
            <textarea onChange={handleChange} placeholder="Notlar" value={notlar} id="notlar" className="bg-my-beyaz border p-2 rounded-md w-full col-span-1 sm:col-span-2" rows="3"></textarea>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Düzenleyen: <span className="text-gray-500">{duzenleyen || 'Belirtilmemiş'}</span>
              </label>
              <p className="text-xs text-gray-500">Kaydet butonuna bastığınızda düzenleyen bilgisi sorulacaktır.</p>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 mt-8'>
            <h2 className="text-2xl font-bold text-my-siyah">Yapılanlar</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleEkleYapilanlar} className="p-2 px-4 sm:px-8 rounded-full font-semibold bg-blue-500 text-my-beyaz text-md">Ekle</button>
            </div>
          </div>
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Birim Adedi</th>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">Parça Adı</th>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Birim Fiyatı</th>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">Toplam Fiyat</th>
                    <th className="px-3 sm:px-6 py-3 text-center font-medium text-gray-700 uppercase tracking-wider">Sil</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yapilanlar.map((yapilan, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          onChange={(event) => handleChange2(event, index)}
                          placeholder="1"
                          value={yapilan.birimAdedi || ''}
                          type="number"
                          name="birimAdedi"
                          className="bg-my-beyaz border p-2 rounded-md w-full"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          onChange={(event) => handleChange2(event, index)}
                          placeholder="Parça Adı"
                          value={yapilan.parcaAdi || ''}
                          type="text"
                          name="parcaAdi"
                          className="bg-my-beyaz border p-2 rounded-md w-full truncate"
                          title={yapilan.parcaAdi || ''}
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          onChange={(event) => handleChange2(event, index)}
                          placeholder="0"
                          value={yapilan.birimFiyati || ''}
                          type="number"
                          name="birimFiyati"
                          className="bg-my-beyaz border p-2 rounded-md w-full"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">{(yapilan.birimFiyati) * (yapilan.birimAdedi)}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button onClick={() => handleDelete(yapilan.id)} className="text-red-500 hover:text-red-700">
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
          <h2 className="text-xl text-end font-bold text-my-siyah p-4 sm:p-8 m-4 mt-8">Toplam Fiyat : {toplamFiyat} </h2>
        </div>
      </div>

      {/* Düzenleyen Modal */}
      {isDuzenleyenModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-my-siyah">Düzenleyen Bilgisi</h3>
              <button 
                onClick={() => setIsDuzenleyenModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Düzenleyen * <span className="text-red-500">(Zorunlu)</span>
              </label>
              <input
                type="text"
                value={tempDuzenleyen}
                onChange={(e) => setTempDuzenleyen(e.target.value)}
                placeholder="Düzenleyen ismini giriniz"
                className="w-full bg-my-beyaz border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-my-mavi"
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
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-400 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-6 py-2 bg-my-mavi text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
              >
                Kaydet
              </button>
            </div>
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

      {/* WhatsApp Destek Butonu */}
      <a
        href="https://wa.me/905551234567"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
        aria-label="WhatsApp Destek"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="ml-2 text-sm font-medium">Destek</span>
      </a>
    </>
  );
}
