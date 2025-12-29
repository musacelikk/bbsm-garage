import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const CurrencyContext = createContext();

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }) {
  const [rates, setRates] = useState({
    usd: null,
    eur: null,
    altin: null
  });
  
  const [previousRates, setPreviousRates] = useState({ usd: null, eur: null, altin: null });
  const prevRatesRef = useRef({ usd: null, eur: null, altin: null });
  const [loading, setLoading] = useState(true);
  const isFirstLoadRef = useRef(true);

  // localStorage'dan önceki değerleri yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreviousRates = localStorage.getItem('currency_previous_rates');
      if (savedPreviousRates) {
        try {
          const parsed = JSON.parse(savedPreviousRates);
          prevRatesRef.current = {
            usd: parsed.usd || null,
            eur: parsed.eur || null,
            altin: parsed.altin || null
          };
          setPreviousRates(prevRatesRef.current);
        } catch (e) {
          console.error('localStorage currency_previous_rates parse hatası:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        let usdTry = null;
        let eurTry = null;
        let altinFiyat = null;

        // exchangerate-api.com - Ücretsiz, günlük 1,500 istek limiti
        try {
          // USD/TRY oranı
          const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          if (usdResponse.ok) {
            const usdData = await usdResponse.json();
            usdTry = usdData.rates?.TRY || null;
          }
          
          // EUR/TRY oranı
          const eurResponse = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
          if (eurResponse.ok) {
            const eurData = await eurResponse.json();
            eurTry = eurData.rates?.TRY || null;
          }

          // Altın fiyatı için GenelPara API
          try {
            const altinResponse = await fetch('https://api.genelpara.com/embed/altin.json');
            if (altinResponse.ok) {
            const altinData = await altinResponse.json();
            altinFiyat = altinData?.gram_altin?.satis ? parseFloat(altinData.gram_altin.satis.replace(',', '.')) : null;
            }
          } catch (altinError) {
            // Altın API çalışmazsa yaklaşık hesaplama
            altinFiyat = usdTry ? (usdTry * 75) : null;
          }
          
        } catch (error) {
          console.error('Döviz kuru API hatası:', error);
          // Hata durumunda sessizce devam et, fallback değerler kullanılacak
        }

        // Yeni değerleri hazırla
        const newRates = {
          usd: usdTry ? parseFloat(usdTry).toFixed(2) : null,
          eur: eurTry ? parseFloat(eurTry).toFixed(2) : null,
          altin: altinFiyat ? parseFloat(altinFiyat).toFixed(0) : null
        };

        // Yeni değerleri set et
        setRates(newRates);
        setLoading(false);
      } catch (error) {
        console.error('Döviz kuru yüklenirken hata:', error);
        // Hata durumunda fallback değerler
        setRates({
          usd: '32.48',
          eur: '35.12',
          altin: '2456'
        });
        setLoading(false);
      }
    };

    // İlk yüklemede hemen çek
    fetchRates();
    
    // Her 5 dakikada bir güncelle (rate limit'i önlemek için)
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []); // Sadece component mount olduğunda çalış

  // rates değiştiğinde previousRates'i güncelle
  useEffect(() => {
    // İlk yüklemede, eğer previousRates yoksa mevcut değerleri previous olarak kaydet
    if (isFirstLoadRef.current) {
      if (rates.usd || rates.eur || rates.altin) {
        // Eğer localStorage'dan previousRates yüklenmediyse, mevcut değerleri previous olarak kaydet
        if (!prevRatesRef.current.usd && !prevRatesRef.current.eur && !prevRatesRef.current.altin) {
          prevRatesRef.current = {
            usd: rates.usd || null,
            eur: rates.eur || null,
            altin: rates.altin || null
          };
          // localStorage'a kaydet
          if (typeof window !== 'undefined') {
            localStorage.setItem('currency_previous_rates', JSON.stringify(prevRatesRef.current));
          }
        } else {
          // localStorage'dan yüklenen previousRates varsa, state'e de set et
          setPreviousRates(prevRatesRef.current);
        }
        isFirstLoadRef.current = false;
      }
      return;
    }
    
    // İkinci ve sonraki güncellemelerde karşılaştırma yap
    // Değerler değiştiyse previousRates'i güncelle
    if (rates.usd || rates.eur || rates.altin) {
      // Önceki değerlerle karşılaştır
      const hasChanged = (
        prevRatesRef.current.usd !== rates.usd || 
        prevRatesRef.current.eur !== rates.eur || 
        prevRatesRef.current.altin !== rates.altin
      );
      
      if (hasChanged) {
        // Önceki değerleri state'e kaydet (re-render tetikler)
        const previousToSave = {
          usd: prevRatesRef.current.usd,
          eur: prevRatesRef.current.eur,
          altin: prevRatesRef.current.altin
        };
        
        setPreviousRates(prev => {
          // Sadece gerçekten değiştiyse güncelle
          if (prev.usd !== previousToSave.usd || 
              prev.eur !== previousToSave.eur || 
              prev.altin !== previousToSave.altin) {
            return previousToSave;
          }
          return prev;
        });
        
        // Ref'i yeni değerlerle güncelle
        const newPrevRates = {
          usd: rates.usd || prevRatesRef.current.usd,
          eur: rates.eur || prevRatesRef.current.eur,
          altin: rates.altin || prevRatesRef.current.altin
        };
        prevRatesRef.current = newPrevRates;
        
        // localStorage'a kaydet
        if (typeof window !== 'undefined') {
          localStorage.setItem('currency_previous_rates', JSON.stringify(newPrevRates));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates.usd, rates.eur, rates.altin]);

  // Context value'yu memoize et
  const contextValue = useMemo(() => ({
    rates,
    previousRates,
    loading
  }), [rates, previousRates, loading]);

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}
