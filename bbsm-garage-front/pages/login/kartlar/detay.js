import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../../_app';
import withAuth from '../../../withAuth';
import { useAuth } from '../../../auth-context';
import { API_URL } from '../../../config';
import ProfileModal from '../../../components/ProfileModal';
import ChangePasswordModal from '../../../components/ChangePasswordModal';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import { aracMarkalari, aracModelleri, yillar, renkler } from '../../../data/aracVerileri';
import { useToast } from '../../../contexts/ToastContext';
import { useProfile } from '../../../contexts/ProfileContext';

function Detay() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { success, error: showError, warning, info } = useToast();
  const { profileData, refreshProfile } = useProfile();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
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
        setOdemeAlindi(data.odemeAlindi || false);
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
        odemeAlindi,
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
      setOdemeAlindi(updatedCard.odemeAlindi || false);
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
      </div>

      <div className="p-6 pt-8 mt-12 lg:ml-64 dark-bg-primary">
        <div className="p-6 mt-5 dark-card-bg neumorphic-card rounded-3xl">
          <div className="flex p-2 items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0">
            <h2 className="text-2xl font-bold dark-text-primary mb-4">Kart Bilgileri</h2>
            <div className="flex items-center flex-wrap gap-2 sm:gap-0">
              <div className="items-center bg-green-500 p-2 px-4 sm:px-8 rounded-full neumorphic-inset">
                <button onClick={handleExcelDownload} className="font-semibold text-white text-md">Excel</button>
              </div>
              <div className="items-center bg-orange-600 p-2 px-4 sm:px-8 rounded-full ml-2 sm:ml-4 neumorphic-inset">
                <button onClick={handlePDFDownload} className="font-semibold text-white text-md">PDF</button>
              </div>
              <div className="items-center bg-yellow-500 p-2 px-4 sm:px-8 rounded-full ml-2 sm:ml-4 neumorphic-inset">
                <button onClick={handleSaveCardInfo} className="font-semibold text-white text-md">Kaydet</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 dark-text-primary">
            <input onChange={handleChange} placeholder="Ad Soyad" value={adSoyad} type="text" id="adSoyad" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
            <input onChange={handleChange} placeholder="Telefon No" value={telNo} type="text" id="telNo" className="neumorphic-input p-2 rounded-md w-full dark-text-primary" />
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
              <button onClick={handleEkleYapilanlar} className="p-2 px-4 sm:px-8 rounded-full font-semibold bg-blue-500 text-white text-md neumorphic-inset">Ekle</button>
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
                        <input
                          onChange={(event) => handleChange2(event, index)}
                          placeholder="Parça Adı"
                          value={yapilan.parcaAdi || ''}
                          type="text"
                          name="parcaAdi"
                          className="neumorphic-input p-2 rounded-md w-full truncate dark-text-primary"
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
                className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold neumorphic-inset hover:bg-blue-600 transition-colors"
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

    </>
  );
}

export default withAuth(Detay);