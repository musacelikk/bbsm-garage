import React, { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';

function Stok() {
    const { fetchWithAuth, getUsername, logout } = useAuth();
    const { loading, setLoading } = useLoading();
    const { profileData, refreshProfile } = useProfile();
    const username = getUsername() || 'Kullanıcı';
    const [isOpen, setIsOpen] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [stokAdi, setStokAdi] = useState('');
    const [adet, setAdet] = useState('');
    const [eklenisTarihi, setEklenisTarihi] = useState('');
    const [info, setInfo] = useState('');
    const [kategori, setKategori] = useState('');
    const [minStokSeviyesi, setMinStokSeviyesi] = useState(5);
    const [stokListesi, setStokListesi] = useState([]);
    const [filteredStokListesi, setFilteredStokListesi] = useState([]);
    const [selectedStok, setSelectedStok] = useState([]);
    const [allChecked, setAllChecked] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [seciliKategori, setSeciliKategori] = useState('hepsi');

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleChange = (e, setter) => {
        const { value } = e.target;
        setter(capitalizeFirstLetter(value));
    };
    const capitalizeWords = (string) => {
      return string.split(' ').map(word => {
        return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
      }).join(' ');
    };
    

    var requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };
    
    const fetchStokListesi = async () => {
      setLoading(true);
      try {
          const response = await fetchWithAuth(`${API_URL}/stok`, {
              method: 'GET',
          });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (Array.isArray(data)) {
              setStokListesi(data);
              setFilteredStokListesi(data);
          }
      } catch (error) {
          console.error('Veri getirme hatası:', error);
      }
      setLoading(false);
  };

      useEffect(() => {
          fetchStokListesi();
      }, []);

      const handleSubmit = async (e) => {
        setLoading(true);
          e.preventDefault();
          const yeniStok = {
              "stokAdi": stokAdi,
              "adet": parseInt(adet, 10),
              "eklenisTarihi": eklenisTarihi,
              "info": info,
              "kategori": kategori || 'Genel',
              "minStokSeviyesi": parseInt(minStokSeviyesi, 10) || 5
          };

          try {
              const response = await fetchWithAuth(`${API_URL}/stok`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(yeniStok),
              });

              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }

              // Formu sıfırla
              setStokAdi('');
              setAdet('');
              setEklenisTarihi('');
              setInfo('');
              setKategori('');
              setMinStokSeviyesi(5);

              // Stok listesini yeniden fetch et
              fetchStokListesi();
          } catch (error) {
              console.error('Stok ekleme hatası', error);
          }
          setLoading(false);
      };
      
    const handleClearItems = async () => {
      setLoading(true);
      try {
        // Seçilen her bir stok ID'si için ayrı bir DELETE isteği gönder
        const deleteRequests = selectedStok.map(id =>
          fetchWithAuth(`${API_URL}/stok/${id}`, { method: 'DELETE' })
        );
        await Promise.all(deleteRequests);
    
        // UI'dan silinen öğeleri kaldır
        const updatedStokListesi = stokListesi.filter(stok => !selectedStok.includes(stok.id));
        setStokListesi(updatedStokListesi);
        setFilteredStokListesi(updatedStokListesi);
        setSelectedStok([]); // Seçimleri sıfırla
      } catch (error) {
        console.error('Silme işlemi sırasında hata oluştu', error);
      }
      setLoading(false);
    };

    const toggleMenu = () => {
        setIsOpen(prevIsOpen => !prevIsOpen);
      };

    const handleCheckboxChange = (e, id) => {
      if (e.target.checked) {
        setSelectedStok([...selectedStok, id]);
      } else {
        setSelectedStok(selectedStok.filter(stokId => stokId !== id));
      }
    };

    const handleAllChecked = (e) => {
      setAllChecked(e.target.checked);
      setSelectedStok(e.target.checked ? stokListesi.map(stok => stok.id) : []);
    };

    const handleSearch = (e) => {
      const term = e.target.value;
      setSearchTerm(term);
      let filtered = stokListesi.filter(stok => 
        stok.stokAdi.toLowerCase().includes(term.toLowerCase()) || 
        stok.info.toLowerCase().includes(term.toLowerCase()) ||
        (stok.kategori || '').toLowerCase().includes(term.toLowerCase())
      );
      if (seciliKategori !== 'hepsi') {
        filtered = filtered.filter(stok => (stok.kategori || 'Genel') === seciliKategori);
      }
      setFilteredStokListesi(filtered);
    };
    
    const handleAdetUpdate = async (id, operation) => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(`${API_URL}/stok/${id}/adet/${operation}`, {
          method: 'PATCH',
        });
        
        if (!response.ok) {
          throw new Error('Adet güncellenirken bir hata oluştu');
        }
        
        // Stok listesini yenile
        fetchStokListesi();
      } catch (error) {
        console.error('Adet güncelleme hatası:', error);
        alert('Adet güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      setLoading(false);
    };
  
    // Sidebar için swipe gesture
    const sidebarSwipe = useSwipe(
      null,
      () => setIsOpen(true),
      null,
      null,
      50
    );

    return (
      <div 
        className="min-h-screen dark-bg-primary"
        {...sidebarSwipe}
      >
        <Head>
          <title>BBSM Garage - Stok Takibi</title>
          <link rel="icon" href="/BBSM.ico" />
        </Head>

        <Sidebar 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)}
          activePage="stok"
          setIsProfileModalOpen={() => {}}
          setIsChangePasswordModalOpen={() => {}}
          logout={logout}
        />

        <div className="flex-1 flex flex-col">
          <Navbar
            onToggleSidebar={toggleMenu}
            isSidebarOpen={isOpen}
          />

          <ProtectedPage>
            {/* DESKTOP LAYOUT (hidden on mobile) */}
            <div className="hidden md:block">
              <div className="p-3 md:p-4 lg:p-6 pt-4 md:pt-6 lg:pt-8 lg:ml-64 dark-bg-primary">
                <div className="p-3 md:p-4 lg:p-6 mt-16 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl">
                <div className="flex items-center pb-4">
                  <p className="font-semibold text-base md:text-lg dark-text-primary">Stok Ekle</p>
                </div>
                <form onSubmit={handleSubmit} className="p-2">
                  <div className="grid gap-6 mb-4 md:grid-cols-3">
                    <div>
                      <label htmlFor="text" className="block mb-2 text-sm font-medium dark-text-primary">Stok Adı</label>
                      <input type="text" id="text" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-2.5 md:p-2.5 touch-manipulation min-h-[44px]" placeholder="Stok Adı Giriniz" value={stokAdi} onChange={(e) => handleChange(e, setStokAdi)} required/>
                    </div>
                    <div>
                        <label htmlFor="number" className="block mb-2 text-sm font-medium dark-text-primary">Adet</label>
                        <input type="number" id="text" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-2.5 md:p-2.5 touch-manipulation min-h-[44px]" placeholder="Adet Giriniz" value={adet}  onChange={(e) => handleChange(e, setAdet)} required/>
                    </div>
                    <div>
                        <label htmlFor="date" className="block mb-2 text-sm font-medium dark-text-primary">Ekleniş Tarihi</label>
                        <input type="date" id="text" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-2.5 md:p-2.5 touch-manipulation min-h-[44px]" placeholder="Ekleniş Tarihi Giriniz" value={eklenisTarihi}  onChange={(e) => handleChange(e, setEklenisTarihi)} required/>
                    </div>
                  </div>
                  <div className="grid gap-6 mb-4 md:grid-cols-3">
                    <div>
                      <label htmlFor="kategori" className="block mb-2 text-sm font-medium dark-text-primary">Kategori</label>
                      <input type="text" id="kategori" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-2.5 md:p-2.5 touch-manipulation min-h-[44px]" placeholder="Kategori (örn: Yedek Parça, Yağ, Filtre)" value={kategori} onChange={(e) => handleChange(e, setKategori)}/>
                    </div>
                    <div>
                      <label htmlFor="minStok" className="block mb-2 text-sm font-medium dark-text-primary">Minimum Stok Seviyesi</label>
                      <input type="number" id="minStok" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-2.5 md:p-2.5 touch-manipulation min-h-[44px]" placeholder="Min. Stok (varsayılan: 5)" value={minStokSeviyesi} onChange={(e) => setMinStokSeviyesi(e.target.value)}/>
                    </div>
                    <div>
                      <label htmlFor="text" className="block mb-2 text-sm font-medium dark-text-primary">Açıklama</label>
                      <input type="text" id="text" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-2.5 md:p-2.5 touch-manipulation min-h-[44px]" placeholder="Açıklama Giriniz ..." value={info}  onChange={(e) => handleChange(e, setInfo)}/>
                    </div>
                  </div>
                  <div className="flex justify-end">
                      <button type="submit" className="text-white bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-full sm:w-auto px-5 py-2.5 md:py-2.5 text-center neumorphic-inset touch-manipulation min-h-[44px] active:scale-95">Ekle</button>
                  </div>
              </form>
              </div>
              {/* Stok Uyarıları */}
              {stokListesi.filter(s => (s.adet || 0) <= (s.minStokSeviyesi || 5)).length > 0 && (
                <div className="p-3 md:p-4 lg:p-6 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl mt-4 md:mt-6 border border-red-500/20">
                  <div className="flex items-center mb-4">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-lg font-semibold dark-text-primary">Stok Uyarıları</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stokListesi.filter(s => (s.adet || 0) <= (s.minStokSeviyesi || 5)).map((stok, index) => (
                      <div key={index} className="p-3 dark-bg-tertiary rounded-lg border border-red-500/30">
                        <p className="font-medium dark-text-primary">{stok.stokAdi}</p>
                        <p className="text-sm dark-text-muted">Kalan: {stok.adet} / Min: {stok.minStokSeviyesi || 5}</p>
                        <p className="text-xs dark-text-muted mt-1">Kategori: {stok.kategori || 'Genel'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kategori Filtresi */}
              <div className="p-3 md:p-4 lg:p-6 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl mt-4 md:mt-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium dark-text-primary mb-2">Kategori Filtresi</label>
                  <select
                    value={seciliKategori}
                    onChange={(e) => {
                      setSeciliKategori(e.target.value);
                      if (e.target.value === 'hepsi') {
                        setFilteredStokListesi(stokListesi.filter(stok => 
                          stok.stokAdi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          stok.info.toLowerCase().includes(searchTerm.toLowerCase())
                        ));
                      } else {
                        setFilteredStokListesi(stokListesi.filter(stok => 
                          (stok.kategori || 'Genel') === e.target.value &&
                          (stok.stokAdi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          stok.info.toLowerCase().includes(searchTerm.toLowerCase()))
                        ));
                      }
                    }}
                    className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full md:w-64 p-2.5 touch-manipulation min-h-[44px]"
                  >
                    <option value="hepsi">Tüm Kategoriler</option>
                    {Array.from(new Set(stokListesi.map(s => s.kategori || 'Genel'))).map(kat => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 md:p-4 lg:p-6 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl mt-4 md:mt-6">
                <div className="flex items-center pb-4 justify-between">
                  <div className="flex items-center">
                    <div className="pr-4 items-center ">
                      <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between ">
                        <p className="font-semibold text-base md:text-lg dark-text-primary">Stoklarım</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="items-center bg-red-600 p-2 md:p-2 pl-3 md:pl-4 pr-3 md:pr-4 rounded-full ml-2 md:ml-4">
                      <button onClick={handleClearItems} href="" className="font-semibold text-white text-xs md:text-sm lg:text-md whitespace-nowrap">Seçilenleri Sil</button>
                    </div>
                    <div className="pr-4 items-center pl-4">
                      <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between">
                        <label htmlFor="table-search" className="sr-only">Search</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-5 h-5 dark-text-muted" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
                          </div>
                          <input type="text" id="table-search" className="block p-2 ps-10 text-sm md:text-md dark-text-primary neumorphic-input rounded-full w-64 md:w-80" placeholder="Search for items" value={searchTerm} onChange={handleSearch}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <table className="w-full text-sm text-left dark-text-secondary font-medium">
                  <thead className="text-xs dark-text-primary uppercase dark-bg-tertiary neumorphic-inset">
                    <tr>
                      <th scope="col" className="p-4">
                        <div className="flex items-center">
                          <input type="checkbox" className="w-4 h-4 dark-bg-tertiary dark-border text-blue-500" checked={allChecked} onChange={handleAllChecked} />
                          <label htmlFor="checkbox-all-search" className="sr-only">checkbox</label>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Stok Adı
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Ekleniş Tarihi
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Kategori
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Adet
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Durum
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Açıklama
                      </th>
                    </tr>
                  </thead>
                  <tbody className="dark-card-bg divide-y dark-border">
                    {filteredStokListesi.map((stok, index) => (
                      <tr key={stok.id || index}>
                        <td className="w-4 p-4">
                          <div className="flex items-center">
                            <input type="checkbox" className="w-4 h-4 text-blue-500 dark-bg-tertiary dark-border rounded focus:ring-blue-500" checked={selectedStok.includes(stok.id)}  onChange={(e) => handleCheckboxChange(e, stok.id)}/>
                            <label htmlFor={`checkbox-table-${index}`} className="sr-only">checkbox</label>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium dark-text-primary whitespace-nowrap">
                          {capitalizeWords(stok.stokAdi)}
                        </td>
                        <td className="px-6 py-4 dark-text-secondary">
                          {new Date(stok.eklenisTarihi).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 dark-text-secondary">
                          {stok.kategori || 'Genel'}
                        </td>
                        <td className="px-6 py-4 text-green-400">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleAdetUpdate(stok.id, 'decrement')}
                              className="p-1.5 md:p-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 neumorphic-inset touch-manipulation min-w-[32px] md:min-w-0 min-h-[32px] md:min-h-0 active:scale-95"
                              disabled={stok.adet <= 0}
                            >
                              -
                            </button>
                            <span className={`min-w-[30px] text-center font-semibold ${(stok.adet || 0) <= (stok.minStokSeviyesi || 5) ? 'text-red-400' : 'dark-text-primary'}`}>
                              {stok.adet}
                            </span>
                            <button 
                              onClick={() => handleAdetUpdate(stok.id, 'increment')}
                              className="p-1.5 md:p-1 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 neumorphic-inset touch-manipulation min-w-[32px] md:min-w-0 min-h-[32px] md:min-h-0 active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {(stok.adet || 0) <= (stok.minStokSeviyesi || 5) ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">Düşük Stok</span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">Normal</span>
                          )}
                        </td>
                        <td className="px-6 py-4 uppercase">
                        <textarea
                          readOnly
                          value={stok.info}
                          className="dark-card-bg dark-text-secondary text-sm rounded-lg block w-full p-2.5 overflow neumorphic-inset"
                          style={{ maxHeight: '120px' }}
                        />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>

            {/* MOBILE LAYOUT */}
            <div className="md:hidden dark-bg-primary min-h-screen pt-24 px-2">
            {/* Stock add form */}
            <div className="w-full mb-4">
              <form onSubmit={handleSubmit} className="dark-card-bg neumorphic-card p-4 rounded-xl">
                <div className="mb-2">
                  <label htmlFor="stokAdi" className="block mb-1 text-sm font-medium dark-text-primary">Stok Adı</label>
                  <input type="text" id="stokAdi" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-3 touch-manipulation min-h-[44px]" placeholder="Stok Adı Giriniz" value={stokAdi} onChange={(e) => handleChange(e, setStokAdi)} required/>
                </div>
                <div className="mb-2">
                  <label htmlFor="adet" className="block mb-1 text-sm font-medium dark-text-primary">Adet</label>
                  <input type="number" id="adet" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-3 touch-manipulation min-h-[44px]" placeholder="Adet Giriniz" value={adet} onChange={(e) => handleChange(e, setAdet)} required/>
                </div>
                <div className="mb-2">
                  <label htmlFor="eklenisTarihi" className="block mb-1 text-sm font-medium dark-text-primary">Ekleniş Tarihi</label>
                  <input type="date" id="eklenisTarihi" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-3 touch-manipulation min-h-[44px]" placeholder="Ekleniş Tarihi Giriniz" value={eklenisTarihi} onChange={(e) => handleChange(e, setEklenisTarihi)} required/>
                </div>
                <div className="mb-2">
                  <label htmlFor="info" className="block mb-1 text-sm font-medium dark-text-primary">Açıklama</label>
                  <input type="text" id="info" className="neumorphic-input dark-text-primary text-sm rounded-lg block w-full p-3 touch-manipulation min-h-[44px]" placeholder="Açıklama Giriniz ..." value={info} onChange={(e) => handleChange(e, setInfo)} required/>
                </div>
                <button type="submit" className="w-full text-white bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-3 text-center neumorphic-inset touch-manipulation min-h-[44px] active:scale-95">Ekle</button>
              </form>
            </div>
            {/* Search bar at the top */}
            <div className="w-full mb-2">
              <input
                type="text"
                id="table-search-mobile"
                className="block w-full p-3 text-sm md:text-md dark-text-primary neumorphic-input rounded-full touch-manipulation min-h-[44px]"
                placeholder="Stok ara"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            {/* Action button full width */}
            <div className="flex flex-col gap-2 w-full mb-4">
              <button onClick={handleClearItems} className="w-full bg-red-600 text-white font-semibold py-3 rounded-full neumorphic-inset touch-manipulation min-h-[44px] active:scale-95">Seçilenleri Sil</button>
            </div>
            {/* Stok list as cards */}
            <div className="w-full dark-card-bg neumorphic-card rounded-xl overflow-hidden">
              {filteredStokListesi.map((stok, index) => (
                <div key={stok.id || index} className="w-full border-b last:border-b-0 dark-border px-2 py-2 flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-500 dark-bg-tertiary dark-border rounded focus:ring-blue-500 mr-2"
                    checked={selectedStok.includes(stok.id)}
                    onChange={(e) => handleCheckboxChange(e, stok.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold dark-text-primary text-sm truncate">{capitalizeWords(stok.stokAdi)}</div>
                    <div className="text-xs dark-text-secondary">{new Date(stok.eklenisTarihi).toLocaleDateString()}</div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleAdetUpdate(stok.id, 'decrement')}
                        className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 neumorphic-inset touch-manipulation min-w-[36px] min-h-[36px] active:scale-95"
                        disabled={stok.adet <= 0}
                      >
                        -
                      </button>
                      <span className="text-green-400 font-semibold dark-text-primary min-w-[30px] text-center">{stok.adet}</span>
                      <button 
                        onClick={() => handleAdetUpdate(stok.id, 'increment')}
                        className="p-2 rounded-full bg-green-500/20 hover:bg-green-500/30 text-green-400 neumorphic-inset touch-manipulation min-w-[36px] min-h-[36px] active:scale-95"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-xs dark-text-secondary truncate">{stok.info}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </ProtectedPage>
        </div>

    </div>
  );
}

export default withAuth(Stok);
