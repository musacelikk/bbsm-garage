import React, { useState, useEffect, useRef } from 'react';

const IkinciModal = ({ onIkinciModalClose, ilkModalBilgi, onClose, onKartEkle, onTeklifEkle, yapilanlar, onYapilanlarEkle, onYapilanlarSil, onYapilanlarSil_index, fetchWithAuth, API_URL }) => {
  const [birimAdedi, setBirimAdedi] = useState('');
  const [parcaAdi, setParcaAdi] = useState('');
  const [birimFiyati, setBirimFiyati] = useState('');
  const [localYapilanlar, setLocalYapilanlar] = useState([]);
  const [stoklar, setStoklar] = useState([]);
  const [stokArama, setStokArama] = useState('');
  const [stokDropdownOpen, setStokDropdownOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [stockWarning, setStockWarning] = useState('');
  const stokInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setLocalYapilanlar(yapilanlar);
  }, [yapilanlar]);

  // Stok listesini yükle
  useEffect(() => {
    const fetchStoklar = async () => {
      if (!fetchWithAuth || !API_URL) return;
      try {
        const response = await fetchWithAuth(`${API_URL}/stok`, { method: 'GET' });
        if (response && response.ok) {
          const data = await response.json();
          setStoklar(data || []);
        }
      } catch (error) {
        console.error('Stoklar yüklenirken hata:', error);
      }
    };
    fetchStoklar();
  }, [fetchWithAuth, API_URL]);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          stokInputRef.current && !stokInputRef.current.contains(event.target)) {
        setStokDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrelenmiş stok listesi
  const filtrelenmisStoklar = stoklar.filter(stok => 
    stok.stokAdi.toLowerCase().includes(stokArama.toLowerCase())
  );

  // Stoktan seçim yapıldığında
  const handleStokSec = (stok) => {
    setParcaAdi(stok.stokAdi);
    setSelectedStockId(stok.id);
    setStokArama('');
    setStokDropdownOpen(false);
    setStockWarning('');
    
    // Stok yetersizse uyarı göster
    if (stok.adet < (parseInt(birimAdedi) || 1)) {
      setStockWarning(`Uyarı: Stokta sadece ${stok.adet} adet var!`);
    } else {
      setStockWarning('');
    }
  };

  // Birim adedi değiştiğinde stok kontrolü
  useEffect(() => {
    if (selectedStockId && birimAdedi) {
      const stok = stoklar.find(s => s.id === selectedStockId);
      if (stok) {
        const adet = parseInt(birimAdedi) || 1;
        if (stok.adet < adet) {
          setStockWarning(`Uyarı: Stokta sadece ${stok.adet} adet var!`);
        } else {
          setStockWarning('');
        }
      }
    }
  }, [birimAdedi, selectedStockId, stoklar]);

  const handleIkinciModalSubmit = () => {
    const parsedBirimAdedi = parseInt(birimAdedi, 10) || 1;
    const parsedBirimFiyati = parseFloat(birimFiyati) || 0;

    if (!parcaAdi) {
      alert("Lütfen tüm alanları doğru bir şekilde doldurun.");
      return;
    }

    // Stok yetersizse uyarı göster ama devam et
    if (selectedStockId) {
      const stok = stoklar.find(s => s.id === selectedStockId);
      if (stok && stok.adet < parsedBirimAdedi) {
        const devam = confirm(`Uyarı: Stokta sadece ${stok.adet} adet var. Yine de devam etmek istiyor musunuz?`);
        if (!devam) return;
      }
    }

    const ikinciModalBilgiler = {
      birimAdedi: parsedBirimAdedi,
      parcaAdi,
      birimFiyati: parsedBirimFiyati,
      toplamFiyat: parsedBirimAdedi * parsedBirimFiyati,
      stockId: selectedStockId || null, // Stoktan seçildiyse stockId ekle
      isFromStock: !!selectedStockId, // Flag: stoktan mı seçildi
    };
    onYapilanlarEkle(ikinciModalBilgiler);
    setBirimAdedi('');
    setParcaAdi('');
    setBirimFiyati('');
    setSelectedStockId(null);
    setStokArama('');
    setStockWarning('');
  };

  const handleSubmit = async () => {
    try {
      const yeniKart = {
        ...ilkModalBilgi,
        yapilanlar: localYapilanlar
      };
      await onKartEkle(yeniKart);
    } catch (error) {
      console.error('Kart eklenirken hata oluştu:', error);
      alert('Kart eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleTeklifEkle = async () => {
    try {
      const yeniTeklif = {
        ...ilkModalBilgi,
        yapilanlar: localYapilanlar
      };
      await onTeklifEkle(yeniTeklif);
    } catch (error) {
      console.error('Teklif eklenirken hata oluştu:', error);
      alert('Teklif eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleClearItems = () => {
    setLocalYapilanlar([]);
    onYapilanlarSil();
  };

  const handleCloseAndClear = () => {
    onClose();
  };

  const handleRemoveItem = (index) => {
    const yeniYapilanlar = localYapilanlar.filter((_, i) => i !== index);
    setLocalYapilanlar(yeniYapilanlar);
    onYapilanlarSil_index(index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center backdrop-blur-sm">
      <div className="dark-card-bg neumorphic-card rounded-3xl max-w-4xl w-full mx-4 md:mx-0">
        <div className="flex justify-between items-center p-5 border-b dark-border">
          <h3 className="text-xl font-medium dark-text-primary">Kart Ekle - Aşama 2</h3>
          <button onClick={handleCloseAndClear} className="dark-text-muted hover:dark-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="number"
              id="birimAdedi"
              value={birimAdedi}
              onChange={(e) => setBirimAdedi(e.target.value)}
              placeholder="Birim Adedi"
              className="neumorphic-input p-2 rounded-md dark-text-primary font-medium"
            />
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                id="parcaAdi"
                value={parcaAdi}
                onChange={(e) => {
                  setParcaAdi(e.target.value);
                  setSelectedStockId(null);
                  setStockWarning('');
                  setStokArama('');
                }}
                placeholder="Parça Adı"
                className="neumorphic-input p-2 rounded-md dark-text-primary font-medium w-full"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStokArama('');
                    setStokDropdownOpen(!stokDropdownOpen);
                  }}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                  title="Stoktan Seç"
                >
                  📦
                </button>
                {selectedStockId && (
                  <button
                    type="button"
                    onClick={() => {
                      setStokArama('');
                      setParcaAdi('');
                      setSelectedStockId(null);
                      setStockWarning('');
                    }}
                    className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                    title="Temizle"
                  >
                    ✕
                  </button>
                )}
              </div>
              {stokDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark-card-bg border dark-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 border-b dark-border">
                    <input
                      ref={stokInputRef}
                      type="text"
                      value={stokArama}
                      onChange={(e) => {
                        setStokArama(e.target.value);
                        setSelectedStockId(null);
                        setStockWarning('');
                      }}
                      placeholder="Stok ara..."
                      className="neumorphic-input p-2 rounded-md dark-text-primary font-medium w-full text-sm"
                      autoFocus
                    />
                  </div>
                  {filtrelenmisStoklar.length > 0 ? (
                    filtrelenmisStoklar.map((stok) => (
                      <div
                        key={stok.id}
                        onClick={() => handleStokSec(stok)}
                        className="px-4 py-2 hover:dark-bg-tertiary cursor-pointer border-b dark-border last:border-b-0"
                      >
                        <div className="flex justify-between items-center">
                          <span className="dark-text-primary font-medium">{stok.stokAdi}</span>
                          <span className={`text-xs ${stok.adet > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            Stok: {stok.adet}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-center dark-text-muted text-sm">
                      Stok bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
            <input
              type="number"
              id="birimFiyati"
              value={birimFiyati}
              onChange={(e) => setBirimFiyati(e.target.value)}
              placeholder="Birim Fiyatı"
              className="neumorphic-input p-2 rounded-md dark-text-primary font-medium"
            />
          </div>
          {stockWarning && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-sm text-yellow-400">{stockWarning}</p>
            </div>
          )}

          <div className="flex justify-end mb-4">
            <button onClick={handleIkinciModalSubmit} className="bg-yellow-500 text-white font-semibold text-md rounded-full p-2 px-6 w-full md:w-auto neumorphic-inset">
              Ekle
            </button>
          </div>
          <div className="overflow-x-auto mt-6 max-h-48 overflow-y-auto">
            <table className="min-w-full text-sm divide-y dark-border">
              <thead className="dark-bg-tertiary neumorphic-inset">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Birim Adedi</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Parça Adı</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Birim Fiyatı</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider">Toplam Fiyat</th>
                  <th className="px-4 md:px-6 py-3">
                    <button onClick={handleClearItems} className="bg-red-500 text-white font-semibold text-md rounded-full p-2 px-4 w-full md:w-auto neumorphic-inset">
                      Tümünü Sil
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="dark-card-bg divide-y dark-border">
                {localYapilanlar.map((asd, index) => (
                  <tr key={index} className="hover:dark-bg-tertiary transition-colors">
                    <td className="px-4 md:px-6 py-1 dark-text-primary whitespace-nowrap">{asd.birimAdedi}</td>
                    <td className="px-4 md:px-6 py-1 dark-text-primary whitespace-nowrap">
                      {asd.parcaAdi}
                      {asd.isFromStock && (
                        <span className="ml-2 text-xs text-blue-400" title="Stoktan seçildi">📦</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-1 dark-text-primary whitespace-nowrap">{asd.birimFiyati}</td>
                    <td className="px-4 md:px-6 py-1 dark-text-primary whitespace-nowrap">{asd.toplamFiyat}</td>
                    <td className="px-4 md:px-6 py-1 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-300">
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
          <div className="flex flex-col md:flex-row justify-end mt-8 gap-4">
            <button onClick={onIkinciModalClose} className="dark-bg-tertiary dark-text-primary font-semibold text-md rounded-full p-2 px-6 w-full md:w-auto neumorphic-inset">
              Geri Dön
            </button>
            <button onClick={handleTeklifEkle} className="bg-gray-600 text-white font-semibold text-md rounded-full p-2 px-4 w-full md:w-auto neumorphic-inset">
              Teklif Olarak Kaydet
            </button>
            <button onClick={handleSubmit} className="bg-blue-500 text-white font-semibold text-md rounded-full p-2 px-8 w-full md:w-auto neumorphic-inset">
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IkinciModal;
