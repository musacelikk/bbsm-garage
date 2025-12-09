import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // CurrencyAPI - Güncel döviz kurları
        // API Key: Environment variable'dan alınıyor
        const API_KEY = process.env.NEXT_PUBLIC_CURRENCY_API_KEY || 'cur_live_NIwaks8n6WtngNQmDqmAWS563AhxcQY8oPGNOfxx';
        
        let usdTry = null;
        let eurTry = null;
        let altinFiyat = null;

        try {
          // CurrencyAPI'den USD bazlı TRY kurlarını çek
          const currencyResponse = await fetch(
            `https://api.currencyapi.com/v3/latest?base_currency=USD&currencies=TRY,EUR`,
            {
              headers: {
                'apikey': API_KEY
              }
            }
          );
          
          if (!currencyResponse.ok) {
            throw new Error('CurrencyAPI yanıt vermedi');
          }
          
          const currencyData = await currencyResponse.json();
          
          // USD/TRY oranı
          usdTry = currencyData?.data?.TRY?.value || null;
          
          // EUR/TRY için ayrı bir istek gerekebilir veya USD/EUR oranından hesaplanabilir
          // EUR bazlı TRY çek
          const eurResponse = await fetch(
            `https://api.currencyapi.com/v3/latest?base_currency=EUR&currencies=TRY`,
            {
              headers: {
                'apikey': API_KEY
              }
            }
          );
          
          if (eurResponse.ok) {
            const eurData = await eurResponse.json();
            eurTry = eurData?.data?.TRY?.value || null;
          }

          // Altın fiyatı için GenelPara API (CurrencyAPI altın vermiyor)
          try {
            const altinResponse = await fetch('https://api.genelpara.com/embed/altin.json');
            const altinData = await altinResponse.json();
            altinFiyat = altinData?.gram_altin?.satis ? parseFloat(altinData.gram_altin.satis.replace(',', '.')) : null;
          } catch (altinError) {
            // Altın API çalışmazsa yaklaşık hesaplama
            altinFiyat = usdTry ? (usdTry * 75) : null;
          }
          
        } catch (currencyApiError) {
          // CurrencyAPI rate limit hatası - sessizce alternatif API'ye geç
          // console.log sadece ilk hatada göster
          if (!currencyApiError.message?.includes('429')) {
            console.log('CurrencyAPI çalışmıyor, alternatif API kullanılıyor');
          }
          
          // Alternatif: exchangerate-api.com (ücretsiz, güncel)
          try {
            const usdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (usdResponse.ok) {
              const usdData = await usdResponse.json();
              usdTry = usdData.rates?.TRY || null;
            }
            
            const eurResponse = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
            if (eurResponse.ok) {
              const eurData = await eurResponse.json();
              eurTry = eurData.rates?.TRY || null;
            }

            // Altın için yaklaşık hesaplama
            altinFiyat = usdTry ? (usdTry * 75) : null;
          } catch (altError) {
            // Alternatif API hatası - sessizce devam et
          }
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
    // İlk yüklemede sadece ref'i güncelle, previousRates state'ini güncelleme
    if (isFirstLoadRef.current) {
      if (rates.usd || rates.eur || rates.altin) {
        prevRatesRef.current = {
          usd: rates.usd || null,
          eur: rates.eur || null,
          altin: rates.altin || null
        };
        isFirstLoadRef.current = false;
        // localStorage'a kaydet
        if (typeof window !== 'undefined') {
          localStorage.setItem('currency_previous_rates', JSON.stringify(prevRatesRef.current));
        }
      }
      return;
    }
    
    // İkinci ve sonraki güncellemelerde karşılaştırma yap
    if ((rates.usd || rates.eur || rates.altin) && 
        (prevRatesRef.current.usd !== rates.usd || 
         prevRatesRef.current.eur !== rates.eur || 
         prevRatesRef.current.altin !== rates.altin)) {
      
      // Önceki değerleri state'e kaydet (re-render tetikler)
      const previousToSave = {
        usd: prevRatesRef.current.usd,
        eur: prevRatesRef.current.eur,
        altin: prevRatesRef.current.altin
      };
      
      setPreviousRates(previousToSave);
      
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
  }, [rates]);

  return (
    <CurrencyContext.Provider value={{ rates, previousRates, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}
