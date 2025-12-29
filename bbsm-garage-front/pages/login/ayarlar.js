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
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';

function Ayarlar() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const { success, error: showError } = useToast();
  const { activeTheme, setActiveTheme } = useTheme();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('profil'); // 'profil', 'sifre', 'tema', 'veri', 'gizlilik'
  
  // Profil form state
  const [profileFormData, setProfileFormData] = useState({
    firmaAdi: '',
    yetkiliKisi: '',
    telefon: '',
    email: '',
    adres: '',
    vergiNo: ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Şifre form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState(''); // '', 'success', 'error'
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  // Gizlilik ayarları
  const [privacySettings, setPrivacySettings] = useState({
    showLogs: true,
    showIPAddresses: false,
    dataSharing: false,
  });


  useEffect(() => {
    loadProfileData();
    loadPrivacySettings();
  }, []);

  useEffect(() => {
    if (profileData) {
      setProfileFormData({
        firmaAdi: profileData.firmaAdi || '',
        yetkiliKisi: profileData.yetkiliKisi || '',
        telefon: profileData.telefon || '',
        email: profileData.email || '',
        adres: profileData.adres || '',
        vergiNo: profileData.vergiNo || ''
      });
    }
  }, [profileData]);

  const loadProfileData = async () => {
    await refreshProfile();
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSave = async () => {
    setProfileError('');
    setProfileSuccess(false);
    setLoading(true);

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileFormData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        await refreshProfile();
        setProfileSuccess(true);
        setIsEditingProfile(false);
        success('Profil başarıyla güncellendi!');
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setProfileError(errorData.message || 'Profil güncellenemedi');
        showError(errorData.message || 'Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      const errorMessage = 'Profil güncellenirken bir hata oluştu';
      setProfileError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  // Şifre güçlülük kontrolü
  const validatePasswordStrength = (password) => {
    if (!password || password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır';
    }

    if (password.length > 128) {
      return 'Şifre en fazla 128 karakter olabilir';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const errors = [];
    if (!hasUpperCase) {
      errors.push('en az bir büyük harf');
    }
    if (!hasLowerCase) {
      errors.push('en az bir küçük harf');
    }
    if (!hasNumbers) {
      errors.push('en az bir sayı');
    }
    if (!hasSpecialChar) {
      errors.push('en az bir özel karakter (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }

    if (errors.length > 0) {
      return `Şifre güvenliği için şunlar gereklidir: ${errors.join(', ')}`;
    }

    return null;
  };

  // Şifre gereksinimlerini kontrol et (görsel gösterim için)
  const getPasswordRequirements = (password) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // Şifre güçlülük kontrolü
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      setPasswordError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('Yeni şifre eski şifre ile aynı olamaz');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        }),
      });

      if (response.ok) {
        setPasswordSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        success('Şifre başarıyla değiştirildi!');
        setTimeout(() => {
          setPasswordSuccess(false);
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Şifre değiştirilemedi' }));
        setPasswordError(errorData.message || 'Şifre değiştirilemedi');
        showError(errorData.message || 'Şifre değiştirilemedi');
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      const errorMessage = 'Şifre değiştirilirken bir hata oluştu';
      setPasswordError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setForgotPasswordStatus('');
    setForgotPasswordMessage('');

    // Email kontrolü
    if (!profileData?.email) {
      setForgotPasswordStatus('error');
      setForgotPasswordMessage('Email adresi kayıtlı değil. Lütfen önce profil ayarlarınızdan email adresinizi ekleyin.');
      setLoading(false);
      return;
    }

    if (!profileData?.emailVerified) {
      setForgotPasswordStatus('error');
      setForgotPasswordMessage('Email adresiniz doğrulanmamış. Lütfen önce email adresinizi doğrulayın.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setForgotPasswordStatus('success');
        setForgotPasswordMessage(data.message || 'Şifre sıfırlama linki email adresinize gönderildi. Lütfen email\'inizi kontrol edin.');
      } else {
        setForgotPasswordStatus('error');
        setForgotPasswordMessage(data.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      setForgotPasswordStatus('error');
      setForgotPasswordMessage('Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const sidebarSwipe = useSwipe(
    null,
    () => setIsSidebarOpen(true),
    null,
    null,
    50
  );

  // Gizlilik ayarları yükleme/kaydetme
  const loadPrivacySettings = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('privacySettings');
      if (saved) {
        try {
          setPrivacySettings(JSON.parse(saved));
        } catch (e) {
          console.error('Gizlilik ayarları yüklenemedi:', e);
        }
      }
    }
  };

  const savePrivacySettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
      success('Gizlilik ayarları kaydedildi!');
    }
  };

  // Veri yedekleme
  const handleDataBackup = async () => {
    setLoading(true);
    try {
      // Excel full export endpoint'i: POST /excel/full-export
      const response = await fetchWithAuth(`${API_URL}/excel/full-export`, { method: 'POST' });
      if (response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bbsm-veri-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        success('Veri yedekleme başarılı!');
      } else {
        showError('Veri yedekleme başarısız.');
      }
    } catch (error) {
      console.error('Veri yedekleme hatası:', error);
      showError('Veri yedekleme başarısız.');
    }
    setLoading(false);
  };

  // Cache temizleme
  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      success('Cache temizlendi!');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div 
      className="min-h-screen dark-bg-primary"
      {...sidebarSwipe}
    >
      <Head>
        <title>BBSM Garage - Ayarlar</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="ayarlar"
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
          <div className="p-3 md:p-4 lg:p-6 pt-4 md:pt-6 lg:pt-8 mt-16 lg:ml-64 dark-bg-primary">
            <div className="p-3 md:p-4 lg:p-6 mt-5 dark-card-bg neumorphic-card rounded-xl md:rounded-2xl lg:rounded-3xl">
              <h1 className="text-base md:text-lg font-semibold dark-text-primary mb-4 md:mb-6">Ayarlar</h1>

              {/* Sekme Navigasyonu */}
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <div className="flex gap-2 md:gap-4 border-b dark-border min-w-max">
                    <button
                      onClick={() => setActiveTab('profil')}
                      className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] whitespace-nowrap ${
                        activeTab === 'profil'
                          ? 'dark-text-primary border-b-2 border-blue-500'
                          : 'dark-text-muted hover:dark-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Profil</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('sifre')}
                      className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] whitespace-nowrap ${
                        activeTab === 'sifre'
                          ? 'dark-text-primary border-b-2 border-blue-500'
                          : 'dark-text-muted hover:dark-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Şifre</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('tema')}
                      className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] whitespace-nowrap ${
                        activeTab === 'tema'
                          ? 'dark-text-primary border-b-2 border-blue-500'
                          : 'dark-text-muted hover:dark-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <span>Tema</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('veri')}
                      className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] whitespace-nowrap ${
                        activeTab === 'veri'
                          ? 'dark-text-primary border-b-2 border-blue-500'
                          : 'dark-text-muted hover:dark-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        <span>Veri</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('gizlilik')}
                      className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] whitespace-nowrap ${
                        activeTab === 'gizlilik'
                          ? 'dark-text-primary border-b-2 border-blue-500'
                          : 'dark-text-muted hover:dark-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Gizlilik</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sekme İçerikleri */}
              <div className="mt-6">
                {/* Profil Sekmesi */}
                {activeTab === 'profil' && (
                  <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium dark-text-primary">Profil Bilgileri</h2>
                      <div className="flex items-center gap-2">
                        {!isEditingProfile && (
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className={`px-4 py-2 text-sm bg-blue-500 rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors flex items-center gap-2 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Düzenle
                          </button>
                        )}
                      </div>
                    </div>

                    {/* E-posta Doğrulama Uyarısı */}
                    {!isEditingProfile && profileData?.email && !profileData?.emailVerified && (
                      <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 dark-border rounded-lg neumorphic-inset">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-yellow-400 mb-1">E-posta Doğrulanmadı</h3>
                            <p className="text-xs text-yellow-300/80">
                              E-posta adresinizi doğrulamak için lütfen e-posta kutunuzu kontrol edin veya yeni bir doğrulama email'i gönderin.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {profileSuccess && (
                      <div className="mb-4 p-3 bg-green-500/20 border dark-border rounded-lg neumorphic-inset">
                        <p className="text-sm text-green-400">Profil başarıyla güncellendi!</p>
                      </div>
                    )}

                    {profileError && (
                      <div className="mb-4 p-3 bg-red-500/20 border dark-border rounded-lg neumorphic-inset">
                        <p className="text-sm text-red-400">{profileError}</p>
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Sistem Bilgileri - Düzenlenemez */}
                      {profileData && (
                        <div className="border-b dark-border pb-4">
                          <h3 className="text-base font-semibold dark-text-primary mb-3">Sistem Bilgileri</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold dark-text-primary mb-1">Kullanıcı Adı</label>
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary">{profileData.username}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold dark-text-primary mb-1">Tenant ID</label>
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary font-mono">{profileData.tenant_id}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Firma Bilgileri */}
                      <div>
                        <h3 className="text-base font-semibold dark-text-primary mb-3">Firma Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold dark-text-primary mb-1">Firma Adı</label>
                            {isEditingProfile ? (
                              <input
                                type="text"
                                name="firmaAdi"
                                value={profileFormData.firmaAdi}
                                onChange={handleProfileChange}
                                className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                                placeholder="Firma Adı"
                              />
                            ) : (
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary">{profileFormData.firmaAdi || 'Belirtilmemiş'}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold dark-text-primary mb-1">Vergi No</label>
                            {isEditingProfile ? (
                              <input
                                type="text"
                                name="vergiNo"
                                value={profileFormData.vergiNo}
                                onChange={handleProfileChange}
                                className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                                placeholder="Vergi Numarası"
                              />
                            ) : (
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary">{profileFormData.vergiNo || 'Belirtilmemiş'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* İletişim Bilgileri */}
                      <div>
                        <h3 className="text-base font-semibold dark-text-primary mb-3">İletişim Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold dark-text-primary mb-1">Yetkili Kişi</label>
                            {isEditingProfile ? (
                              <input
                                type="text"
                                name="yetkiliKisi"
                                value={profileFormData.yetkiliKisi}
                                onChange={handleProfileChange}
                                className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                                placeholder="Yetkili Kişi Adı"
                              />
                            ) : (
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary">{profileFormData.yetkiliKisi || 'Belirtilmemiş'}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-semibold dark-text-primary mb-1">Telefon</label>
                            {isEditingProfile ? (
                              <input
                                type="tel"
                                name="telefon"
                                value={profileFormData.telefon}
                                onChange={handleProfileChange}
                                className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                                placeholder="05XX XXX XX XX"
                              />
                            ) : (
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary">{profileFormData.telefon || 'Belirtilmemiş'}</p>
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold dark-text-primary mb-1">E-posta</label>
                            {isEditingProfile ? (
                              <input
                                type="email"
                                name="email"
                                value={profileFormData.email}
                                onChange={handleProfileChange}
                                className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                                placeholder="ornek@firma.com"
                              />
                            ) : (
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary">{profileFormData.email || 'Belirtilmemiş'}</p>
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold dark-text-primary mb-1">Adres</label>
                            {isEditingProfile ? (
                              <textarea
                                name="adres"
                                value={profileFormData.adres}
                                onChange={handleProfileChange}
                                rows="3"
                                className="w-full p-3 rounded-lg neumorphic-input dark-text-primary resize-none"
                                placeholder="Firma Adresi"
                              />
                            ) : (
                              <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                                <p className="dark-text-primary whitespace-pre-wrap">{profileFormData.adres || 'Belirtilmemiş'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Butonlar */}
                      {isEditingProfile && (
                        <div className="flex justify-end gap-3 pt-4 border-t dark-border">
                          <button
                            onClick={() => {
                              setIsEditingProfile(false);
                              setProfileError('');
                              if (profileData) {
                                setProfileFormData({
                                  firmaAdi: profileData.firmaAdi || '',
                                  yetkiliKisi: profileData.yetkiliKisi || '',
                                  telefon: profileData.telefon || '',
                                  email: profileData.email || '',
                                  adres: profileData.adres || '',
                                  vergiNo: profileData.vergiNo || ''
                                });
                              }
                            }}
                            className="px-6 py-2 border dark-border dark-text-primary rounded-lg neumorphic-inset hover:dark-bg-tertiary transition-colors"
                          >
                            İptal
                          </button>
                          <button
                            onClick={handleProfileSave}
                            disabled={loading}
                            className={`px-6 py-2 bg-blue-500 rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors disabled:opacity-50 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                          >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Şifre Sekmesi */}
                {activeTab === 'sifre' && (
                  <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                    <h2 className="text-lg font-medium dark-text-primary mb-4">Şifre Değiştirme</h2>
                    
                    {passwordSuccess ? (
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <svg className="w-16 h-16 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-green-400">Şifre başarıyla değiştirildi!</p>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                        {passwordError && (
                          <div className="p-3 bg-red-500/20 border dark-border rounded-lg neumorphic-inset">
                            <p className="text-sm text-red-400">{passwordError}</p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-semibold dark-text-primary mb-1">Eski Şifre</label>
                          <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold dark-text-primary mb-1">Yeni Şifre</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                            required
                            minLength={8}
                          />
                          <div className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${newPassword ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-2.5 bg-gray-800/50 rounded-lg border dark-border">
                              <p className="text-xs font-semibold dark-text-primary mb-2">Şifre Gereksinimleri:</p>
                              <div className="space-y-1.5">
                                <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).minLength ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).minLength ? '✓' : '✗'}</span>
                                  <span>En az 8 karakter</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasUpperCase ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasUpperCase ? '✓' : '✗'}</span>
                                  <span>En az bir büyük harf (A-Z)</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasLowerCase ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasLowerCase ? '✓' : '✗'}</span>
                                  <span>En az bir küçük harf (a-z)</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasNumbers ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasNumbers ? '✓' : '✗'}</span>
                                  <span>En az bir sayı (0-9)</span>
                                </div>
                                <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasSpecialChar ? '✓' : '✗'}</span>
                                  <span>En az bir özel karakter (!@#$%^&*()_+-=[]&#123;&#125;|;:,.&#60;&#62;?)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold dark-text-primary mb-1">Yeni Şifre Tekrar</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                            required
                            minLength={8}
                          />
                        </div>

                        <div className="flex gap-3 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setOldPassword('');
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordError('');
                              setPasswordSuccess(false);
                            }}
                            className="flex-1 px-4 py-2 border dark-border dark-text-primary rounded-lg neumorphic-inset hover:dark-bg-tertiary transition-colors"
                          >
                            Temizle
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-2 bg-blue-500 rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors disabled:opacity-50 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                          >
                            {loading ? 'Değiştiriliyor...' : 'Değiştir'}
                          </button>
                        </div>
                      </form>
                    )}
                    
                    {/* Şifremi Unuttum Bölümü */}
                    <div className="mt-8 pt-8 border-t dark-border">
                      <h3 className="text-md font-semibold dark-text-primary mb-4">Şifremi Unuttum</h3>
                      <p className="text-sm dark-text-muted mb-4">
                        Şifrenizi unuttuysanız, kayıtlı email adresinize ({profileData?.email || 'belirtilmemiş'}) şifre sıfırlama linki gönderebiliriz.
                      </p>
                      
                      {!profileData?.email && (
                        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-400 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm text-yellow-400">Email adresi kayıtlı değil. Lütfen önce profil ayarlarınızdan email adresinizi ekleyin.</p>
                          </div>
                        </div>
                      )}

                      
                      {forgotPasswordStatus === 'success' && (
                        <div className="mb-4 p-3 bg-green-500/20 border border-green-400 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-green-400">{forgotPasswordMessage}</p>
                          </div>
                        </div>
                      )}

                      {forgotPasswordStatus === 'error' && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-sm text-red-400">{forgotPasswordMessage}</p>
                          </div>
                        </div>
                      )}

                      <div className="max-w-md">
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={loading || forgotPasswordStatus === 'success' || !profileData?.email || !profileData?.emailVerified}
                          className={`w-full px-4 py-3 bg-blue-500 rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                        >
                          {loading ? 'Gönderiliyor...' : forgotPasswordStatus === 'success' ? 'Email Gönderildi' : 'Şifre Sıfırlama Linki Gönder'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tema Sekmesi */}
                {activeTab === 'tema' && (
                  <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                    <h2 className="text-lg font-medium dark-text-primary mb-4">Tema Ayarları</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-medium dark-text-primary mb-3">Tema Seçimi</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button
                            onClick={async () => {
                              if (activeTheme !== 'classic') {
                                setActiveTheme('classic');
                                // Log kaydı oluştur
                                try {
                                  await fetchWithAuth(`${API_URL}/log/create`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'theme_change', duzenleyen: 'Klasik Tema' })
                                  });
                                } catch (error) {
                                  console.error('Tema değiştirme log kaydetme hatası:', error);
                                }
                              }
                            }}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              activeTheme === 'classic'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'dark-border hover:dark-bg-tertiary'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700"></div>
                              <div>
                                <p className="dark-text-primary font-semibold">Klasik Tema</p>
                                <p className="text-xs dark-text-muted">Mevcut BBSM Garage görünümü</p>
                              </div>
                            </div>
                          </button>

                          <button
                            onClick={async () => {
                              if (activeTheme !== 'modern') {
                                setActiveTheme('modern');
                                // Log kaydı oluştur
                                try {
                                  await fetchWithAuth(`${API_URL}/log/create`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'theme_change', duzenleyen: 'Modern Tema' })
                                  });
                                } catch (error) {
                                  console.error('Tema değiştirme log kaydetme hatası:', error);
                                }
                              }
                            }}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                              activeTheme === 'modern'
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'dark-border hover:dark-bg-tertiary'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white border border-slate-300"></div>
                              <div>
                                <p className="dark-text-primary font-semibold">Modern Tema</p>
                                <p className="text-xs dark-text-muted">Daha aydınlık ve modern görünüm</p>
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="border-t dark-border pt-4">
                        <p className="text-xs dark-text-muted">
                          Tema değişikliği tüm uygulamaya uygulanır ve bir sonraki girişinizde de hatırlanır.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Veri Yönetimi Sekmesi */}
                {activeTab === 'veri' && (
                  <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                    <h2 className="text-lg font-medium dark-text-primary mb-4">Veri Yönetimi</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-medium dark-text-primary mb-3">Veri Yedekleme</h3>
                        <p className="text-sm dark-text-muted mb-4">Tüm verilerinizi yedekleyin ve indirin</p>
                        <button
                          onClick={handleDataBackup}
                          disabled={loading}
                          className={`px-6 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                        >
                          {loading ? 'Yedekleniyor...' : 'Verileri Yedekle ve İndir'}
                        </button>
                      </div>

                      <div className="border-t dark-border pt-6">
                        <h3 className="text-base font-medium dark-text-primary mb-3">Veri İçe Aktarma</h3>
                        <p className="text-sm dark-text-muted mb-4">Excel/CSV dosyasından veri içe aktarın</p>
                        <input
                          type="file"
                          accept=".xlsx,.csv"
                          className="w-full p-2 border dark-border rounded-lg dark-bg-tertiary dark-text-primary"
                        />
                        <button
                          className={`mt-4 px-6 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                        >
                          İçe Aktar
                        </button>
                      </div>

                      <div className="border-t dark-border pt-6">
                        <h3 className="text-base font-medium dark-text-primary mb-3 text-red-400">Tehlikeli İşlemler</h3>
                        <p className="text-sm dark-text-muted mb-4">Tüm verilerinizi kalıcı olarak silin</p>
                        <button
                          className={`px-6 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition-colors ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                          onClick={() => {
                            if (confirm('Tüm verilerinizi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
                              // Silme işlemi
                            }
                          }}
                        >
                          Tüm Verileri Sil
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gizlilik Sekmesi */}
                {activeTab === 'gizlilik' && (
                  <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                    <h2 className="text-lg font-medium dark-text-primary mb-4">Gizlilik ve İzinler</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-medium dark-text-primary mb-3">Log Kayıtları</h3>
                        <label className="flex items-center justify-between cursor-pointer mb-4">
                          <div>
                            <span className="dark-text-primary font-medium">Log Kayıtlarını Görüntüle</span>
                            <p className="text-sm dark-text-muted">Sistem işlem kayıtlarını görüntüleme izni</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacySettings.showLogs}
                            onChange={(e) => setPrivacySettings({ ...privacySettings, showLogs: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="dark-text-primary font-medium">IP Adresi Kayıtlarını Görüntüle</span>
                            <p className="text-sm dark-text-muted">IP adresi bilgilerini görüntüleme izni</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacySettings.showIPAddresses}
                            onChange={(e) => setPrivacySettings({ ...privacySettings, showIPAddresses: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                      </div>

                      <div className="border-t dark-border pt-6">
                        <h3 className="text-base font-medium dark-text-primary mb-3">Veri Paylaşımı</h3>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="dark-text-primary font-medium">Anonim Veri Paylaşımı</span>
                            <p className="text-sm dark-text-muted">Geliştirme için anonim kullanım verileri paylaş</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacySettings.dataSharing}
                            onChange={(e) => setPrivacySettings({ ...privacySettings, dataSharing: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                      </div>

                      <div className="flex justify-end pt-4 border-t dark-border">
                        <button
                          onClick={savePrivacySettings}
                          className={`px-6 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </ProtectedPage>
      </div>

    </div>
  );
}

export default withAuth(Ayarlar);
