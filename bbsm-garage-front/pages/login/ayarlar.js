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
import { useToast } from '../../contexts/ToastContext';

function Ayarlar() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const { success, error: showError } = useToast();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('profil'); // 'profil', 'bildirimler', 'sifre'
  
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
  
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    smsEnabled: false,
    oneriApproved: true,
    oneriRejected: true,
    paymentReminder: true,
    maintenanceReminder: true,
  });

  useEffect(() => {
    loadPreferences();
    loadProfileData();
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 3) {
      setPasswordError('Yeni şifre en az 3 karakter olmalıdır');
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

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/notification/preferences`, { method: 'GET' });
      if (response && response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Bildirim tercihleri yükleme hatası:', error);
    }
    setLoading(false);
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/notification/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response && response.ok) {
        success('Bildirim tercihleri başarıyla kaydedildi!');
      } else {
        showError('Bildirim tercihleri kaydedilirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Bildirim tercihleri kaydetme hatası:', error);
      showError('Bildirim tercihleri kaydedilirken bir hata oluştu.');
    }
    setLoading(false);
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
              <h1 className="text-xl md:text-2xl font-semibold dark-text-primary mb-4 md:mb-6">Ayarlar</h1>

              {/* Sekme Navigasyonu */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row gap-2 md:gap-4 border-b dark-border">
                  <button
                    onClick={() => setActiveTab('profil')}
                    className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] ${
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
                    onClick={() => setActiveTab('bildirimler')}
                    className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] ${
                      activeTab === 'bildirimler'
                        ? 'dark-text-primary border-b-2 border-blue-500'
                        : 'dark-text-muted hover:dark-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span>Bildirimler</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('sifre')}
                    className={`px-4 md:px-6 py-3 text-sm md:text-base font-medium transition-all touch-manipulation min-h-[44px] ${
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
                </div>
              </div>

              {/* Sekme İçerikleri */}
              <div className="mt-6">
                {/* Profil Sekmesi */}
                {activeTab === 'profil' && (
                  <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-medium dark-text-primary">Profil Bilgileri</h2>
                      {!isEditingProfile && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Düzenle
                        </button>
                      )}
                    </div>

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
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bildirimler Sekmesi */}
                {activeTab === 'bildirimler' && (
                  <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                    <h2 className="text-lg font-medium dark-text-primary mb-4">Bildirim Ayarları</h2>
                    
                    {/* Genel Ayarlar */}
                    <div className="mb-6">
                      <h3 className="text-base font-medium dark-text-primary mb-3">Genel Ayarlar</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="dark-text-primary">E-posta Bildirimleri</span>
                          <input
                            type="checkbox"
                            checked={preferences.emailEnabled}
                            onChange={(e) => setPreferences({ ...preferences, emailEnabled: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="dark-text-primary">SMS Bildirimleri</span>
                          <input
                            type="checkbox"
                            checked={preferences.smsEnabled}
                            onChange={(e) => setPreferences({ ...preferences, smsEnabled: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Bildirim Türleri */}
                    <div className="mb-6">
                      <h3 className="text-base font-medium dark-text-primary mb-3">Bildirim Türleri</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="dark-text-primary font-medium">Öneri Onaylandı</span>
                            <p className="text-sm dark-text-muted">Öneriniz onaylandığında bildirim alın</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.oneriApproved}
                            onChange={(e) => setPreferences({ ...preferences, oneriApproved: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="dark-text-primary font-medium">Öneri Reddedildi</span>
                            <p className="text-sm dark-text-muted">Öneriniz reddedildiğinde bildirim alın</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.oneriRejected}
                            onChange={(e) => setPreferences({ ...preferences, oneriRejected: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="dark-text-primary font-medium">Ödeme Hatırlatıcısı</span>
                            <p className="text-sm dark-text-muted">Ödeme bekleyen kartlar için hatırlatma alın</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.paymentReminder}
                            onChange={(e) => setPreferences({ ...preferences, paymentReminder: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div>
                            <span className="dark-text-primary font-medium">Bakım Hatırlatıcısı</span>
                            <p className="text-sm dark-text-muted">Periyodik bakım zamanı geldiğinde bildirim alın</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={preferences.maintenanceReminder}
                            onChange={(e) => setPreferences({ ...preferences, maintenanceReminder: e.target.checked })}
                            className="w-5 h-5 rounded"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Kaydet Butonu */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSavePreferences}
                        disabled={loading}
                        className="px-6 py-3 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all touch-manipulation min-h-[44px] active:scale-95 disabled:opacity-50"
                      >
                        {loading ? 'Kaydediliyor...' : 'Bildirim Ayarlarını Kaydet'}
                      </button>
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
                            minLength={3}
                          />
                          <p className="text-xs dark-text-muted mt-1">En az 3 karakter olmalıdır</p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold dark-text-primary mb-1">Yeni Şifre Tekrar</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                            required
                            minLength={3}
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
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Değiştiriliyor...' : 'Değiştir'}
                          </button>
                        </div>
                      </form>
                    )}
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
