import React, { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import AnaBilesen from '@/components/AnaBilesen';
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';

const Kartlar = () => {
  const { fetchWithAuth } = useAuth();
  const { loading, setLoading } = useLoading();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isYeniKartEkleModalOpen, setIsYeniKartEkleModalOpen] = useState(false);
  const [kartlar, setKartlar] = useState([]);
  const [secilenKartlar, setSecilenKartlar] = useState([]);
  const [aramaTerimi, setAramaTerimi] = useState('');
  const [teklifler, setTeklifler] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });


  const DetailPage = (id) => {
    return (id ? `/login/kartlar/detay?id=${id}` : '/login/kartlar');
  };

  const capitalizeWords = (string) => {
    return string.split(' ').map(word => {
      return word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1).toLocaleLowerCase('tr-TR');
    }).join(' ');
  };

  const toUpperCase = (string) => {
    return string.toUpperCase();
  };

  const handleCheckboxChange = (e, kartId) => {
    if (e.target.checked) {
      setSecilenKartlar([...secilenKartlar, kartId]);
    } else {
      setSecilenKartlar(secilenKartlar.filter(card_id => card_id !== kartId));
    }
  };

  const silSecilenleri = async () => {
    setLoading(true);
    if (secilenKartlar.length === 0) {
      alert("Silmek için en az bir kart seçmelisiniz.");
      setLoading(false);
      return;
    }
    try {
      const deleteRequests = secilenKartlar.map(kartId =>
        fetch(`${API_URL}/card/${kartId}`, { method: 'DELETE' })
      );
      await Promise.all(deleteRequests);

      const guncellenmisKartlar = kartlar.filter(kart => !secilenKartlar.includes(kart.card_id));
      setKartlar(guncellenmisKartlar);
      setSecilenKartlar([]);
    } catch (error) {
      console.error('Silme işlemi sırasında hata oluştu', error);
    }
    setLoading(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleYeniKartEkleModal = () => {
    setIsYeniKartEkleModalOpen(!isYeniKartEkleModalOpen);
  };

  const fetchTeklifListesi = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/teklif`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTeklifler(data);
    } catch (error) {
      console.error('Teklifler API çağrısı başarısız:', error);
    }
    setLoading(false);
  };
  
  const fetchKartListesi = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/card`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setKartlar(data);
    } catch (error) {
      console.error('Kartlar API çağrısı başarısız:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchTeklifListesi();
      await fetchKartListesi();
    };
  
    fetchData();
  }, []);

  const handleKartEkle = async (yeniKart) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(yeniKart),
      });

      if (response.ok) {
        const eklenenKart = await response.json();
        setKartlar([...kartlar, eklenenKart]);
        toggleYeniKartEkleModal();
      } else {
        console.error('Kart eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Kart eklenirken bir hata oluştu:', error);
    }
    setLoading(false);
  };

  const handleTeklifEkle = async (yeniTeklif) => {
    setLoading(true);
    // Boş veya eksik değerleri kontrol et ve varsayılan değerlere ayarla
    const teklif = {
      ...yeniTeklif,
      km: yeniTeklif.km ? parseInt(yeniTeklif.km, 10) : 0, // km alanı eksikse varsayılan olarak 0 ata
      modelYili: yeniTeklif.modelYili ? parseInt(yeniTeklif.modelYili, 10) : 0, // modelYili alanı eksikse varsayılan olarak 0 ata
      adSoyad: yeniTeklif.adSoyad || "Tanımsız", // adSoyad alanı eksikse varsayılan olarak "Tanımsız" ata
      markaModel: yeniTeklif.markaModel || "Tanımsız", // markaModel alanı eksikse varsayılan olarak "Tanımsız" ata
      plaka: yeniTeklif.plaka || "Tanımsız", // plaka alanı eksikse varsayılan olarak "Tanımsız" ata
      sasi: yeniTeklif.sasi || "Tanımsız", // sasi alanı eksikse varsayılan olarak "Tanımsız" ata
      girisTarihi: yeniTeklif.girisTarihi || "Tanımsız", // girisTarihi alanı eksikse varsayılan olarak "Tanımsız" ata
      yapilanlar: yeniTeklif.yapilanlar || [],
    };

    try {
      // Teklifi teklif tablosuna ekle
      const response = await fetch(`${API_URL}/teklif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teklif),
      });

      if (response.ok) {
        const eklenenTeklif = await response.json();
        setTeklifler(prevTeklifler => [...prevTeklifler, eklenenTeklif]);

        // Modalı kapat
        toggleYeniKartEkleModal();
      } else {
        console.error('Teklif eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('İşlem sırasında bir hata oluştu:', error);
    }
    setLoading(false);
  };

  function formatKm(km) {
    return km.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  const filtrelenmisKartlar = kartlar.filter(kart =>
    kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.sasi?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    kart.km?.toString().includes(aramaTerimi) ||
    kart.girisTarihi?.toString().includes(aramaTerimi)
  );


  const parseDate = (str) => {
    if (!str || str.toLowerCase() === "tanımsız") return null;
    const [day, month, year] = str.split('-');
    if (!day || !month || !year) return null;
    const formattedDate = `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return new Date(formattedDate);
  };
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedKartlar = React.useMemo(() => {
    let sortableItems = [...kartlar];
  
    sortableItems.sort((a, b) => {
      if (sortConfig.key === 'girisTarihi') {
        const dateA = parseDate(a.girisTarihi);
        const dateB = parseDate(b.girisTarihi);
  
        if (dateA === null && dateB !== null) return 1;
        if (dateA !== null && dateB === null) return -1;
        if (dateA === null && dateB === null) return 0;
  
        if (dateA < dateB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (dateA > dateB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      } else {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  
    return sortableItems;
  }, [kartlar, sortConfig]);

  const handleExcelDownload = async (kartId) => {
    setLoading(true);

    const kart = kartlar.find(k => k.card_id === kartId);

    if (!kart) {
        console.error("Seçilen kart bulunamadı");
        setLoading(false);
        return;
    }

    const dataToSend = {
        vehicleInfo: {
            adSoyad: kart.adSoyad,
            telNo: kart.telNo,
            markaModel: kart.markaModel,
            plaka: kart.plaka,
            km: kart.km,
            modelYili: kart.modelYili,
            sasi: kart.sasi,
            renk: kart.renk,
            girisTarihi: kart.girisTarihi,
            notlar: kart.notlar,
            adres: kart.adres,
        },
        data: kart.yapilanlar.map(item => ({
            birimAdedi: item.birimAdedi,
            parcaAdi: item.parcaAdi,
            birimFiyati: item.birimFiyati,
            toplamFiyat: item.birimFiyati * item.birimAdedi,
        })),
        notes: kart.notlar
    };

    try {
        const response = await fetchWithAuth(`${API_URL}/excel/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'output.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Excel download error:', error);
    }
    setLoading(false);
};

const handlePDFDownload = async (kartId) => {
  setLoading(true);

  const kart = kartlar.find(k => k.card_id === kartId);

  if (!kart) {
      console.error("Seçilen kart bulunamadı");
      setLoading(false);
      return;
  }

  const dataToSend = {
      vehicleInfo: {
          adSoyad: kart.adSoyad,
          telNo: kart.telNo,
          markaModel: kart.markaModel,
          plaka: kart.plaka,
          km: kart.km,
          modelYili: kart.modelYili,
          sasi: kart.sasi,
          renk: kart.renk,
          girisTarihi: kart.girisTarihi,
          notlar: kart.notlar,
          adres: kart.adres,
      },
      data: kart.yapilanlar.map(item => ({
          birimAdedi: item.birimAdedi,
          parcaAdi: item.parcaAdi,
          birimFiyati: item.birimFiyati,
          toplamFiyat: item.birimFiyati * item.birimAdedi,
      })),
      notes: kart.notlar
  };

  try {
      const response = await fetchWithAuth(`${API_URL}/excel/pdf`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend)
      });

      if (!response.ok) {
          throw new Error('Network response was not ok');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'output.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
  } catch (error) {
      console.error('PDF download error:', error);
  }
  setLoading(false);
};

const secilenKartlariIndir = async (type) => {
  setLoading(true);

  if (secilenKartlar.length === 0) {
      alert("İndirilecek kart bulunamadı");
      setLoading(false);
      return;
  }

  // Seçilen tüm kartları indir
  for (const kartId of secilenKartlar) {
      if (type === 'excel') {
          await handleExcelDownload(kartId);
      } else {
          await handlePDFDownload(kartId);
      }
  }

  setLoading(false);
};


  

  return (
    <>
      <Head>
        <title>BBSM Garage - Kartlar</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz">
          <ul className="space-y-4">
            <li>
              <Link href="#" className="block p-2 text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Kartlar</Link>
            </li>
            <li>
              <Link href="/login/teklif" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Teklif</Link>
            </li>
            <li>
              <Link href="/login/stok" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Stok Takibi</Link>
            </li>
            <li>
              <Link href="/login/bizeulasin" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Bize Ulaşın</Link>
            </li>
            <div className="divider mt-10 mb-10"></div>
            <li>
              <Link href="/" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Çıkış Yap</Link>
            </li>
          </ul>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
          <div className="px-3 py-3 lg:px-5 lg:pl-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button onClick={toggleSidebar} className={`lg:hidden p-3 font-bold text-lg leading-tight antialiased ${isSidebarOpen ? 'hidden' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                <a href="#" className="flex ml-2 md:mr-8 lg:mr-24">
                  <img src="/images/BBSMlogo.png" className="h-16 mr-3" alt="logo" />
                  <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-my-siyah"></span>
                </a>
              </div>
              <div className="flex items-center">
                <button type="button" className="flex items-center text-sm hidden md:flex">
                  <span className="sr-only">Open user menu</span>
                  <p className="text-center text-my-siyah font-semibold items-center pr-8">Yasin Ufuk ORHANLAR</p>
                  <img src="/images/yasin.webp" className="h-16 w-16 rounded-full" alt="Yasin Bey" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="p-6 pt-8 lg:ml-64 ">
          <div className="p-6 mt-20 bg-my-beyaz rounded-3xl">
            <div className="flex items-center pb-4 justify-between">
              <div className="flex items-center">
                <div className="pr-4 items-center ">
                  <div className="flex flex-column sm:flex-row flex-wrap items-center justify-between ">
                    <p className="font-bold text-xl text-my-siyah">Kartlarım</p>
                  </div>
                </div>
              </div>

              {/* Desktop action buttons and search bar - only show on md and up */}
              <div className="flex items-center">
                <div className="hidden md:flex items-center">
                  <div className="items-center bg-red-600 p-2 pl-4 pr-4 rounded-full ml-4">
                    <button onClick={silSecilenleri} className="font-semibold text-my-beyaz text-md">Seçilenleri Sil</button>
                  </div>
                  <div className="items-center bg-green-500 p-2 pl-4 pr-4 rounded-full ml-4">
                    <button onClick={() => secilenKartlariIndir('excel')} className="font-semibold text-my-beyaz text-md">Seçilenleri Excel İndir</button>
                  </div>
                  <div className="items-center bg-orange-600 p-2 pl-4 pr-4 rounded-full ml-4">
                    <button onClick={() => secilenKartlariIndir('pdf')} className="font-semibold text-my-beyaz text-md">Seçilenleri PDF İndir</button>
                  </div>
                </div>
                <div className="items-center bg-my-mavi p-2 pl-4 pr-4 rounded-full ml-4">
                  <button onClick={toggleYeniKartEkleModal} className="font-semibold text-my-beyaz text-md">Yeni Kart Ekle</button>
                </div>
                <div className="hidden md:block pr-4 items-center pl-4">
                  <div className="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between">
                    <label htmlFor="table-search" className="sr-only">Search</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-500 " aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                      <input type="text" id="table-search"
                        className="block p-2 ps-10 text-md text-gray-900 border border-gray-300 rounded-full w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Kartları ara"
                        value={aramaTerimi}
                        onChange={(e) => setAramaTerimi(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-sm text-left text-gray-500 font-medium">
                  <thead className="text-xs text-gray-600 uppercase bg-my-edbeyaz">
                    <tr>
                      <th scope="col" className="p-4"></th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('adSoyad')}>
                        Ad-Soyad {sortConfig.key === 'adSoyad' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('markaModel')}>
                        Marka-Model {sortConfig.key === 'markaModel' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('plaka')}>
                        Plaka {sortConfig.key === 'plaka' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('km')}>
                        Km {sortConfig.key === 'km' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('sasi')}>
                        Şasİ No {sortConfig.key === 'sasi' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('girisTarihi')}>
                        Giriş Tarihi {sortConfig.key === 'girisTarihi' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Görüntüle
                      </th>
                      <th scope="col" className="px-6 py-3">
                        İndİr
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedKartlar.filter(kart =>
                      kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.sasi?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                      kart.km?.toString().includes(aramaTerimi) ||
                      kart.girisTarihi?.toString().includes(aramaTerimi)
                    ).map((kart) => (
                      <tr key={kart.card_id}>
                        <td className="w-4 p-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              checked={secilenKartlar.includes(kart.card_id)}
                              onChange={(e) => handleCheckboxChange(e, kart.card_id)}
                            />
                            <label htmlFor={`checkbox-table-${kart.card_id}`} className="sr-only">checkbox</label>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {capitalizeWords(kart.adSoyad || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4">
                          {capitalizeWords(kart.markaModel || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4 text-green-500">
                          {toUpperCase(kart.plaka || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4">
                          {kart.km !== undefined && kart.km !== null ? formatKm(kart.km) : "Tanımsız"}
                        </td>
                        <td className="px-6 py-4 uppercase">
                          {(kart.sasi || "Tanımsız").length > 17  ? `${toUpperCase((kart.sasi || "Tanımsız").substring(0, 17))}...` : toUpperCase(kart.sasi || "Tanımsız")}
                        </td>
                        <td className="px-6 py-4 text-blue-500">
                          {kart.girisTarihi || "Tanımsız"}
                        </td>
                        <td className="px-6 py-4">
                          <Link href={DetailPage(kart.card_id)} className="bg-yellow-500 p-2 pl-4 pr-4 rounded-full font-medium text-my-siyah hover:underline">Detay</Link>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => handleExcelDownload(kart.card_id)} className="bg-green-500 p-2 pl-4 pr-4 rounded-full font-medium text-my-beyaz hover:underline">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button onClick={() => handlePDFDownload(kart.card_id)} className="bg-orange-600 p-2 pl-4 pr-4 rounded-full font-medium text-my-beyaz hover:underline">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE LAYOUT */}
              <div className="md:hidden">
                {/* Search bar at the top */}
                <div className="w-full mb-2">
                  <input
                    type="text"
                    id="table-search-mobile"
                    className="block w-full p-2 text-md text-gray-900 border border-gray-300 rounded-full bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Kartları ara"
                    value={aramaTerimi}
                    onChange={(e) => setAramaTerimi(e.target.value)}
                  />
                </div>
                {/* Action buttons stacked */}
                <div className="flex flex-col gap-2 w-full mb-4">
                  <button onClick={silSecilenleri} className="w-full bg-red-600 text-white font-semibold py-2 rounded-full">Seçilenleri Sil</button>
                  <button onClick={() => secilenKartlariIndir('excel')} className="w-full bg-green-500 text-white font-semibold py-2 rounded-full">Seçilenleri Excel İndir</button>
                  <button onClick={() => secilenKartlariIndir('pdf')} className="w-full bg-blue-500 text-white font-semibold py-2 rounded-full">Seçilenleri PDF İndir</button>
                </div>
                {/* Card list, full width, white bg, compact */}
                <div className="w-full bg-white">
                  {sortedKartlar.filter(kart =>
                    kart.adSoyad?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.markaModel?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.plaka?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.sasi?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
                    kart.km?.toString().includes(aramaTerimi) ||
                    kart.girisTarihi?.toString().includes(aramaTerimi)
                  ).map((kart) => (
                    <div key={kart.card_id} className="w-full border-b last:border-b-0 px-2 py-2 flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
                        checked={secilenKartlar.includes(kart.card_id)}
                        onChange={(e) => handleCheckboxChange(e, kart.card_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{capitalizeWords(kart.adSoyad || "Tanımsız")}</div>
                        <div className="text-xs text-gray-600 truncate">{capitalizeWords(kart.markaModel || "Tanımsız")}</div>
                        <div className="text-xs text-green-600 font-semibold">{toUpperCase(kart.plaka || "Tanımsız")}</div>
                        <div className="text-xs text-gray-600">{kart.km !== undefined && kart.km !== null ? formatKm(kart.km) : "Tanımsız"} km</div>
                        <div className="text-xs text-blue-500">{kart.girisTarihi || "Tanımsız"}</div>
                      </div>
                      <div className="flex flex-col items-center ml-2 gap-2">
                        <Link href={DetailPage(kart.card_id)} className="text-yellow-500 hover:text-yellow-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <div className="flex gap-2">
                          <button onClick={() => handleExcelDownload(kart.card_id)} className="text-green-500 hover:text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button onClick={() => handlePDFDownload(kart.card_id)} className="text-orange-600 hover:text-orange-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal - moved outside the main content div */}
      {isYeniKartEkleModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative">
            <AnaBilesen 
              onClose={() => setIsYeniKartEkleModalOpen(false)} 
              onKartEkle={handleKartEkle} 
              onTeklifEkle={handleTeklifEkle} 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default withAuth(Kartlar);
