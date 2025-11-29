import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import { useLoading } from '../_app';
import { API_URL } from '../../config';

export default function AdminLogin() {
  const { loading, setLoading } = useLoading();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('Admin login attempt with:', { username: username.trim() });
      
      // Yönetici için özel endpoint (backend'de oluşturulacak)
      const response = await fetch(`${API_URL}/auth/admin/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          username: username.trim(),
          password: password.trim()
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.result) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user || { username: username.trim() }));
        
        setIsSuccess(true);
        setSuccessMessage('Giriş başarılı! Yönetici paneline yönlendiriliyorsunuz...');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const formElement = document.querySelector('.admin-login-form');
        if (formElement) {
          formElement.style.opacity = '0';
          formElement.style.transform = 'translateY(-20px)';
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        router.push('/admin/panel');
      } else {
        alert('Kullanıcı adı veya şifre hatalı! Lütfen tekrar deneyin.');
        setLoading(false);
      }
    } catch (error) {
      setIsSuccess(false);
      if (error.message.includes('Failed to fetch')) {
        alert('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error.message.includes('NetworkError')) {
        alert('Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        alert('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>BBSM Garage - Yönetici Girişi</title>
        <link rel="icon" href="/BBSM.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="admin-login-form form-container bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl shadow-lg w-full max-w-sm transition-all duration-500 ease-in-out">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-green-400 animate-scale-in" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-green-400 mb-2 text-center animate-fade-in">Giriş Başarılı!</h2>
                <p className="text-my-beyaz text-center animate-fade-in-delay">{successMessage}</p>
                <div className="mt-6">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-6 w-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-my-açıkgri text-sm">Yönlendiriliyor...</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-extrabold text-transparent text-2xl sm:text-3xl bg-clip-text bg-gradient-to-r from-red-400 via-red-900 to-red-600 text-center">YÖNETİCİ PANELİ</h1>
                <h2 className="text-xl sm:text-2xl font-bold text-my-beyaz mb-4 text-center">Yönetici Girişi</h2>
            
                <div className="space-y-2 sm:space-y-4">
                  <div>
                    <p className="font-semibold text-my-beyaz">Kullanıcı Adı</p>
                    <input 
                      className="w-full p-2 mt-1 rounded-xl border border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300" 
                      type="text" 
                      placeholder="Yönetici Kullanıcı Adı" 
                      value={username} 
                      onChange={handleUsernameChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <p className="font-semibold text-my-beyaz">Şifre</p>
                    <input 
                      className="w-full p-2 mt-1 rounded-xl border border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300" 
                      type="password" 
                      placeholder="Yönetici Şifresi" 
                      value={password} 
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    type="submit" 
                    className="w-full p-2 font-semibold rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah text-my-beyaz hover:bg-my-4b4b4bgri disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-my-siyah disabled:hover:transform-none transition-all duration-300 ease-in-out"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-red-400 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-red-400 to-red-900">
                          Giriş Yapılıyor...
                        </p>
                      </div>
                    ) : (
                      <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-red-400 to-red-900">
                        Yönetici Girişi
                      </p>
                    )}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <a 
                    href="/" 
                    className="text-sm text-blue-300 hover:text-blue-200 font-medium"
                  >
                    Normal Kullanıcı Girişi
                  </a>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

