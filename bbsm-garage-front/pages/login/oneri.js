import React, { useState, useEffect } from 'react';
import Head from "next/head";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useToast } from '../../contexts/ToastContext';
import { validateRequired, getErrorMessage } from '../../utils/validation';

function Oneri() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, firmaAdi, refreshProfile } = useProfile();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const { success, error: showError } = useToast();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Öneri Form State
  const [oneriBaslik, setOneriBaslik] = useState('');
  const [sorunTanimi, setSorunTanimi] = useState('');
  const [mevcutCozum, setMevcutCozum] = useState('');
  const [etkiAlani, setEtkiAlani] = useState([]);
  const [ekNot, setEkNot] = useState('');
  const [formGonderildi, setFormGonderildi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Öneri Geçmişi State
  const [oneriGecmisi, setOneriGecmisi] = useState([]);
  const [oneriGecmisiYukleniyor, setOneriGecmisiYukleniyor] = useState(false);
  const [oneriGecmisiGoster, setOneriGecmisiGoster] = useState(false);
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState({});
  
  // Character limits
  const MAX_BASLIK = 100;
  const MAX_SORUN = 500;
  const MAX_COZUM = 500;
  const MAX_EKNOT = 300;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Sidebar için swipe gesture
  const sidebarSwipe = useSwipe(
    null,
    () => setIsSidebarOpen(true),
    null,
    null,
    50
  );

  // Öneri geçmişini yükle
  const fetchOneriGecmisi = async () => {
    setOneriGecmisiYukleniyor(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/oneri`, { method: 'GET' });
      if (response && response.ok) {
        const data = await response.json();
        setOneriGecmisi(data || []);
      }
    } catch (error) {
      console.error('Öneri geçmişi yükleme hatası:', error);
    }
    setOneriGecmisiYukleniyor(false);
  };

  useEffect(() => {
    fetchOneriGecmisi();
  }, []);

  // Form progress hesapla
  const calculateFormProgress = () => {
    let progress = 0;
    if (oneriBaslik.trim()) progress += 20;
    if (sorunTanimi.trim()) progress += 25;
    if (mevcutCozum.trim()) progress += 25;
    if (etkiAlani.length > 0) progress += 20;
    if (ekNot.trim()) progress += 10;
    return progress;
  };

  // Real-time validation
  const validateField = (field, value) => {
    const errors = { ...validationErrors };
    if (field === 'oneriBaslik') {
      if (!value.trim()) {
        errors.oneriBaslik = 'Öneri başlığı gereklidir';
      } else if (value.length > MAX_BASLIK) {
        errors.oneriBaslik = `Başlık en fazla ${MAX_BASLIK} karakter olabilir`;
      } else {
        delete errors.oneriBaslik;
      }
    } else if (field === 'sorunTanimi') {
      if (!value.trim()) {
        errors.sorunTanimi = 'Sorun tanımı gereklidir';
      } else if (value.length > MAX_SORUN) {
        errors.sorunTanimi = `Sorun tanımı en fazla ${MAX_SORUN} karakter olabilir`;
      } else {
        delete errors.sorunTanimi;
      }
    } else if (field === 'mevcutCozum') {
      if (!value.trim()) {
        errors.mevcutCozum = 'Mevcut çözüm yöntemi gereklidir';
      } else if (value.length > MAX_COZUM) {
        errors.mevcutCozum = `Mevcut çözüm en fazla ${MAX_COZUM} karakter olabilir`;
      } else {
        delete errors.mevcutCozum;
      }
    } else if (field === 'etkiAlani') {
      if (value.length === 0) {
        errors.etkiAlani = 'En az bir etki alanı seçmelisiniz';
      } else {
        delete errors.etkiAlani;
      }
    } else if (field === 'ekNot') {
      if (value.length > MAX_EKNOT) {
        errors.ekNot = `Ek not en fazla ${MAX_EKNOT} karakter olabilir`;
      } else {
        delete errors.ekNot;
      }
    }
    setValidationErrors(errors);
  };

  // Etki Alanı Toggle
  const handleEtkiAlaniToggle = (deger) => {
    const newEtkiAlani = etkiAlani.includes(deger)
      ? etkiAlani.filter(item => item !== deger)
      : [...etkiAlani, deger];
    setEtkiAlani(newEtkiAlani);
    validateField('etkiAlani', newEtkiAlani);
  };

  // Form Submit
  const handleOneriSubmit = async (e) => {
    e.preventDefault();
    
    // Validasyon
    validateField('oneriBaslik', oneriBaslik);
    validateField('sorunTanimi', sorunTanimi);
    validateField('mevcutCozum', mevcutCozum);
    validateField('etkiAlani', etkiAlani);
    validateField('ekNot', ekNot);
    
    if (Object.keys(validationErrors).length > 0) {
      showError('Lütfen formdaki hataları düzeltin');
      return;
    }
    
    const baslikValidation = validateRequired(oneriBaslik.trim(), 'Öneri başlığı');
    if (!baslikValidation.valid) {
      showError(baslikValidation.message);
      return;
    }
    
    const sorunValidation = validateRequired(sorunTanimi.trim(), 'Sorun tanımı');
    if (!sorunValidation.valid) {
      showError(sorunValidation.message);
      return;
    }
    
    const cozumValidation = validateRequired(mevcutCozum.trim(), 'Mevcut çözüm yöntemi');
    if (!cozumValidation.valid) {
      showError(cozumValidation.message);
      return;
    }
    
    if (etkiAlani.length === 0) {
      showError('En az bir etki alanı seçmelisiniz');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      const oneriData = {
        oneriBaslik: oneriBaslik.trim(),
        sorunTanimi: sorunTanimi.trim(),
        mevcutCozum: mevcutCozum.trim(),
        etkiAlani: etkiAlani,
        ekNot: ekNot.trim(),
        username: username,
        tarih: new Date().toISOString()
      };

      // Backend'e gönder
      const response = await fetchWithAuth(`${API_URL}/oneri`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(oneriData),
      });

      // fetchWithAuth token yoksa undefined döndürebilir
      if (!response) {
        showError('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }

      if (response.ok) {
        // Formu temizle
        setOneriBaslik('');
        setSorunTanimi('');
        setMevcutCozum('');
        setEtkiAlani([]);
        setEkNot('');
        setValidationErrors({});
        setFormGonderildi(true);
        success('Öneriniz başarıyla gönderildi! İncelendikten sonra size bildirim gönderilecektir.');
        
        // Öneri geçmişini yenile
        await fetchOneriGecmisi();
        
        setTimeout(() => {
          setFormGonderildi(false);
        }, 5000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError(getErrorMessage(errorData.message || errorData));
      }
      
    } catch (error) {
      console.error('Öneri gönderme hatası:', error);
      showError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Durum badge'i için renk
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'pending':
      default:
        return 'Beklemede';
    }
  };

  return (
    <div 
      className="min-h-screen dark-bg-primary"
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Öneri & Ödül Sistemi</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="oneri"
        setIsProfileModalOpen={() => {}}
        setIsChangePasswordModalOpen={() => {}}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <ProtectedPage>
          <div className="p-3 md:p-4 lg:p-6 pt-4 md:pt-6 lg:pt-8 mt-16 lg:ml-64 pb-6 md:pb-8">
            {/* Başlık Bölümü */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold dark-text-primary">
                    Öneri & Ödül Sistemi
                  </h1>
                  <p className="dark-text-secondary text-xs md:text-sm mt-0.5">
                    Önerdiğin özellik kabul edilirse ödül kazan!
                  </p>
                </div>
              </div>
            </div>

            {/* Bildirimler Bölümü */}
            {notifications.length > 0 && (
              <div className="mb-3 md:mb-4 lg:mb-6 dark-card-bg neumorphic-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm md:text-base lg:text-lg font-medium dark-text-primary">Bildirimler</h2>
                      {unreadCount > 0 && (
                        <p className="text-[10px] md:text-xs dark-text-muted">{unreadCount} okunmamış</p>
                      )}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs md:text-sm text-blue-400 hover:text-blue-300 font-medium touch-manipulation min-h-[36px] px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                    >
                      Tümünü Okundu İşaretle
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 md:space-y-2 max-h-56 md:max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-2.5 md:p-3 rounded-lg cursor-pointer transition-all border-2 touch-manipulation ${
                        !notification.isRead
                          ? 'border-blue-500/30 bg-blue-500/10'
                          : 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/30 active:scale-95'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                          !notification.isRead ? 'bg-blue-400' : 'bg-transparent'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold mb-1 ${
                            !notification.isRead ? 'dark-text-primary' : 'dark-text-secondary'
                          }`}>
                            {notification.title || 'Öneri Bildirimi'}
                          </p>
                          <p className="text-xs dark-text-muted line-clamp-2">
                            {notification.message || notification.content}
                          </p>
                          <p className="text-xs dark-text-muted mt-1">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Progress Indicator */}
            <div className="mb-4 md:mb-6 dark-card-bg neumorphic-card rounded-lg md:rounded-xl p-3 md:p-4 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm font-semibold dark-text-primary">Form İlerlemesi</span>
                <span className="text-xs md:text-sm font-semibold dark-text-secondary">{calculateFormProgress()}%</span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full transition-all duration-300 ease-out rounded-full"
                  style={{ 
                    width: `${calculateFormProgress()}%`,
                    background: 'linear-gradient(90deg, #81ADDE 0%, #0A0875 50%, #D43A38 100%)'
                  }}
                ></div>
              </div>
            </div>

            {/* Form */}
            <div className="dark-card-bg neumorphic-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border border-purple-500/20">
              {formGonderildi && (
                <div className="mb-4 p-3 md:p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <div className="flex items-center gap-2 md:gap-3">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs md:text-sm font-semibold text-green-300">Öneriniz başarıyla gönderildi! İnceleme sürecinde size geri dönüş yapılacaktır.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleOneriSubmit} className="space-y-4 md:space-y-5">
                {/* 1. Öneri Başlığı */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs md:text-sm font-semibold dark-text-primary">
                      Öneri Başlığı <span className="text-red-400">*</span>
                    </label>
                    <span className={`text-xs ${oneriBaslik.length > MAX_BASLIK ? 'text-red-400' : 'dark-text-muted'}`}>
                      {oneriBaslik.length}/{MAX_BASLIK}
                    </span>
                  </div>
                  <p className="text-xs dark-text-muted mb-2">Önerdiğin özelliği tek cümleyle özetle.</p>
                  <input
                    type="text"
                    value={oneriBaslik}
                    onChange={(e) => {
                      setOneriBaslik(e.target.value);
                      validateField('oneriBaslik', e.target.value);
                    }}
                    className={`w-full px-3 py-2.5 md:py-2 neumorphic-input rounded-lg dark-text-primary text-sm touch-manipulation min-h-[44px] transition-all ${
                      validationErrors.oneriBaslik ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
                    }`}
                    placeholder="Örn: Otomatik fatura oluşturma özelliği"
                    maxLength={MAX_BASLIK}
                    required
                  />
                  {validationErrors.oneriBaslik && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.oneriBaslik}
                    </p>
                  )}
                </div>

                {/* 2. Sorun Tanımı */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs md:text-sm font-semibold dark-text-primary">
                      Sorun Tanımı <span className="text-red-400">*</span>
                    </label>
                    <span className={`text-xs ${sorunTanimi.length > MAX_SORUN ? 'text-red-400' : 'dark-text-muted'}`}>
                      {sorunTanimi.length}/{MAX_SORUN}
                    </span>
                  </div>
                  <p className="text-xs dark-text-muted mb-2">Bu özellik senin günlük iş akışında hangi sorunu çözüyor?</p>
                  <textarea
                    value={sorunTanimi}
                    onChange={(e) => {
                      setSorunTanimi(e.target.value);
                      validateField('sorunTanimi', e.target.value);
                    }}
                    rows={4}
                    className={`w-full px-3 py-2.5 md:py-2 neumorphic-input rounded-lg dark-text-primary resize-none text-sm touch-manipulation min-h-[120px] transition-all ${
                      validationErrors.sorunTanimi ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
                    }`}
                    placeholder="Bu özellik sayesinde..."
                    maxLength={MAX_SORUN}
                    required
                  />
                  {validationErrors.sorunTanimi && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.sorunTanimi}
                    </p>
                  )}
                </div>

                {/* 3. Mevcut Çözüm Yöntemi */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs md:text-sm font-semibold dark-text-primary">
                      Mevcut Çözüm Yöntemi <span className="text-red-400">*</span>
                    </label>
                    <span className={`text-xs ${mevcutCozum.length > MAX_COZUM ? 'text-red-400' : 'dark-text-muted'}`}>
                      {mevcutCozum.length}/{MAX_COZUM}
                    </span>
                  </div>
                  <p className="text-xs dark-text-muted mb-2">Şu anda bu işi nasıl yapıyorsun?</p>
                  <textarea
                    value={mevcutCozum}
                    onChange={(e) => {
                      setMevcutCozum(e.target.value);
                      validateField('mevcutCozum', e.target.value);
                    }}
                    rows={4}
                    className={`w-full px-3 py-2.5 md:py-2 neumorphic-input rounded-lg dark-text-primary resize-none text-sm touch-manipulation min-h-[120px] transition-all ${
                      validationErrors.mevcutCozum ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
                    }`}
                    placeholder="Şu anda..."
                    maxLength={MAX_COZUM}
                    required
                  />
                  {validationErrors.mevcutCozum && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.mevcutCozum}
                    </p>
                  )}
                </div>

                {/* 4. Etki Alanı */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold dark-text-primary mb-1.5">
                    Etki Alanı <span className="text-red-400">*</span>
                    {etkiAlani.length > 0 && (
                      <span className="ml-2 text-xs dark-text-muted">({etkiAlani.length} seçili)</span>
                    )}
                  </label>
                  <p className="text-xs dark-text-muted mb-2">Bu özellik sana en çok ne kazandırır? (Birden fazla seçebilirsin)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {[
                      { deger: 'zaman', label: 'Zaman', color: 'bg-blue-500/20 border-blue-500/50 text-blue-300' },
                      { deger: 'para', label: 'Para', color: 'bg-green-500/20 border-green-500/50 text-green-300' },
                      { deger: 'hata', label: 'Hata azalması', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' },
                      { deger: 'memnuniyet', label: 'Müşteri memnuniyeti', color: 'bg-purple-500/20 border-purple-500/50 text-purple-300' }
                    ].map((item) => (
                      <button
                        key={item.deger}
                        type="button"
                        onClick={() => handleEtkiAlaniToggle(item.deger)}
                        className={`p-3 md:p-4 rounded-lg transition-all border-2 touch-manipulation min-h-[60px] md:min-h-[70px] active:scale-95 hover:scale-105 flex flex-col items-center justify-center gap-2 ${
                          etkiAlani.includes(item.deger)
                            ? `${item.color} border-2 shadow-lg`
                            : 'border-gray-600/30 bg-gray-700/30 hover:border-purple-500/30 dark-text-primary'
                        }`}
                      >
                        <div className="text-xs md:text-sm font-semibold text-center leading-tight">{item.label}</div>
                        {etkiAlani.includes(item.deger) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  {validationErrors.etkiAlani && (
                    <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.etkiAlani}
                    </p>
                  )}
                </div>

                {/* 5. Ek Not */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs md:text-sm font-semibold dark-text-primary">
                      Ek Not <span className="text-xs dark-text-muted">(Opsiyonel)</span>
                    </label>
                    <span className={`text-xs ${ekNot.length > MAX_EKNOT ? 'text-red-400' : 'dark-text-muted'}`}>
                      {ekNot.length}/{MAX_EKNOT}
                    </span>
                  </div>
                  <p className="text-xs dark-text-muted mb-2">Eklemek istediğin başka bir detay varsa yazabilirsin.</p>
                  <textarea
                    value={ekNot}
                    onChange={(e) => {
                      setEkNot(e.target.value);
                      validateField('ekNot', e.target.value);
                    }}
                    rows={3}
                    className={`w-full px-3 py-2.5 md:py-2 neumorphic-input rounded-lg dark-text-primary resize-none text-sm touch-manipulation min-h-[90px] transition-all ${
                      validationErrors.ekNot ? 'border-red-500/50 ring-2 ring-red-500/20' : ''
                    }`}
                    placeholder="Ek notlarınız..."
                    maxLength={MAX_EKNOT}
                  />
                  {validationErrors.ekNot && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.ekNot}
                    </p>
                  )}
                </div>

                {/* Sabit Bilgi Metni */}
                <div className="p-3 md:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2 md:gap-3">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs md:text-sm dark-text-secondary leading-relaxed">
                      <p className="font-semibold dark-text-primary mb-1">Bilgilendirme:</p>
                      <p>Gönderdiğin öneri incelenir, kabul edilirse seçtiğin ödül otomatik olarak hesabına tanımlanır.</p>
                      <p className="mt-1">Spam, alakasız veya uygulanamaz öneriler reddedilir.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full py-3.5 md:py-4 px-4 bg-gradient-to-r from-blue-600 to-slate-800 text-white rounded-lg hover:from-blue-700 hover:to-slate-900 transition-all font-semibold shadow-lg shadow-blue-900/40 text-sm md:text-base touch-manipulation min-h-[48px] md:min-h-[52px] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-slate-800 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Gönderiliyor...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Öneriyi Gönder</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Öneri Geçmişi Bölümü */}
            {oneriGecmisi.length > 0 && (
              <div className="mt-4 md:mt-6 dark-card-bg neumorphic-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold dark-text-primary">Öneri Geçmişim</h2>
                      <p className="text-xs dark-text-muted">Gönderdiğin önerilerin durumunu takip et</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOneriGecmisiGoster(!oneriGecmisiGoster)}
                    className="text-xs md:text-sm text-purple-400 hover:text-purple-300 font-medium touch-manipulation px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all min-h-[36px]"
                  >
                    {oneriGecmisiGoster ? 'Gizle' : 'Göster'}
                  </button>
                </div>

                {oneriGecmisiGoster && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {oneriGecmisi.map((oneri) => (
                      <div
                        key={oneri.id}
                        className="p-3 md:p-4 rounded-lg border-2 border-gray-600/30 bg-gray-700/20 hover:border-purple-500/30 hover:bg-gray-700/30 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-semibold dark-text-primary mb-1 truncate">
                              {oneri.oneriBaslik}
                            </h3>
                            <p className="text-xs dark-text-muted line-clamp-2 mb-2">
                              {oneri.sorunTanimi}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs dark-text-muted">
                              <span>
                                {oneri.tarih ? new Date(oneri.tarih).toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''}
                              </span>
                              {oneri.etkiAlani && oneri.etkiAlani.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{oneri.etkiAlani.length} etki alanı</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(oneri.status)}`}>
                            {getStatusText(oneri.status)}
                          </div>
                        </div>
                        {oneri.admin_response && (
                          <div className={`mt-3 p-2.5 rounded-lg text-xs ${
                            oneri.status === 'approved' 
                              ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                              : oneri.status === 'rejected'
                              ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                              : 'bg-blue-500/10 border border-blue-500/20 text-blue-300'
                          }`}>
                            <p className="font-semibold mb-1">Yanıt:</p>
                            <p>{oneri.admin_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </ProtectedPage>
      </div>

    </div>
  );
}

export default withAuth(Oneri);
