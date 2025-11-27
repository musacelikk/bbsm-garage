import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { useAuth } from '../auth-context';
import { useLoading } from './_app';
import { API_URL } from '../config';

export default function Home() {
  const { loading, setLoading } = useLoading();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
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
      console.log('Login attempt with:', { username: username.trim() });
      
      const response = await fetch(`${API_URL}/auth/control`, {
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

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Login response:', data);
      
      if (response.ok && data.result) {
        login(data.token);
        // Smooth geçiş için kısa bir gecikme
        setTimeout(() => {
          router.push('/login/kartlar');
        }, 300);
      } else {
        console.error('Login failed:', data);
        alert('Kullanıcı adı veya şifre hatalı! Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Giriş hatası:', error);
      if (error.message.includes('Failed to fetch')) {
        alert('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
      } else if (error.message.includes('NetworkError')) {
        alert('Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        alert('Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>BBSM Garage</title>
        <link rel="icon" href="/BBSM.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="form-container bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl shadow-lg w-full max-w-sm">
            <h1 className="font-extrabold text-transparent text-2xl sm:text-3xl bg-clip-text bg-gradient-to-r from-blue-400 via-blue-900 to-red-600 text-center">Hoş Geldiniz!</h1>
            <h2 className="text-xl sm:text-2xl font-bold text-my-beyaz mb-4 text-center">Giriş Yapınız</h2>
            
            <div className="space-y-2 sm:space-y-4">
              <div>
                <p className="font-semibold text-my-beyaz">Kullanıcı Adı</p>
                <input 
                  className="w-full p-2 mt-1 rounded-xl border border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300" 
                  type="text" 
                  placeholder="Kullanıcı Adı" 
                  value={username} 
                  onChange={handleUsernameChange}
                  required
                />
              </div>
              
              <div>
                <p className="font-semibold text-my-beyaz">Şifre</p>
                <input 
                  className="w-full p-2 mt-1 rounded-xl border border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300" 
                  type="password" 
                  placeholder="Şifre" 
                  value={password} 
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6">
              <Link 
                href="/kayit" 
                className="flex-1 p-2 font-semibold rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah hover:bg-my-4b4b4bgri text-center transition-all duration-300 ease-in-out"
              >
                <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-my-beyaz to-my-açıkgri">
                  Kayıt Ol
                </p>
              </Link>
              <button 
                type="submit" 
                className="flex-1 p-2 font-semibold rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah text-my-beyaz hover:bg-my-4b4b4bgri disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-my-siyah disabled:hover:transform-none transition-all duration-300 ease-in-out"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-blue-400 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-blue-400 to-blue-900">
                      Giriş Yapılıyor...
                    </p>
                  </div>
                ) : (
                  <p className="font-extrabold text-transparent text-sm sm:text-lg bg-clip-text bg-gradient-to-r from-blue-400 to-blue-900">
                    Giriş Yap
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
