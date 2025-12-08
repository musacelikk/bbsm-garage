import React, { useState, useEffect } from 'react';
import { aracMarkalari, aracModelleri, yillar, renkler } from '../data/aracVerileri';

const IlkModal = ({ onIlkModalSubmit, onClose, ilkModalBilgi, isPeriyodikBakimMode = false }) => {
  // Bugünün tarihini YYYY-MM-DD formatında al
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [adSoyad, setAdSoyad] = useState('');
  const [telNo, setTelNo] = useState('');
  const [marka, setMarka] = useState('');
  const [model, setModel] = useState('');
  const [girisTarihi, setGirisTarihi] = useState(getTodayDate());
  const [plaka, setPlaka] = useState('');
  const [km, setKm] = useState('');
  const [modelYili, setModelYili] = useState('');
  const [sasi, setSasi] = useState('');
  const [renk, setRenk] = useState('');
  const [adres, setAdres] = useState('');
  const [notlar, setNot] = useState('');
  const [odemeAlindi, setOdemeAlindi] = useState(false);
  const [periyodikBakim, setPeriyodikBakim] = useState(false);
  const [duzenleyen, setDuzenleyen] = useState('');
  const [mevcutModeller, setMevcutModeller] = useState([]);

  // Marka değiştiğinde model listesini güncelle
  useEffect(() => {
    if (marka && aracModelleri[marka]) {
      setMevcutModeller(aracModelleri[marka]);
      // Marka değiştiğinde modeli sıfırla
      setModel('');
    } else {
      setMevcutModeller([]);
      setModel('');
    }
  }, [marka]);

  useEffect(() => {
    if (isPeriyodikBakimMode) {
      setPeriyodikBakim(true);
    } else if (!ilkModalBilgi) {
      // Modal yeni açıldığında ve periyodik bakım modu değilse false yap
      setPeriyodikBakim(false);
    }
  }, [isPeriyodikBakimMode, ilkModalBilgi]);

  useEffect(() => {
    if (ilkModalBilgi) {
      setAdSoyad(ilkModalBilgi.adSoyad || '');
      setTelNo(ilkModalBilgi.telNo || '');
      
      // markaModel'i parse et (örn: "BMW 3 Series" -> marka: "BMW", model: "3 Series")
      const markaModelStr = ilkModalBilgi.markaModel || '';
      if (markaModelStr) {
        // Önce marka'yı bul
        const bulunanMarka = aracMarkalari.find(m => markaModelStr.startsWith(m));
        if (bulunanMarka) {
          setMarka(bulunanMarka);
          const modelStr = markaModelStr.substring(bulunanMarka.length).trim();
          if (aracModelleri[bulunanMarka]?.includes(modelStr)) {
            setModel(modelStr);
          }
        }
      }
      
      setGirisTarihi(ilkModalBilgi.girisTarihi || getTodayDate());
      setPlaka(ilkModalBilgi.plaka || '');
      setKm(ilkModalBilgi.km || '');
      setModelYili(ilkModalBilgi.modelYili || '');
      setSasi(ilkModalBilgi.sasi || '');
      setRenk(ilkModalBilgi.renk || '');
      setAdres(ilkModalBilgi.adres || '');
      setNot(ilkModalBilgi.notlar || '');
      setOdemeAlindi(ilkModalBilgi.odemeAlindi || false);
      setPeriyodikBakim(ilkModalBilgi.periyodikBakim || false);
      setDuzenleyen(ilkModalBilgi.duzenleyen || '');
    } else {
      // Modal yeni açıldığında girisTarihi'ni bugünün tarihiyle ayarla
      setGirisTarihi(getTodayDate());
      // Eğer periyodik bakım modundaysa checkbox'ı işaretle
      if (isPeriyodikBakimMode) {
        setPeriyodikBakim(true);
      }
    }
  }, [ilkModalBilgi, isPeriyodikBakimMode]);

  const handleIlkModalSubmit = () => {
    // Düzenleyen alanı zorunlu kontrolü
    if (!duzenleyen || duzenleyen.trim() === '') {
      alert('Lütfen Düzenleyen alanını doldurun.');
      return;
    }

    // Marka ve modeli birleştir
    const markaModel = marka && model ? `${marka} ${model}` : (marka || model || '');
    
    const ilkModalBilgiler = {
      adSoyad,
      telNo,
      markaModel,
      girisTarihi,
      plaka,
      km,
      modelYili,
      sasi,
      renk,
      adres,
      odemeAlindi,
      periyodikBakim: isPeriyodikBakimMode ? true : periyodikBakim, // Periyodik bakım modundaysa kesinlikle true
      notlar,
      duzenleyen: duzenleyen.trim(),
    };

    console.log('IlkModal Submit - periyodikBakim:', ilkModalBilgiler.periyodikBakim, 'isPeriyodikBakimMode:', isPeriyodikBakimMode);
    onIlkModalSubmit(ilkModalBilgiler);
  };

  const handleClearForm = () => {
    setAdSoyad('');
    setTelNo('');
    setMarka('');
    setModel('');
    setGirisTarihi(getTodayDate()); // Form temizlendiğinde de bugünün tarihini ayarla
    setPlaka('');
    setKm('');
    setModelYili('');
    setSasi('');
    setRenk('');
    setAdres('');
    setNot('');
    setOdemeAlindi(false);
    setPeriyodikBakim(isPeriyodikBakimMode); // Periyodik bakım modundaysa true kalmalı
    setDuzenleyen('');
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center backdrop-blur-sm backdrop-brightness-30">
      <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 md:mx-0 max-h-[90vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 rounded-t-lg">
          <h3 className="text-xl font-medium text-gray-900">
            {isPeriyodikBakimMode ? 'Periyodik Bakım Kartı Ekle' : 'Kart Ekle'}
          </h3>
          <button onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-8 md:pl-16 md:pr-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" id="adSoyad" placeholder="Ad Soyad" value={adSoyad} onChange={e => setAdSoyad(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="number" id="telNo" placeholder="Telefon No" pattern="\d{10}" value={telNo} onChange={e => setTelNo(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            
            {/* Marka Dropdown */}
            <select 
              id="marka" 
              value={marka} 
              onChange={e => setMarka(e.target.value)} 
              className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md"
            >
              <option value="">Marka Seçiniz</option>
              {aracMarkalari.map((markaItem) => (
                <option key={markaItem} value={markaItem}>{markaItem}</option>
              ))}
            </select>
            
            {/* Model Dropdown */}
            <select 
              id="model" 
              value={model} 
              onChange={e => setModel(e.target.value)} 
              className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md"
              disabled={!marka || mevcutModeller.length === 0}
            >
              <option value="">Model Seçiniz</option>
              {mevcutModeller.map((modelItem) => (
                <option key={modelItem} value={modelItem}>{modelItem}</option>
              ))}
            </select>
            
            <input type="date" id="girisTarihi" placeholder="Giriş Tarihi" value={girisTarihi} onChange={e => setGirisTarihi(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="text" id="plaka" placeholder="Plaka" value={plaka} onChange={e => setPlaka(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="number" id="km" placeholder="Km" value={km} onChange={e => setKm(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="text" id="sasi" placeholder="Şasi No" value={sasi} onChange={e => setSasi(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md md:col-span-2" />
            
            {/* Model Yılı Dropdown */}
            <select 
              id="modelYili" 
              value={modelYili} 
              onChange={e => setModelYili(e.target.value)} 
              className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md"
            >
              <option value="">Model Yılı Seçiniz</option>
              {yillar.map((yil) => (
                <option key={yil} value={yil}>{yil}</option>
              ))}
            </select>
            
            {/* Renk Dropdown */}
            <select 
              id="renk" 
              value={renk} 
              onChange={e => setRenk(e.target.value)} 
              className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md"
            >
              <option value="">Renk Seçiniz</option>
              {renkler.map((renkItem) => (
                <option key={renkItem} value={renkItem}>{renkItem}</option>
              ))}
            </select>
            
            <textarea placeholder="Adres" id="adres" value={adres} onChange={e => setAdres(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md md:col-span-2" rows="3"></textarea>
            <textarea placeholder="Notlar" id="notlar" value={notlar} onChange={e => setNot(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md md:col-span-2" rows="3"></textarea>
            <div className="flex items-center gap-6 md:col-span-2">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="odemeAlindi" 
                  checked={odemeAlindi} 
                  onChange={e => setOdemeAlindi(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                />
                <label htmlFor="odemeAlindi" className="text-gray-600 font-medium cursor-pointer">
                  Ödeme Alındı
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="periyodikBakim" 
                  checked={periyodikBakim} 
                  onChange={e => setPeriyodikBakim(e.target.checked)} 
                  disabled={isPeriyodikBakimMode}
                  className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${isPeriyodikBakimMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <label htmlFor="periyodikBakim" className={`text-gray-600 font-medium ${isPeriyodikBakimMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  Periyodik Bakım {isPeriyodikBakimMode && '(Zorunlu)'}
                </label>
              </div>
            </div>
            <input type="text" id="duzenleyen" placeholder="Düzenleyen *" value={duzenleyen} onChange={e => setDuzenleyen(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md md:col-span-2" required />
          </div>
          <div className="flex flex-col md:flex-row justify-between mt-8 gap-4">
            <button onClick={onClose} className="bg-my-açıkgri text-white font-semibold rounded-full p-2 px-8 w-full md:w-auto">
              İptal
            </button>
            <button onClick={handleClearForm} className="bg-red-500 text-white font-semibold rounded-full p-2 px-8 w-full md:w-auto">
              Formu Temizle
            </button>
            <button className="bg-my-mavi text-white font-semibold rounded-full p-2 px-8 w-full md:w-auto" onClick={handleIlkModalSubmit}>İleri</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IlkModal;
