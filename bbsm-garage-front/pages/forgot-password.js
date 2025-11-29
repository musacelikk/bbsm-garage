import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { API_URL } from '../config';
import { useLoading } from './_app';

export default function ForgotPassword() {
  const router = useRouter();
  const { loading, setLoading } = useLoading();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '', 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setMessage('');

    if (!email.trim()) {
      setStatus('error');
      setMessage('Lütfen email adresinizi girin');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Eğer bu email adresi kayıtlıysa, şifre sıfırlama linki gönderildi. Lütfen email\'inizi kontrol edin.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
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
        <title>BBSM Garage - Şifremi Unuttum</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>
      <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <div className="form-container bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl shadow-lg w-full max-w-sm">
            <h1 className="font-extrabold text-transparent text-2xl sm:text-3xl bg-clip-text bg-gradient-to-r from-blue-400 via-blue-900 to-red-600 text-center mb-2">Şifremi Unuttum</h1>
            <p className="text-xl sm:text-2xl font-bold text-my-beyaz mb-4 text-center">Email adresinize şifre sıfırlama linki göndereceğiz</p>

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

            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
              <div>
                <p className="font-semibold text-my-beyaz mb-1">Email Adresi</p>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mt-1 rounded-xl border border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                  placeholder="ornek@email.com"
                  required
                  disabled={loading || status === 'success'}
                />
              </div>

              <button
                type="submit"
                disabled={loading || status === 'success'}
                className="w-full p-2 font-semibold rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah text-my-beyaz hover:bg-my-4b4b4bgri disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-my-siyah transition-all duration-300 ease-in-out mt-4"
              >
                {loading ? 'Gönderiliyor...' : status === 'success' ? 'Email Gönderildi' : 'Şifre Sıfırlama Linki Gönder'}
              </button>
            </form>

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

