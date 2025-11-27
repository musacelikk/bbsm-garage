import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import bmwLogo from '../public/images/bmw-logo.webp';

const Loading = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  
  const messages = [
    'Firma bilgileriniz yükleniyor...',
    'Sistem hazırlanıyor...',
    'Panele yönlendiriliyorsunuz...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setFade(true);
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-white bg-opacity-95 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="logo-spinner mb-8">
          <Image 
            src={bmwLogo} 
            alt="Loading" 
            width={250} 
            height={250} 
            style={{ width: '200px', height: 'auto' }} 
            priority 
          />
        </div>
        <div className="text-center min-h-[80px] flex flex-col justify-center">
          <p 
            className={`text-xl font-semibold text-gray-700 mb-2 transition-all duration-500 ease-in-out ${
              fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            {messages[messageIndex]}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
              style={{ animationDelay: '0s', animationDuration: '1.5s' }}
            ></div>
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
              style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}
            ></div>
            <div 
              className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" 
              style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
