import React from 'react';
import Image from 'next/image';
import bmwLogo from '../public/images/bmw-logo.webp'; // Logonun doğru yolunu burada belirtin

const Loading = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="logo-spinner">
        <Image src={bmwLogo} alt="Loading" width={250} height={250} style={{ width: '200px', height: 'auto' }} priority />
      </div>
    </div>
  );
};

export default Loading;
