import React, { useState } from 'react';
import IlkModal from './IlkModal';
import IkinciModal from './IkinciModal';

const AnaBilesen = ({ onClose, onKartEkle, onTeklifEkle }) => {
  const [ilkModalGorunur, setIlkModalGorunur] = useState(true);
  const [ikinciModalGorunur, setIkinciModalGorunur] = useState(false);
  const [girilenBilgi, setGirilenBilgi] = useState('');
  const [yapilanlar, setYapilanlar] = useState([]);
  
  const handleIlkModalSubmit = (bilgi) => {
    setGirilenBilgi(bilgi);
    setIlkModalGorunur(false);
    setIkinciModalGorunur(true);
  };

  const handleIkinciModalClose = () => {
    setIkinciModalGorunur(false);
    setIlkModalGorunur(true);
  };

  const handleClose = () => {
    setIkinciModalGorunur(false);
    setIlkModalGorunur(false);
    onClose();
  };

  const handleKartEkle = (yeniKart) => {
    const km = parseInt(yeniKart.km, 10) || 0;
    const modelYili = parseInt(yeniKart.modelYili, 10) || 0;

    const kart = {
      ...yeniKart,
      km,
      modelYili
    };

    onKartEkle(kart);
  };

  const handleYapilanlarEkle = (yeniYapilan) => {
    setYapilanlar([...yapilanlar, yeniYapilan]);
  };

  const handleYapilanlarSil = (yeniYapilan) => {
    setYapilanlar([]);
  };

  const handleYapilanlarSil_index = (yeniYapilan_index) => {
    const yeniYapilanlar = yapilanlar.filter((_, i) => i !== yeniYapilan_index);
    setYapilanlar(yeniYapilanlar);
  };

  return (
    <div>
      {ilkModalGorunur && (
        <IlkModal
          onIlkModalSubmit={handleIlkModalSubmit}
          onIlkModalClose={() => setIlkModalGorunur(false)}
          onClose={handleClose}
          ilkModalBilgi={girilenBilgi} 
        />
      )}

      {ikinciModalGorunur && (
        <IkinciModal
          ilkModalBilgi={girilenBilgi}
          onIkinciModalClose={handleIkinciModalClose}
          onClose={handleClose}
          onKartEkle={handleKartEkle}
          onTeklifEkle={onTeklifEkle}
          yapilanlar={yapilanlar}
          onYapilanlarEkle={handleYapilanlarEkle}
          onYapilanlarSil={handleYapilanlarSil}
          onYapilanlarSil_index={handleYapilanlarSil_index}
          
          
          
        />
      )}
    </div>
  );
};

export default AnaBilesen;
