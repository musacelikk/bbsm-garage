import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { API_URL } from '../config';
import { useLoading } from './_app';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const { loading, setLoading } = useLoading();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(''); // '', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Geçersiz şifre sıfırlama linki');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setMessage('');

    if (newPassword.length < 3) {
      setStatus('error');
      setMessage('Şifre en az 3 karakter olmalıdır');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token,
          newPassword: newPassword.trim()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Şifreniz başarıyla sıfırlandı! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Şifre sıfırlanamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      setStatus('error');
      setMessage('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>BBSM Garage - Şifre Sıfırlama</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>
      <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <div className="form-container bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl shadow-lg w-full max-w-sm">
            <h1 className="font-extrabold text-transparent text-2xl sm:text-3xl bg-clip-text bg-gradient-to-r from-blue-400 via-blue-900 to-red-600 text-center mb-2">Yeni Şifre Belirle</h1>
            <p className="text-xl sm:text-2xl font-bold text-my-beyaz mb-4 text-center">Yeni şifrenizi girin</p>

            {status === 'success' && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-400 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-300">{message}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-400 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-sm text-red-300">{message}</p>
                </div>
              </div>
            )}

            {!token ? (
              <div className="text-center">
                <p className="text-red-300 mb-4">Geçersiz şifre sıfırlama linki</p>
                <Link href="/forgot-password" className="text-blue-300 hover:text-blue-200 font-medium">
                  Yeni şifre sıfırlama linki iste
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
                <div>
                  <p className="font-semibold text-my-beyaz mb-1">Yeni Şifre</p>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 mt-1 rounded-xl border border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                    placeholder="En az 3 karakter"
                    required
                    minLength={3}
                    disabled={loading || status === 'success'}
                  />
                </div>

                <div>
                  <p className="font-semibold text-my-beyaz mb-1">Yeni Şifre (Tekrar)</p>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2 mt-1 rounded-xl border border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                    placeholder="Şifreyi tekrar girin"
                    required
                    minLength={3}
                    disabled={loading || status === 'success'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || status === 'success'}
                  className="w-full p-2 font-semibold rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah text-my-beyaz hover:bg-my-4b4b4bgri disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-my-siyah transition-all duration-300 ease-in-out mt-4"
                >
                  {loading ? 'Sıfırlanıyor...' : status === 'success' ? 'Şifre Sıfırlandı' : 'Şifreyi Sıfırla'}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-blue-300 hover:text-blue-200 font-medium">
                ← Giriş sayfasına dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

