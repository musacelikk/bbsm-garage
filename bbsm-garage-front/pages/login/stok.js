import React, { useEffect, useState } from 'react';
import { API_URL } from '../../config';
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import ProfileModal from '../../components/ProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { useSwipe } from '../../hooks/useTouchGestures';

export default function stok() {
    const { fetchWithAuth, getUsername, logout } = useAuth();
    const { loading, setLoading } = useLoading();
    const username = getUsername() || 'Kullanıcı';
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const firmaAdi = profileData?.firmaAdi ? profileData.firmaAdi.toUpperCase() : 'KULLANICI';
    const [isPageLoaded, setIsPageLoaded] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Sayfa yüklendiğinde fade-in animasyonu
    useEffect(() => {
        setIsPageLoaded(false);
        const timer = setTimeout(() => {
            setIsPageLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}/auth/profile`);
                if (response.ok) {
                    const data = await response.json();
                    setProfileData(data);
                }
            } catch (error) {
                console.error('Profil yükleme hatası:', error);
            }
        };
        loadProfile();
    }, []);
    const [stokAdi, setStokAdi] = useState('');
    const [adet, setAdet] = useState('');
    const [eklenisTarihi, setEklenisTarihi] = useState('');
    const [info, setInfo] = useState('');
    const [stokListesi, setStokListesi] = useState([]);
    const [filteredStokListesi, setFilteredStokListesi] = useState([]);
    const [selectedStok, setSelectedStok] = useState([]);
    const [allChecked, setAllChecked] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
              "adet": adet,
              "eklenisTarihi": eklenisTarihi,
              "info": info
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
      const term = e.target.value.toLowerCase();
      setSearchTerm(term);
      setFilteredStokListesi(stokListesi.filter(stok => stok.stokAdi.toLowerCase().includes(term) || stok.info.toLowerCase().includes(term)));
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
      className={`min-h-screen transition-all duration-1000 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}
      {...sidebarSwipe}
    >
      <Head>
          <title>BBSM Garage - Stok Takibi</title>
          <link rel="icon" href="/BBSM.ico" /> {"/public/BBSM.ico"}
        </Head>

        <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
          {/* Sidebar overlay - mobilde sidebar açıkken arka planı kapat */}
          {isOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}
          <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz relative z-40">
            <ul className="space-y-4">
              <li>
                <Link href="/login/dashboard" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Dashboard</Link>
              </li>
              <li>
                <Link href="/login/kartlar" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Kartlar</Link>
              </li>
              <li>
                <Link href="/login/teklif" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Teklif</Link>
              </li>
              <li>
                <Link href="/login/stok" className="block p-3 text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Stok Takibi</Link>
              </li>
              <li>
                <Link href="/login/gelir" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Gelir Raporu</Link>
              </li>
              <li>
                <Link href="/login/son-hareketler" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Son Hareketler</Link>
              </li>
              <li>
                <Link href="/login/bizeulasin" className="block p-3 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group active:scale-95 transition-transform">Bize Ulaşın</Link>
              </li>
            </ul>
          </div>
        </aside>


        <div className="flex-1 flex flex-col">

          <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
            <div className="px-3 py-3 lg:px-5 lg:pl-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button 
                    onClick={toggleMenu} 
                    className={`lg:hidden p-3 font-bold text-lg leading-tight antialiased ${isOpen && 'hidden'} active:scale-95 transition-transform touch-manipulation min-w-[44px] min-h-[44px]`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                  </button>
                  <a href="#" className="flex ml-2 md:mr-8 lg:mr-24">
                  <img src="/images/BBSMlogo.png" className="h-16 mr-3" alt="logo" />
                  
                  </a>
                </div>
                <div className="flex items-center relative">
                  <button 
                    type="button" 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="flex items-center text-sm hidden md:flex hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <span className="sr-only">Open user menu</span>
                    <p className="text-center text-my-siyah font-semibold items-center pr-8">{firmaAdi}</p>
                    <img 
                        src={profileData?.profileImage ? `${API_URL}${profileData.profileImage}` : '/images/yasin.webp'} 
                        className="h-16 w-16 rounded-full object-cover" 
                        alt="Kullanıcı"
                        onError={(e) => {
                            e.target.src = '/images/yasin.webp';
                        }}
                    />
                  </button>
                  
                  {/* Settings Dropdown */}
                  {isSettingsOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsSettingsOpen(false)}
                      ></div>
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
                        <div className="py-2">
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-my-siyah">{firmaAdi}</p>
                            <p className="text-xs text-gray-500 mt-1">Firma Hesabı</p>
                          </div>
                          <button
                            onClick={async () => {
                              setIsSettingsOpen(false);
                              try {
                                const response = await fetchWithAuth(`${API_URL}/auth/profile`);
                                if (response.ok) {
                                  const data = await response.json();
                                  setProfileData(data);
                                  setIsProfileModalOpen(true);
                                } else {
                                  alert('Profil bilgileri yüklenemedi');
                                }
                              } catch (error) {
                                console.error('Profil yükleme hatası:', error);
                                alert('Profil bilgileri yüklenirken bir hata oluştu');
                              }
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-my-siyah hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profil Bilgileri
                          </button>
                          <button
                            onClick={() => {
                              setIsSettingsOpen(false);
                              setIsChangePasswordModalOpen(true);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-my-siyah hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Şifre Değiştir
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => {
                              setIsSettingsOpen(false);
                              logout();
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Çıkış Yap
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* DESKTOP LAYOUT (hidden on mobile) */}
          <div className="hidden md:block">
            <div className="p-6 pt-8 lg:ml-64 ">
              <div className="p-6 mt-20 bg-my-beyaz rounded-3xl">
                <div className="flex items-center pb-4">
                  <p className="font-bold text-xl text-my-siyah">Stok Ekle</p>
                </div>
                <form onSubmit={handleSubmit} className="p-2">
                  <div className="grid gap-6 mb-4 md:grid-cols-3">
                    <div>
                      <label htmlFor="text" className="block mb-2 text-sm font-medium text-gray-900">Stok Adı</label>
                      <input type="text" id="text" className="bg-my-beyaz border border-gray-300 text-gray 900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Stok Adı Giriniz" value={stokAdi} onChange={(e) => handleChange(e, setStokAdi)} required/>
                    </div>
                    <div>
                        <label htmlFor="number" className="block mb-2 text-sm font-medium text-gray-900 ">Adet</label>
                        <input type="number" id="text" className="bg-my-beyaz border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " placeholder="Adet Giriniz" pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}" value={adet}  onChange={(e) => handleChange(e, setAdet)} required/>
                    </div>
                    <div>
                        <label htmlFor="date" className="block mb-2 text-sm font-medium text-gray-900 ">Ekleniş Tarihi</label>
                        <input type="date" id="text" className="bg-my-beyaz border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " placeholder="Ekleniş Tarihi Giriniz" value={eklenisTarihi}  onChange={(e) => handleChange(e, setEklenisTarihi)} required/>
                    </div>
                  </div>
                  <div className="mb-6">
                      <label htmlFor="text" className="block mb-2 text-sm font-medium text-gray-900">Açıklama</label>
                      <input type="text" id="text" className="bg-my-beyaz border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 " placeholder="Açıklama Giriniz ..." value={info}  onChange={(e) => handleChange(e, setInfo)} required/>
                  </div>
                  <div className="flex justify-end">
                      <button type="submit" className="text-white bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm w-full sm:w-auto px-5 py-2.5 text-center">Ekle</button>
                  </div>
              </form>
              </div>
            </div>
            <div className="p-6 lg:ml-64 ">
              <div className="p-6 bg-my-beyaz rounded-3xl">
                <div className="flex items-center pb-4 justify-between">
                  <div className="flex items-center">
                    <div className="pr-4 items-center ">
                      <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between ">
                        <p className="font-bold text-xl text-my-siyah">Stoklarım</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="items-center bg-red-600 p-2 pl-4 pr-4 rounded-full ml-4">
                      <button onClick={handleClearItems} href="" className="font-semibold text-my-beyaz text-md">Seçilenleri Sil</button>
                    </div>
                    <div className="pr-4 items-center pl-4">
                      <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between">
                        <label htmlFor="table-search" className="sr-only">Search</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-500 " aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
                          </div>
                          <input type="text" id="table-search" className="block p-2 ps-10 text-md text-gray-900 border border-gray-300 rounded-full w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500" placeholder="Search for items" value={searchTerm} onChange={handleSearch}/>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <table className="w-full text-sm text-left text-gray-500 font-medium">
                  <thead className="text-xs text-gray-600 uppercase bg-my-edbeyaz">
                    <tr>
                      <th scope="col" className="p-4">
                        <div className="flex items-center">
                          <input  type="checkbox" className="w-4 h-4 bg-white border-white text-my-beyaz" checked={allChecked} onChange={handleAllChecked}/>
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
                        Adet
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Açıklama
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStokListesi.map((stok, index) => (
                      <tr key={stok.id || index}>
                        <td className="w-4 p-4">
                          <div className="flex items-center">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" checked={selectedStok.includes(stok.id)}  onChange={(e) => handleCheckboxChange(e, stok.id)}/>
                            <label htmlFor={`checkbox-table-${index}`} className="sr-only">checkbox</label>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {capitalizeWords(stok.stokAdi)}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(stok.eklenisTarihi).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-green-500">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleAdetUpdate(stok.id, 'decrement')}
                              className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                              disabled={stok.adet <= 0}
                            >
                              -
                            </button>
                            <span>{stok.adet}</span>
                            <button 
                              onClick={() => handleAdetUpdate(stok.id, 'increment')}
                              className="p-1 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 uppercase">
                        <textarea
                          readOnly
                          value={stok.info}
                          className="bg-white text-gray-900 text-sm rounded-lg block w-full p-2.5 overflow"
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
          <div className="md:hidden bg-white min-h-screen pt-24 px-2">
            {/* Stock add form */}
            <div className="w-full mb-4">
              <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="mb-2">
                  <label htmlFor="stokAdi" className="block mb-1 text-sm  font-medium text-black">Stok Adı</label>
                  <input type="text" id="stokAdi" className="border bg-white border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Stok Adı Giriniz" value={stokAdi} onChange={(e) => handleChange(e, setStokAdi)} required/>
                </div>
                <div className="mb-2">
                  <label htmlFor="adet" className="block mb-1 text-sm font-medium text-black">Adet</label>
                  <input type="number" id="adet" className="border bg-white border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Adet Giriniz" value={adet} onChange={(e) => handleChange(e, setAdet)} required/>
                </div>
                <div className="mb-2">
                  <label htmlFor="eklenisTarihi" className="block mb-1 text-sm font-medium text-black">Ekleniş Tarihi</label>
                  <input type="date" id="eklenisTarihi" className="border bg-white border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Ekleniş Tarihi Giriniz" value={eklenisTarihi} onChange={(e) => handleChange(e, setEklenisTarihi)} required/>
                </div>
                <div className="mb-2">
                  <label htmlFor="info" className="block mb-1 text-sm font-medium text-black">Açıklama</label>
                  <input type="text" id="info" className="border bg-white border-gray-300 text-black text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Açıklama Giriniz ..." value={info} onChange={(e) => handleChange(e, setInfo)} required/>
                </div>
                <button type="submit" className="w-full text-white bg-blue-500 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center">Ekle</button>
              </form>
            </div>
            {/* Search bar at the top */}
            <div className="w-full mb-2">
              <input
                type="text"
                id="table-search-mobile"
                className="block w-full p-2 text-md text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Stok ara"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            {/* Action button full width */}
            <div className="flex flex-col gap-2 w-full mb-4">
              <button onClick={handleClearItems} className="w-full bg-red-600 text-white font-semibold py-2 rounded-full">Seçilenleri Sil</button>
            </div>
            {/* Stok list as cards */}
            <div className="w-full">
              {filteredStokListesi.map((stok, index) => (
                <div key={stok.id || index} className="w-full border-b last:border-b-0 px-2 py-2 flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    checked={selectedStok.includes(stok.id)}
                    onChange={(e) => handleCheckboxChange(e, stok.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{capitalizeWords(stok.stokAdi)}</div>
                    <div className="text-xs text-gray-600">{new Date(stok.eklenisTarihi).toLocaleDateString()}</div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleAdetUpdate(stok.id, 'decrement')}
                        className="p-1 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                        disabled={stok.adet <= 0}
                      >
                        -
                      </button>
                      <span className="text-green-600 font-semibold">{stok.adet}</span>
                      <button 
                        onClick={() => handleAdetUpdate(stok.id, 'increment')}
                        className="p-1 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 truncate">{stok.info}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Profil Bilgileri Modal */}
        {isProfileModalOpen && (
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={async () => {
              setIsProfileModalOpen(false);
              setIsEditingProfile(false);
              // Modal kapandığında profil verilerini yeniden yükle
              try {
                const response = await fetchWithAuth(`${API_URL}/auth/profile`);
                if (response.ok) {
                  const data = await response.json();
                  setProfileData(data);
                }
              } catch (error) {
                console.error('Profil yükleme hatası:', error);
              }
            }}
            profileData={profileData}
            setProfileData={(data) => {
              setProfileData(data);
            }}
            isEditing={isEditingProfile}
            setIsEditing={setIsEditingProfile}
            fetchWithAuth={fetchWithAuth}
            API_URL={API_URL}
            setLoading={setLoading}
          />
        )}

        {/* Şifre Değiştirme Modal */}
        {isChangePasswordModalOpen && (
          <ChangePasswordModal
            isOpen={isChangePasswordModalOpen}
            onClose={() => setIsChangePasswordModalOpen(false)}
            fetchWithAuth={fetchWithAuth}
            API_URL={API_URL}
            setLoading={setLoading}
          />
        )}

        {/* WhatsApp Destek Butonu */}
        <a
          href="https://wa.me/905424873202"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110"
          aria-label="WhatsApp Destek"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span className="ml-2 text-sm font-medium">Destek</span>
        </a>
      </div>
    );
  }
