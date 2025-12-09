import React, { useState, useEffect } from 'react';

const IkinciModal = ({ onIkinciModalClose, ilkModalBilgi, onClose, onKartEkle, onTeklifEkle, yapilanlar, onYapilanlarEkle, onYapilanlarSil, onYapilanlarSil_index }) => {
  const [birimAdedi, setBirimAdedi] = useState('');
  const [parcaAdi, setParcaAdi] = useState('');
  const [birimFiyati, setBirimFiyati] = useState('');
  const [localYapilanlar, setLocalYapilanlar] = useState([]);

  useEffect(() => {
    setLocalYapilanlar(yapilanlar);
  }, [yapilanlar]);

  const handleIkinciModalSubmit = () => {
    const parsedBirimAdedi = parseInt(birimAdedi, 10) || 1;
    const parsedBirimFiyati = parseFloat(birimFiyati) || 0;

    if (!parcaAdi ) {
      alert("Lütfen tüm alanları doğru bir şekilde doldurun.");
      return;
    }

    const ikinciModalBilgiler = {
      birimAdedi: parsedBirimAdedi,
      parcaAdi,
      birimFiyati: parsedBirimFiyati,
      toplamFiyat: parsedBirimAdedi * parsedBirimFiyati,
    };
    onYapilanlarEkle(ikinciModalBilgiler);
    setBirimAdedi('');
    setParcaAdi('');
    setBirimFiyati('');
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
            <input
              type="text"
              id="parcaAdi"
              value={parcaAdi}
              onChange={(e) => setParcaAdi(e.target.value)}
              placeholder="Parça Adı"
              className="neumorphic-input p-2 rounded-md dark-text-primary font-medium"
            />
            <input
              type="number"
              id="birimFiyati"
              value={birimFiyati}
              onChange={(e) => setBirimFiyati(e.target.value)}
              placeholder="Birim Fiyatı"
              className="neumorphic-input p-2 rounded-md dark-text-primary font-medium"
            />
          </div>

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
                    <td className="px-4 md:px-6 py-1 dark-text-primary whitespace-nowrap">{asd.parcaAdi}</td>
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
