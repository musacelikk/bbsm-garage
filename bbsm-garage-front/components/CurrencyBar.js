import React, { useState, useEffect, useRef } from 'react';

function CurrencyBar() {
  const [rates, setRates] = useState({
    usd: null,
    eur: null,
    altin: null
  });
  
  // Önceki değerleri state olarak sakla (re-render için)
  // İlk yüklemede previousRates boş olmalı, sadece ikinci güncellemede karşılaştırma yapılacak
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
    
    // Her 30 saniyede bir güncelle (anlık veri için)
    const interval = setInterval(fetchRates, 30 * 1000);
    
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
      
      console.log('Rates changed, updating previousRates');
      console.log('Current prevRatesRef:', prevRatesRef.current);
      console.log('New rates:', rates);
      
      // Önceki değerleri state'e kaydet (re-render tetikler)
      const previousToSave = {
        usd: prevRatesRef.current.usd,
        eur: prevRatesRef.current.eur,
        altin: prevRatesRef.current.altin
      };
      
      console.log('Saving previous rates to state:', previousToSave);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
        <span>USD -</span>
        <span className="text-gray-300">|</span>
        <span>EUR -</span>
        <span className="text-gray-300">|</span>
        <span>ALTIN -</span>
      </div>
    );
  }

  // Yükseliş/azalış kontrolü ve yüzde hesaplama
  const getChangeIndicator = (current, previous) => {
    if (!current) return { textColor: 'text-gray-400', icon: null, percentage: null, isUp: null };
    
    // Önceki değer yoksa varsayılan (sarı)
    if (!previous) {
      return { 
        textColor: 'text-yellow-400', 
        icon: (
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        ), 
        percentage: '0.00',
        isUp: null 
      };
    }
    
    const currentNum = parseFloat(current);
    const previousNum = parseFloat(previous);
    const percentage = previousNum > 0 ? ((currentNum - previousNum) / previousNum * 100).toFixed(2) : '0.00';
    
    if (currentNum > previousNum) {
      return { 
        textColor: 'text-green-400', 
        icon: (
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ), 
        percentage: `%${percentage}`,
        isUp: true 
      };
    } else if (currentNum < previousNum) {
      return { 
        textColor: 'text-red-400', 
        icon: (
          <svg className="w-2.5 h-2.5 rotate-180" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        ), 
        percentage: `%${percentage}`,
        isUp: false 
      };
    }
    // Değişiklik yoksa sarı göster
    return { 
      textColor: 'text-yellow-400', 
      icon: (
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      ), 
      percentage: '%0.00',
      isUp: null 
    };
  };

  // Debug için console.log
  console.log('Current rates:', rates);
  console.log('Previous rates:', previousRates);
  
  const usdChange = getChangeIndicator(rates.usd, previousRates.usd);
  const eurChange = getChangeIndicator(rates.eur, previousRates.eur);
  const altinChange = getChangeIndicator(rates.altin, previousRates.altin);
  
  console.log('USD Change:', usdChange);
  console.log('EUR Change:', eurChange);
  console.log('ALTIN Change:', altinChange);

  // Değer arka plan rengi belirleme
  const getValueBgColor = (change) => {
    if (change.isUp === true) return 'bg-green-500';
    if (change.isUp === false) return 'bg-red-500';
    if (change.isUp === null && change.percentage) return 'bg-yellow-500';
    return 'bg-gray-700';
  };

  return (
    <div className="flex items-center justify-center gap-6 text-sm">
      {rates.usd && (
        <>
          <div className="flex flex-col min-w-[120px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-cyan-400 font-semibold text-[10px]">DOLAR</span>
              {usdChange.percentage && (
                <div className={`flex items-center gap-0.5 ${usdChange.textColor || 'text-yellow-400'}`}>
                  {usdChange.icon}
                  <span className="text-[10px] font-semibold">{usdChange.percentage}</span>
                </div>
              )}
            </div>
            <span className={`${getValueBgColor(usdChange)} text-white text-base font-bold px-2.5 py-1.5 rounded`}>{rates.usd}</span>
          </div>
          <div className="h-8 w-px bg-gray-600"></div>
        </>
      )}
      {rates.eur && (
        <>
          <div className="flex flex-col min-w-[120px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-cyan-400 font-semibold text-[10px]">EURO</span>
              {eurChange.percentage && (
                <div className={`flex items-center gap-0.5 ${eurChange.textColor || 'text-yellow-400'}`}>
                  {eurChange.icon}
                  <span className="text-[10px] font-semibold">{eurChange.percentage}</span>
                </div>
              )}
            </div>
            <span className={`${getValueBgColor(eurChange)} text-white text-base font-bold px-2.5 py-1.5 rounded`}>{rates.eur}</span>
          </div>
          <div className="h-8 w-px bg-gray-600"></div>
        </>
      )}
      {rates.altin && (
        <div className="flex flex-col min-w-[140px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-cyan-400 font-semibold text-[10px]">GRAM ALTIN</span>
            {altinChange.percentage && (
              <div className={`flex items-center gap-0.5 ${altinChange.textColor || 'text-yellow-400'}`}>
                {altinChange.icon}
                <span className="text-[10px] font-semibold">{altinChange.percentage}</span>
              </div>
            )}
          </div>
          <span className={`${getValueBgColor(altinChange)} text-white text-base font-bold px-2.5 py-1.5 rounded`}>{rates.altin}</span>
        </div>
      )}
    </div>
  );
}

export default CurrencyBar;

