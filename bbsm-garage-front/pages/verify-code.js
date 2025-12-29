import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from './_app';
import { API_URL } from '../config';

export default function VerifyCode() {
  const { loading, setLoading } = useLoading();
  const router = useRouter();
  const { username, email } = router.query;
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleCodeChange = (index, value) => {
    // Sadece rakam kabul et
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Otomatik olarak bir sonraki input'a geç
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace ile geri git
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      setError('');
      // Son input'a focus
      const lastInput = document.getElementById('code-5');
      if (lastInput) {
        lastInput.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setError('Lütfen 6 haneli kodu girin');
      setLoading(false);
      return;
    }

    if (!username) {
      setError('Kullanıcı adı bulunamadı');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          code: codeString
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.message || 'Geçersiz kod. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Kod doğrulama hatası:', error);
      setError('Kod doğrulanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!username) {
      setError('Kullanıcı adı bulunamadı');
      return;
    }

    setIsResending(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: username
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setError('');
        alert('Doğrulama kodu tekrar gönderildi. Lütfen email\'inizi kontrol edin.');
        // Kodu temizle
        setCode(['', '', '', '', '', '']);
        const firstInput = document.getElementById('code-0');
        if (firstInput) {
          firstInput.focus();
        }
      } else {
        setError(data.message || 'Kod gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Kod gönderme hatası:', error);
      setError('Kod gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsResending(false);
    }
  };

  if (!username) {
    return (
      <>
        <Head>
          <title>BBSM Garage - Kod Doğrulama</title>
          <link rel="icon" href="/BBSM.ico" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </Head>
        <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-8 rounded-3xl shadow-lg max-w-md w-full">
              <p className="text-my-beyaz text-xs md:text-sm text-center">Geçersiz sayfa. Lütfen kayıt sayfasından devam edin.</p>
              <Link href="/kayit" className="block text-center mt-3 md:mt-4 text-blue-400 hover:text-blue-300 text-xs md:text-sm underline">
                Kayıt Sayfasına Dön
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>BBSM Garage - Email Doğrulama</title>
        <link rel="icon" href="/BBSM.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-my-home bg-cover bg-center bg-fixed page-enter">
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 py-8">
          <div className="bg-my-siyah border-2 border-my-4b4b4bgri bg-opacity-50 backdrop-blur-sm p-4 sm:p-8 rounded-3xl shadow-lg w-full max-w-md">
            <h1 className="font-extrabold text-transparent text-xl md:text-2xl bg-clip-text bg-gradient-to-r from-blue-400 via-blue-900 to-red-600 text-center mb-2">BBSM GARAGE</h1>
            <h2 className="text-base md:text-lg font-semibold text-my-beyaz mb-4 md:mb-6 text-center">Email Doğrulama</h2>
            
            {success ? (
              <div className="text-center">
                <div className="mb-3 md:mb-4">
                  <svg className="mx-auto h-12 w-12 md:h-16 md:w-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-green-400 font-medium text-sm md:text-base mb-3 md:mb-4">Email başarıyla doğrulandı!</p>
                <p className="text-my-beyaz text-xs md:text-sm mb-3 md:mb-4">Giriş sayfasına yönlendiriliyorsunuz...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 md:mb-6">
                  <p className="text-my-beyaz text-xs md:text-sm text-center mb-2">
                    <strong>{email || username}</strong> adresine gönderilen 6 haneli doğrulama kodunu girin.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-10 h-10 md:w-12 md:h-12 text-center text-lg md:text-xl font-bold rounded-xl border-2 border-my-açıkgri bg-white/90 text-black focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="mb-3 md:mb-4 p-2 md:p-3 bg-red-500/20 border border-red-500 rounded-lg">
                      <p className="text-red-400 text-xs md:text-sm text-center">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium rounded-xl border-2 border-my-4b4b4bgri bg-my-siyah text-my-beyaz hover:bg-my-4b4b4bgri disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out mb-3 md:mb-4"
                    disabled={loading || code.join('').length !== 6}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Doğrulanıyor...</span>
                      </div>
                    ) : (
                      <span>Doğrula</span>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="text-blue-400 hover:text-blue-300 text-xs md:text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? 'Gönderiliyor...' : 'Kodu Tekrar Gönder'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <div className="mt-4 md:mt-6 text-center">
              <Link 
                href="/" 
                className="text-my-beyaz hover:text-blue-400 text-xs md:text-sm underline"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

