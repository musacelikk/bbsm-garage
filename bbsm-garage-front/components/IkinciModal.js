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

  const handleSubmit = () => {
    const yeniKart = {
      ...ilkModalBilgi,
      yapilanlar: localYapilanlar
    };
    onKartEkle(yeniKart);
  };

  const handleTeklifEkle = () => {
    const yeniTeklif = {
      ...ilkModalBilgi,
      yapilanlar: localYapilanlar
    };
    onTeklifEkle(yeniTeklif);
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center backdrop-blur-sm backdrop-brightness-30">
      <div className="bg-white rounded-3xl max-w-4xl w-full mx-4 md:mx-0">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-900">Kart Ekle - Aşama 2</h3>
          <button onClick={handleCloseAndClear}>
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
              className="border p-2 rounded-md text-gray-600 font-medium bg-my-beyaz"
            />
            <input
              type="text"
              id="parcaAdi"
              value={parcaAdi}
              onChange={(e) => setParcaAdi(e.target.value)}
              placeholder="Parça Adı"
              className="border p-2 rounded-md text-gray-600 font-medium bg-my-beyaz"
            />
            <input
              type="number"
              id="birimFiyati"
              value={birimFiyati}
              onChange={(e) => setBirimFiyati(e.target.value)}
              placeholder="Birim Fiyatı"
              className="border p-2 rounded-md text-gray-600 font-medium bg-my-beyaz"
            />
          </div>

          <div className="flex justify-end mb-4">
            <button onClick={handleIkinciModalSubmit} className="bg-yellow-500 text-white font-semibold text-md rounded-full p-2 px-6 w-full md:w-auto">
              Ekle
            </button>
          </div>
          <div className="overflow-x-auto mt-6 max-h-48 overflow-y-auto">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Birim Adedi</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">Parça Adı</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Birim Fiyatı</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">Toplam Fiyat</th>
                  <th className="px-4 md:px-6 py-3">
                    <button onClick={handleClearItems} className="bg-red-500 text-white font-semibold text-md rounded-full p-2 px-4 w-full md:w-auto">
                      Tümünü Sil
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {localYapilanlar.map((asd, index) => (
                  <tr key={index}>
                    <td className="px-4 md:px-6 py-1 text-gray-700 whitespace-nowrap">{asd.birimAdedi}</td>
                    <td className="px-4 md:px-6 py-1 text-gray-700 whitespace-nowrap">{asd.parcaAdi}</td>
                    <td className="px-4 md:px-6 py-1 text-gray-700 whitespace-nowrap">{asd.birimFiyati}</td>
                    <td className="px-4 md:px-6 py-1 text-gray-700 whitespace-nowrap">{asd.toplamFiyat}</td>
                    <td className="px-4 md:px-6 py-1 text-gray-700 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
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
            <button onClick={onIkinciModalClose} className="bg-gray-200 text-my-siyah font-semibold text-md rounded-full p-2 px-6 w-full md:w-auto">
              Geri Dön
            </button>
            <button onClick={handleTeklifEkle} className="bg-my-siyah text-white font-semibold text-md rounded-full p-2 px-4 w-full md:w-auto">
              Teklif Olarak Kaydet
            </button>
            <button onClick={handleSubmit} className="bg-my-mavi text-white font-semibold text-md rounded-full p-2 px-8 w-full md:w-auto">
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IkinciModal;
