import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from './_app';
import { API_URL } from '../config';

export default function Kayit() {
  const { loading, setLoading } = useLoading();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firmaAdi: '',
    yetkiliKisi: '',
    telefon: '',
    email: '',
    adres: '',
    vergiNo: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validasyonlar
    if (formData.password !== formData.confirmPassword) {
      alert('Şifreler eşleşmiyor!');
      setLoading(false);
      return;
    }

    if (formData.password.length < 3) {
      alert('Şifre en az 3 karakter olmalıdır!');
      setLoading(false);
      return;
    }

    if (!formData.firmaAdi.trim()) {
      alert('Firma adı zorunludur!');
      setLoading(false);
      return;
    }

    if (!formData.username.trim()) {
      alert('Kullanıcı adı zorunludur!');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          username: formData.username.trim(),
          password: formData.password.trim(),
          firmaAdi: formData.firmaAdi.trim() || null,
          yetkiliKisi: formData.yetkiliKisi.trim() || null,
          telefon: formData.telefon.trim() || null,
          email: formData.email.trim() || null,
          adres: formData.adres.trim() || null,
          vergiNo: formData.vergiNo.trim() || null
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Kayıt başarılı! Hesabınız yönetici onayı bekliyor. Onaylandıktan sonra giriş yapabilirsiniz.');
        router.push('/');
      } else {
        const errorMessage = data.message || 'Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.';
        alert(errorMessage);
      }
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        alert('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error.message.includes('NetworkError')) {
        alert('Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        alert('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>BBSM Garage - Kayıt Ol</title>
        <link rel="icon" href="/BBSM.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 py-8">
          <form onSubmit={handleSubmit} className="form-container bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h1 className="font-extrabold text-transparent text-2xl sm:text-3xl bg-clip-text bg-gradient-to-r from-blue-400 via-blue-900 to-red-600 text-center mb-2">BBSM GARAGE</h1>
            <h2 className="text-xl sm:text-2xl font-bold text-my-beyaz mb-6 text-center">Firma Kayıt Formu</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="form-section border-b border-my-açıkgri pb-3">
                <h3 className="text-lg font-bold text-my-beyaz mb-3">Firma Bilgileri</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Firma Adı <span className="text-red-400">*</span></p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="text" 
                      placeholder="Firma Adı" 
                      name="firmaAdi"
                      value={formData.firmaAdi} 
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Vergi No</p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="text" 
                      placeholder="Vergi Numarası" 
                      name="vergiNo"
                      value={formData.vergiNo} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section border-b border-my-açıkgri pb-3">
                <h3 className="text-lg font-bold text-my-beyaz mb-3">İletişim Bilgileri</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Yetkili Kişi</p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="text" 
                      placeholder="Yetkili Kişi Adı" 
                      name="yetkiliKisi"
                      value={formData.yetkiliKisi} 
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Telefon</p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="tel" 
                      placeholder="05XX XXX XX XX" 
                      name="telefon"
                      value={formData.telefon} 
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="font-semibold text-my-beyaz text-sm mb-1">E-posta</p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="email" 
                      placeholder="ornek@firma.com" 
                      name="email"
                      value={formData.email} 
                      onChange={handleChange}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Adres</p>
                    <textarea 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      rows="2"
                      placeholder="Firma Adresi" 
                      name="adres"
                      value={formData.adres} 
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section pb-3">
                <h3 className="text-lg font-bold text-my-beyaz mb-3">Giriş Bilgileri</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Kullanıcı Adı <span className="text-red-400">*</span></p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="text" 
                      placeholder="Kullanıcı Adı" 
                      name="username"
                      value={formData.username} 
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Şifre <span className="text-red-400">*</span></p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="password" 
                      placeholder="Şifre (min. 3 karakter)" 
                      name="password"
                      value={formData.password} 
                      onChange={handleChange}
                      required
                      minLength={3}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="font-semibold text-my-beyaz text-sm mb-1">Şifre Tekrar <span className="text-red-400">*</span></p>
                    <input 
                      className="w-full p-2 rounded-xl border border-my-açıkgri bg-white/90 text-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" 
                      type="password" 
                      placeholder="Şifre Tekrar" 
                      name="confirmPassword"
                      value={formData.confirmPassword} 
                      onChange={handleChange}
                      required
                      minLength={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6">
              <Link 
                href="/" 
                className="flex-1 p-2 font-semibold rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah hover:bg-my-4b4b4bgri text-center transition-all duration-300 ease-in-out"
              >
                <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-my-beyaz to-my-açıkgri">
                  İptal
                </p>
              </Link>
              <button 
                type="submit" 
                className="flex-1 p-3 font-semibold rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah text-my-beyaz hover:bg-my-4b4b4bgri disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-my-siyah disabled:hover:transform-none transition-all duration-300 ease-in-out"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-blue-400 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-blue-400 to-blue-900">
                      Kayıt Yapılıyor...
                    </p>
                  </div>
                ) : (
                  <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-blue-400 to-blue-900">
                    Kayıt Ol
                  </p>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
