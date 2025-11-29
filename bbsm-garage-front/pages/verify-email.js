import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { API_URL } from '../config';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Email başarıyla doğrulandı! Giriş yapabilirsiniz.');
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Email doğrulanamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Email doğrulama hatası:', error);
      setStatus('error');
      setMessage('Email doğrulanırken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <>
      <Head>
        <title>BBSM Garage - Email Doğrulama</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>
      <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <div className="form-container bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl shadow-lg w-full max-w-sm">
            {status === 'loading' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <h1 className="text-xl sm:text-2xl font-bold text-my-beyaz mb-2">Email Doğrulanıyor...</h1>
                <p className="text-my-açıkgri">Lütfen bekleyin</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-900/30 border-2 border-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-my-beyaz mb-2">Email Doğrulandı!</h1>
                <p className="text-my-açıkgri mb-6">{message}</p>
                <p className="text-sm text-my-açıkgri">Giriş sayfasına yönlendiriliyorsunuz...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-900/30 border-2 border-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-my-beyaz mb-2">Doğrulama Başarısız</h1>
                <p className="text-my-açıkgri mb-6">{message}</p>
                <Link href="/" className="inline-block px-6 py-3 bg-my-siyah border-2 border-my-4b4b4bgri text-my-beyaz rounded-xl hover:bg-my-4b4b4bgri transition-all duration-300">
                  Giriş Sayfasına Dön
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

