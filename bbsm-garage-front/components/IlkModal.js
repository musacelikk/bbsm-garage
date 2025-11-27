import React, { useState, useEffect } from 'react';

const IlkModal = ({ onIlkModalSubmit, onClose, ilkModalBilgi }) => {
  const [adSoyad, setAdSoyad] = useState('');
  const [telNo, setTelNo] = useState('');
  const [markaModel, setMarkaModel] = useState('');
  const [girisTarihi, setGirisTarihi] = useState('');
  const [plaka, setPlaka] = useState('');
  const [km, setKm] = useState('');
  const [modelYili, setModelYili] = useState('');
  const [sasi, setSasi] = useState('');
  const [renk, setRenk] = useState('');
  const [adres, setAdres] = useState('');
  const [notlar, setNot] = useState('');

  useEffect(() => {
    if (ilkModalBilgi) {
      setAdSoyad(ilkModalBilgi.adSoyad || '');
      setTelNo(ilkModalBilgi.telNo || '');
      setMarkaModel(ilkModalBilgi.markaModel || '');
      setGirisTarihi(ilkModalBilgi.girisTarihi || '');
      setPlaka(ilkModalBilgi.plaka || '');
      setKm(ilkModalBilgi.km || '');
      setModelYili(ilkModalBilgi.modelYili || '');
      setSasi(ilkModalBilgi.sasi || '');
      setRenk(ilkModalBilgi.renk || '');
      setAdres(ilkModalBilgi.adres || '');
      setNot(ilkModalBilgi.notlar || '');
    }
  }, [ilkModalBilgi]);

  const handleIlkModalSubmit = () => {
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
      notlar,
    };

    onIlkModalSubmit(ilkModalBilgiler);
  };

  const handleClearForm = () => {
    setAdSoyad('');
    setTelNo('');
    setMarkaModel('');
    setGirisTarihi('');
    setPlaka('');
    setKm('');
    setModelYili('');
    setSasi('');
    setRenk('');
    setAdres('');
    setNot('');
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center backdrop-blur-sm backdrop-brightness-30">
      <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 md:mx-0 max-h-[90vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 rounded-t-lg">
          <h3 className="text-xl font-medium text-gray-900">Kart Ekle</h3>
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
            <input type="text" id="markaModel" placeholder="Marka Model" value={markaModel} onChange={e => setMarkaModel(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="text" id="girisTarihi" placeholder="Giriş Tarihi" value={girisTarihi} onChange={e => setGirisTarihi(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="text" id="plaka" placeholder="Plaka" value={plaka} onChange={e => setPlaka(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="number" id="km" placeholder="Km" value={km} onChange={e => setKm(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="text" id="sasi" placeholder="Şasi No" value={sasi} onChange={e => setSasi(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md md:col-span-2" />
            <input type="number" id="modelYili" placeholder="Model Yılı" value={modelYili} onChange={e => setModelYili(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <input type="text" id="renk" placeholder="Rengi" value={renk} onChange={e => setRenk(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md" />
            <textarea placeholder="Adres" id="adres" value={adres} onChange={e => setAdres(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md md:col-span-2" rows="3"></textarea>
            <textarea placeholder="Notlar" id="notlar" value={notlar} onChange={e => setNot(e.target.value)} className="bg-my-beyaz border p-2 text-gray-600 font-medium rounded-md md:col-span-2" rows="3"></textarea>
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
