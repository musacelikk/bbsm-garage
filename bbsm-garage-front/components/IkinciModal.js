import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const IkinciModal = ({ onIkinciModalClose, ilkModalBilgi, onClose, onKartEkle, onTeklifEkle, yapilanlar, onYapilanlarEkle, onYapilanlarSil, onYapilanlarSil_index, fetchWithAuth, API_URL }) => {
  const { activeTheme } = useTheme();
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
  const cellRefs = useRef({});

  useEffect(() => {
    setLocalYapilanlar(yapilanlar);
  }, [yapilanlar]);

  // ContentEditable hücrelerinin içeriğini state ile senkronize et
  useEffect(() => {
    localYapilanlar.forEach((item, index) => {
      const birimAdediEl = cellRefs.current[`${index}-birimAdedi`];
      const parcaAdiEl = cellRefs.current[`${index}-parcaAdi`];
      const birimFiyatiEl = cellRefs.current[`${index}-birimFiyati`];
      
      if (birimAdediEl && birimAdediEl.textContent !== String(item.birimAdedi ?? '')) {
        birimAdediEl.textContent = item.birimAdedi ?? '';
      }
      if (parcaAdiEl && parcaAdiEl.textContent !== String(item.parcaAdi ?? '')) {
        parcaAdiEl.textContent = item.parcaAdi ?? '';
      }
      if (birimFiyatiEl && birimFiyatiEl.textContent !== String(item.birimFiyati ?? '')) {
        birimFiyatiEl.textContent = item.birimFiyati ?? '';
      }
    });
  }, [localYapilanlar]);

  // Yeni ekleme satırı için state senkronizasyonu
  useEffect(() => {
    const birimAdediEl = cellRefs.current[`${localYapilanlar.length}-birimAdedi`];
    const parcaAdiEl = cellRefs.current[`${localYapilanlar.length}-parcaAdi`];
    const birimFiyatiEl = cellRefs.current[`${localYapilanlar.length}-birimFiyati`];
    
    if (birimAdediEl && birimAdediEl.textContent !== birimAdedi) {
      birimAdediEl.textContent = birimAdedi;
    }
    if (parcaAdiEl && parcaAdiEl.textContent !== parcaAdi) {
      parcaAdiEl.textContent = parcaAdi;
    }
    if (birimFiyatiEl && birimFiyatiEl.textContent !== birimFiyati) {
      birimFiyatiEl.textContent = birimFiyati;
    }
  }, [birimAdedi, parcaAdi, birimFiyati, localYapilanlar.length]);

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
    
    // ContentEditable hücresini güncelle
    const parcaAdiEl = cellRefs.current[`${localYapilanlar.length}-parcaAdi`];
    if (parcaAdiEl) {
      parcaAdiEl.textContent = stok.stokAdi;
    }
    
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

  const fieldsOrder = ['birimAdedi', 'parcaAdi', 'birimFiyati'];

  const focusCell = (rowIndex, field) => {
    const key = `${rowIndex}-${field}`;
    const el = cellRefs.current[key];
    if (el) {
      el.focus();
      // ContentEditable için text seçimi
      if (window.getSelection && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const handleArrowNavigation = (e, rowIndex, field) => {
    const lastRowIndex = localYapilanlar.length; // mevcut satırlar + ekleme satırı
    const fieldIndex = fieldsOrder.indexOf(field);
    if (fieldIndex === -1) return;

    let targetRow = rowIndex;
    let targetFieldIndex = fieldIndex;

    switch (e.key) {
      case 'ArrowRight':
        targetFieldIndex = fieldIndex + 1;
        if (targetFieldIndex >= fieldsOrder.length) {
          targetFieldIndex = 0;
          targetRow = Math.min(rowIndex + 1, lastRowIndex);
        }
        break;
      case 'ArrowLeft':
        targetFieldIndex = fieldIndex - 1;
        if (targetFieldIndex < 0) {
          targetFieldIndex = fieldsOrder.length - 1;
          targetRow = Math.max(rowIndex - 1, 0);
        }
        break;
      case 'ArrowDown':
        targetRow = Math.min(rowIndex + 1, lastRowIndex);
        break;
      case 'ArrowUp':
        targetRow = Math.max(rowIndex - 1, 0);
        break;
      default:
        return;
    }

    e.preventDefault();
    focusCell(targetRow, fieldsOrder[targetFieldIndex]);
  };

  const handleIkinciModalSubmit = (shouldFocusNext = false, overrideValues = {}) => {
    // Override değerleri varsa onları kullan, yoksa state'lerden al
    const currentBirimAdedi = overrideValues.birimAdedi !== undefined ? overrideValues.birimAdedi : birimAdedi;
    const currentParcaAdi = overrideValues.parcaAdi !== undefined ? overrideValues.parcaAdi : parcaAdi;
    const currentBirimFiyati = overrideValues.birimFiyati !== undefined ? overrideValues.birimFiyati : birimFiyati;
    
    const parsedBirimAdedi = parseInt(currentBirimAdedi, 10) || 1;
    const parsedBirimFiyati = parseFloat(currentBirimFiyati) || 0;

    if (!currentParcaAdi) {
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
      parcaAdi: currentParcaAdi,
      birimFiyati: parsedBirimFiyati,
      toplamFiyat: parsedBirimAdedi * parsedBirimFiyati,
      stockId: selectedStockId || null, // Stoktan seçildiyse stockId ekle
      isFromStock: !!selectedStockId, // Flag: stoktan mı seçildi
    };
    
    // Yeni satırın index'ini kaydet (state güncellenmeden önce)
    const newRowIndex = localYapilanlar.length;
    
    onYapilanlarEkle(ikinciModalBilgiler);

    setBirimAdedi('');
    setParcaAdi('');
    setBirimFiyati('');
    setSelectedStockId(null);
    setStokArama('');
    setStockWarning('');

    // Eğer Enter ile çağrıldıysa yeni satıra odaklan
    if (shouldFocusNext) {
      setTimeout(() => {
        // State güncellendikten sonra yeni satıra odaklan
        focusCell(newRowIndex, 'birimAdedi');
      }, 150);
    }
  };

  const handleSubmit = async () => {
    // Yapılanlar listesi boşsa uyarı ver
    if (!localYapilanlar || localYapilanlar.length === 0) {
      alert('İşlem giriniz! Lütfen en az bir işlem ekleyin.');
      return;
    }
    
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
    // Yapılanlar listesi boşsa uyarı ver
    if (!localYapilanlar || localYapilanlar.length === 0) {
      alert('İşlem giriniz! Lütfen en az bir işlem ekleyin.');
      return;
    }
    
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

  const handleExistingChange = (index, field, value) => {
    const updated = [...localYapilanlar];
    const item = { ...updated[index] };
    
    // Number alanlar için validation
    if (field === 'birimAdedi' || field === 'birimFiyati') {
      const numValue = field === 'birimAdedi' ? parseInt(value, 10) : parseFloat(value);
      // Negatif değerleri engelle
      if (!isNaN(numValue) && numValue < 0) {
        item[field] = '';
      } else {
        item[field] = isNaN(numValue) ? '' : numValue;
      }
    } else {
    item[field] = value;
    }

    // Parça adı manuel değişirse stok bilgisini sıfırla
    if (field === 'parcaAdi') {
      item.stockId = null;
      item.isFromStock = false;
    }

    // Toplam fiyatı güncelle
    const adet = parseInt(item.birimAdedi, 10) || 0;
    const fiyat = parseFloat(item.birimFiyati) || 0;
    item.toplamFiyat = adet * fiyat;

    updated[index] = item;
    setLocalYapilanlar(updated);
  };

  const handleCellBlur = (index, field, e) => {
    const value = e.target.textContent.trim();
    handleExistingChange(index, field, value);
  };

  const handleCellKeyDown = (e, index, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Önce mevcut değeri kaydet
      const value = e.target.textContent.trim();
      handleExistingChange(index, field, value);
      // Sonra bir sonraki hücreye geç
      setTimeout(() => {
        const currentFieldIndex = fieldsOrder.indexOf(field);
        if (currentFieldIndex < fieldsOrder.length - 1) {
          focusCell(index, fieldsOrder[currentFieldIndex + 1]);
        } else if (index < localYapilanlar.length - 1) {
          focusCell(index + 1, fieldsOrder[0]);
        }
      }, 0);
    } else if (e.key === 'Escape') {
      e.target.blur();
    } else {
      handleArrowNavigation(e, index, field);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center backdrop-blur-sm">
      <div className="dark-card-bg neumorphic-card rounded-3xl max-w-4xl w-full mx-4 md:mx-0">
        <div className="flex justify-between items-center p-5 border-b dark-border">
          <h3 className="text-xl font-medium dark-text-primary">Kart Ekle - Aşama 2</h3>
          <div className="flex items-center gap-3">
            {localYapilanlar.length > 0 && (
              <button onClick={handleClearItems} className="text-red-400 hover:text-red-300 text-sm font-medium">
                Tümünü Sil
              </button>
            )}
            <button onClick={handleCloseAndClear} className="dark-text-muted hover:dark-text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        <div className="p-4 md:p-8">
          <div className="overflow-x-auto border dark-border rounded-lg">
            <table className="min-w-full text-sm border-collapse">
              <thead className="dark-bg-tertiary neumorphic-inset sticky top-0 z-10">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider w-1/6 border dark-border border-r">Adet</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider w-3/6 border dark-border border-r">Parça Adı</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider w-1/6 border dark-border border-r">Birim ₺</th>
                  <th className="px-4 md:px-6 py-3 text-left font-medium dark-text-primary uppercase tracking-wider w-1/6 border dark-border border-r">Toplam ₺</th>
                  <th className="px-4 md:px-6 py-3 text-center font-medium dark-text-primary uppercase tracking-wider w-1/12 border dark-border">✕</th>
                </tr>
              </thead>
              <tbody className="dark-card-bg">
                {localYapilanlar.map((asd, index) => (
                  <tr
                    key={index}
                    className="hover:dark-bg-tertiary/60 transition-colors border-b dark-border"
                  >
                    <td 
                      className="px-4 md:px-6 py-2 whitespace-nowrap border-r dark-border dark-text-primary font-medium text-center cursor-text"
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        // Sadece sayı karakterlerine izin ver
                        const value = e.target.textContent.replace(/[^0-9]/g, '');
                        e.target.textContent = value;
                      }}
                      onBlur={(e) => handleCellBlur(index, 'birimAdedi', e)}
                      onKeyDown={(e) => {
                        // Eksi, artı ve e karakterlerini engelle
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                          return;
                        }
                        handleCellKeyDown(e, index, 'birimAdedi');
                      }}
                        ref={(el) => { cellRefs.current[`${index}-birimAdedi`] = el; }}
                    >
                      {asd.birimAdedi ?? ''}
                    </td>
                    <td className="px-4 md:px-6 py-2 whitespace-nowrap border-r dark-border">
                      <div className="flex items-center gap-2">
                        <div
                          className="dark-text-primary font-medium flex-1 cursor-text"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleCellBlur(index, 'parcaAdi', e)}
                          onKeyDown={(e) => handleCellKeyDown(e, index, 'parcaAdi')}
                          ref={(el) => { cellRefs.current[`${index}-parcaAdi`] = el; }}
                        >
                          {asd.parcaAdi ?? ''}
                        </div>
                        {asd.isFromStock && (
                          <img 
                            src="/images/envanterikon.png" 
                            alt="Stoktan seçildi" 
                            className="w-4 h-4 ml-1" 
                            title="Stoktan seçildi"
                          />
                        )}
                      </div>
                    </td>
                    <td 
                      className="px-4 md:px-6 py-2 whitespace-nowrap border-r dark-border dark-text-primary font-medium text-center cursor-text"
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => {
                        // Sadece sayı ve nokta karakterlerine izin ver (ondalık için)
                        const value = e.target.textContent.replace(/[^0-9.]/g, '');
                        // Birden fazla nokta olmasını engelle
                        const parts = value.split('.');
                        const filteredValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                        e.target.textContent = filteredValue;
                      }}
                      onBlur={(e) => handleCellBlur(index, 'birimFiyati', e)}
                      onKeyDown={(e) => {
                        // Eksi ve artı karakterlerini engelle
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                          return;
                        }
                        handleCellKeyDown(e, index, 'birimFiyati');
                      }}
                        ref={(el) => { cellRefs.current[`${index}-birimFiyati`] = el; }}
                    >
                      {asd.birimFiyati ?? ''}
                    </td>
                    <td className="px-4 md:px-6 py-2 whitespace-nowrap dark-text-secondary font-medium border-r dark-border text-center">
                      {asd.toplamFiyat || 0}
                    </td>
                    <td className="px-4 md:px-6 py-2 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-300 dark-text-primary"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="hover:dark-bg-tertiary/60 transition-colors border-b dark-border">
                  <td 
                    className="px-4 md:px-6 py-2 whitespace-nowrap border-r dark-border dark-text-primary font-medium text-center cursor-text"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      // Sadece sayı karakterlerine izin ver
                      const value = e.target.textContent.replace(/[^0-9]/g, '');
                      e.target.textContent = value;
                      setBirimAdedi(value);
                    }}
                    onBlur={(e) => {
                      const value = e.target.textContent.trim();
                      setBirimAdedi(value);
                    }}
                    onKeyDown={(e) => {
                      // Eksi, artı ve e karakterlerini engelle
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Önce değeri kaydet
                        const value = e.target.textContent.trim();
                        setBirimAdedi(value);
                        // Sonra bir sonraki hücreye geç
                        setTimeout(() => {
                          focusCell(localYapilanlar.length, 'parcaAdi');
                        }, 0);
                      } else {
                        handleArrowNavigation(e, localYapilanlar.length, 'birimAdedi');
                      }
                    }}
                      ref={(el) => { cellRefs.current[`${localYapilanlar.length}-birimAdedi`] = el; }}
                  >
                    {birimAdedi}
                  </td>
                  <td className="px-4 md:px-6 py-2 whitespace-nowrap relative border-r dark-border">
                    <div className="flex items-center">
                      <div
                        className="dark-text-primary font-medium flex-1 cursor-text"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const value = e.target.textContent.trim();
                          setParcaAdi(value);
                          if (value !== parcaAdi) {
                            setSelectedStockId(null);
                            setStockWarning('');
                            setStokArama('');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Önce değeri kaydet
                            const value = e.target.textContent.trim();
                            setParcaAdi(value);
                            if (value !== parcaAdi) {
                          setSelectedStockId(null);
                          setStockWarning('');
                          setStokArama('');
                            }
                            // Sonra bir sonraki hücreye geç
                            setTimeout(() => {
                              focusCell(localYapilanlar.length, 'birimFiyati');
                            }, 0);
                          } else {
                            handleArrowNavigation(e, localYapilanlar.length, 'parcaAdi');
                          }
                        }}
                        ref={(el) => { cellRefs.current[`${localYapilanlar.length}-parcaAdi`] = el; }}
                      >
                        {parcaAdi}
                      </div>
                      <div className="ml-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setStokArama('');
                            setStokDropdownOpen(!stokDropdownOpen);
                          }}
                          className={`px-1 py-0.5 bg-blue-500 rounded text-xs hover:bg-blue-600 flex items-center justify-center ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                          title="Stoktan Seç"
                        >
                          <img 
                            src="/images/envanterikon.png" 
                            alt="Envanter" 
                            className="w-3 h-3"
                          />
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
                            className={`px-1 py-0.5 bg-gray-500 rounded text-xs hover:bg-gray-600 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                            title="Temizle"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td 
                    className="px-4 md:px-6 py-2 whitespace-nowrap border-r dark-border dark-text-primary font-medium text-center cursor-text"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      // Sadece sayı ve nokta karakterlerine izin ver (ondalık için)
                      const value = e.target.textContent.replace(/[^0-9.]/g, '');
                      // Birden fazla nokta olmasını engelle
                      const parts = value.split('.');
                      const filteredValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                      e.target.textContent = filteredValue;
                      setBirimFiyati(filteredValue);
                    }}
                    onBlur={(e) => {
                      const value = e.target.textContent.trim();
                      setBirimFiyati(value);
                    }}
                      onKeyDown={(e) => {
                        // Eksi ve artı karakterlerini engelle
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        // Önce mevcut değeri kaydet
                        const value = e.target.textContent.trim();
                        setBirimFiyati(value);
                        
                        // Eğer tüm alanlar doluysa satırı ekle ve yeni satıra geç
                        const currentBirimAdedi = birimAdedi || '';
                        const currentParcaAdi = parcaAdi || '';
                        const currentBirimFiyati = value || '';
                        
                        if (currentBirimAdedi && currentParcaAdi && currentBirimFiyati) {
                          // Güncel değerleri override olarak geç
                          handleIkinciModalSubmit(true, {
                            birimAdedi: currentBirimAdedi,
                            parcaAdi: currentParcaAdi,
                            birimFiyati: currentBirimFiyati
                          });
                        } else {
                          // Eksik alan varsa sadece blur yap
                          e.target.blur();
                        }
                        return;
                        }
                        handleArrowNavigation(e, localYapilanlar.length, 'birimFiyati');
                      }}
                      ref={(el) => { cellRefs.current[`${localYapilanlar.length}-birimFiyati`] = el; }}
                  >
                    {birimFiyati}
                  </td>
                  <td className="px-4 md:px-6 py-2 whitespace-nowrap dark-text-secondary font-medium text-center border-r dark-border">
                    {(parseFloat(birimFiyati) || 0) * (parseInt(birimAdedi) || 0)}
                  </td>
                  <td className="px-4 md:px-6 py-2 whitespace-nowrap text-center text-sm font-medium">
                    <button onClick={handleIkinciModalSubmit} className="text-green-400 hover:text-green-300 dark-text-primary" title="Ekle">
                      ✓
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end mt-4">
            <span className="text-sm md:text-base dark-text-secondary">
              Toplam Tutar:{' '}
              <span className="font-semibold dark-text-primary">
                {localYapilanlar.reduce(
                  (sum, item) => sum + (Number(item.toplamFiyat) || 0),
                  0
                )}{' '}
                ₺
              </span>
            </span>
          </div>

          {stockWarning && (
            <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-sm text-yellow-400">{stockWarning}</p>
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-end mt-8 gap-4">
            <button onClick={onIkinciModalClose} className="dark-bg-tertiary dark-text-primary font-semibold text-md rounded-full p-2 px-6 w-full md:w-auto neumorphic-inset">
              Geri Dön
            </button>
            <button onClick={handleTeklifEkle} className={`bg-gray-600 font-semibold text-md rounded-full p-2 px-4 w-full md:w-auto neumorphic-inset ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>
              Teklif Olarak Kaydet
            </button>
            <button onClick={handleSubmit} className={`bg-blue-500 font-semibold text-md rounded-full p-2 px-8 w-full md:w-auto neumorphic-inset ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}>
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {stokDropdownOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1100]">
          <div
            ref={dropdownRef}
            className="dark-card-bg neumorphic-card rounded-3xl max-w-lg w-full mx-4 p-4 md:p-6 border dark-border"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold dark-text-primary">Envanterden Seç</h4>
              <button
                onClick={() => setStokDropdownOpen(false)}
                className="dark-text-muted hover:dark-text-primary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-3">
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
            <div className="max-h-64 overflow-y-auto border dark-border rounded-lg">
              {filtrelenmisStoklar.length > 0 ? (
                filtrelenmisStoklar.map((stok) => (
                  <button
                    key={stok.id}
                    type="button"
                    onClick={() => handleStokSec(stok)}
                    className="w-full text-left px-4 py-2 hover:dark-bg-tertiary cursor-pointer border-b dark-border last:border-b-0 flex justify-between items-center"
                  >
                    <span className="dark-text-primary font-medium">{stok.stokAdi}</span>
                    <span className={`text-xs ${stok.adet > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Stok: {stok.adet}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center dark-text-muted text-sm">
                  Stok bulunamadı
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IkinciModal;
