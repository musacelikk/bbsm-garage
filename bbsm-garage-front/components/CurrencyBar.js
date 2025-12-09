import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

function CurrencyBar() {
  const { rates, previousRates, loading } = useCurrency();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 text-sm dark-text-muted">
        <span>USD -</span>
        <span className="dark-text-muted opacity-50">|</span>
        <span>EUR -</span>
        <span className="dark-text-muted opacity-50">|</span>
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

  const usdChange = getChangeIndicator(rates.usd, previousRates.usd);
  const eurChange = getChangeIndicator(rates.eur, previousRates.eur);
  const altinChange = getChangeIndicator(rates.altin, previousRates.altin);

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
            <span className={`${getValueBgColor(usdChange)} text-white text-base font-bold px-2.5 py-1.5 rounded neumorphic-outset`}>{rates.usd}</span>
          </div>
          <div className="h-8 w-px dark-border opacity-30"></div>
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
            <span className={`${getValueBgColor(eurChange)} text-white text-base font-bold px-2.5 py-1.5 rounded neumorphic-outset`}>{rates.eur}</span>
          </div>
          <div className="h-8 w-px dark-border opacity-30"></div>
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
          <span className={`${getValueBgColor(altinChange)} text-white text-base font-bold px-2.5 py-1.5 rounded neumorphic-outset`}>{rates.altin}</span>
        </div>
      )}
    </div>
  );
}

export default CurrencyBar;

