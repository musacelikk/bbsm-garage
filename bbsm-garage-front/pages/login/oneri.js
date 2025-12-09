import React, { useState } from 'react';
import Head from "next/head";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import ProfileModal from '../../components/ProfileModal';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';
import { useNotification } from '../../contexts/NotificationContext';

function Oneri() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, firmaAdi, refreshProfile } = useProfile();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Öneri Form State
  const [oneriBaslik, setOneriBaslik] = useState('');
  const [sorunTanimi, setSorunTanimi] = useState('');
  const [mevcutCozum, setMevcutCozum] = useState('');
  const [etkiAlani, setEtkiAlani] = useState([]);
  const [ekNot, setEkNot] = useState('');
  const [formGonderildi, setFormGonderildi] = useState(false);

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

  // Etki Alanı Toggle
  const handleEtkiAlaniToggle = (deger) => {
    if (etkiAlani.includes(deger)) {
      setEtkiAlani(etkiAlani.filter(item => item !== deger));
    } else {
      setEtkiAlani([...etkiAlani, deger]);
    }
  };

  // Form Submit
  const handleOneriSubmit = async (e) => {
    e.preventDefault();
    
    // Validasyon
    if (!oneriBaslik.trim() || !sorunTanimi.trim() || !mevcutCozum.trim() || 
        etkiAlani.length === 0) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

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
        alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }

      if (response.ok) {
        // Formu temizle
        setOneriBaslik('');
        setSorunTanimi('');
        setMevcutCozum('');
        setEtkiAlani([]);
        setEkNot('');
        setFormGonderildi(true);
        
        setTimeout(() => {
          setFormGonderildi(false);
        }, 5000);
      } else {
        let errorMessage = 'Bilinmeyen hata';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorData.detail || response.statusText;
        } catch (e) {
          errorMessage = response.statusText || 'Sunucu hatası';
        }
        alert(`Öneri gönderilirken bir hata oluştu: ${errorMessage}`);
      }
      
    } catch (error) {
      console.error('Öneri gönderme hatası:', error);
      alert(`Öneri gönderilirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}. Lütfen tekrar deneyin.`);
    } finally {
      setLoading(false);
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
        setIsProfileModalOpen={setIsProfileModalOpen}
        setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        <ProtectedPage>
          <div className="p-4 md:p-6 pt-6 md:pt-8 mt-16 lg:ml-64 pb-8">
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
              <div className="mb-4 md:mb-6 dark-card-bg neumorphic-card rounded-xl p-4 md:p-6 border border-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center border border-blue-500/30">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold dark-text-primary">Bildirimler</h2>
                      {unreadCount > 0 && (
                        <p className="text-xs dark-text-muted">{unreadCount} okunmamış bildirim</p>
                      )}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Tümünü Okundu İşaretle
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-3 rounded-lg neumorphic-inset cursor-pointer transition-all border-2 ${
                        !notification.isRead
                          ? 'border-blue-500/30 bg-blue-500/10'
                          : 'border-transparent hover:dark-bg-tertiary'
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

            {/* Form */}
            <div className="dark-card-bg neumorphic-card rounded-xl p-4 md:p-6 border border-purple-500/20">
              {formGonderildi && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg neumorphic-inset">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs md:text-sm font-semibold text-green-300">Öneriniz başarıyla gönderildi! İnceleme sürecinde size geri dönüş yapılacaktır.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleOneriSubmit} className="space-y-4">
                {/* 1. Öneri Başlığı */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold dark-text-primary mb-1.5">
                    Öneri Başlığı <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs dark-text-muted mb-2">Önerdiğin özelliği tek cümleyle özetle.</p>
                  <input
                    type="text"
                    value={oneriBaslik}
                    onChange={(e) => setOneriBaslik(e.target.value)}
                    className="w-full px-3 py-2 neumorphic-input rounded-lg dark-text-primary text-sm"
                    placeholder="Örn: Otomatik fatura oluşturma özelliği"
                    required
                  />
                </div>

                {/* 2. Sorun Tanımı */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold dark-text-primary mb-1.5">
                    Sorun Tanımı <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs dark-text-muted mb-2">Bu özellik senin günlük iş akışında hangi sorunu çözüyor?</p>
                  <textarea
                    value={sorunTanimi}
                    onChange={(e) => setSorunTanimi(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 neumorphic-input rounded-lg dark-text-primary resize-none text-sm"
                    placeholder="Bu özellik sayesinde..."
                    required
                  />
                </div>

                {/* 3. Mevcut Çözüm Yöntemi */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold dark-text-primary mb-1.5">
                    Mevcut Çözüm Yöntemi <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs dark-text-muted mb-2">Şu anda bu işi nasıl yapıyorsun?</p>
                  <textarea
                    value={mevcutCozum}
                    onChange={(e) => setMevcutCozum(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 neumorphic-input rounded-lg dark-text-primary resize-none text-sm"
                    placeholder="Şu anda..."
                    required
                  />
                </div>

                {/* 4. Etki Alanı */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold dark-text-primary mb-1.5">
                    Etki Alanı <span className="text-red-400">*</span>
                  </label>
                  <p className="text-xs dark-text-muted mb-2">Bu özellik sana en çok ne kazandırır? (Birden fazla seçebilirsin)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { deger: 'zaman', emoji: '⏱', label: 'Zaman' },
                      { deger: 'para', emoji: '💸', label: 'Para' },
                      { deger: 'hata', emoji: '✅', label: 'Hata azalması' },
                      { deger: 'memnuniyet', emoji: '📈', label: 'Müşteri memnuniyeti' }
                    ].map((item) => (
                      <button
                        key={item.deger}
                        type="button"
                        onClick={() => handleEtkiAlaniToggle(item.deger)}
                        className={`p-3 rounded-lg neumorphic-inset transition-all border-2 ${
                          etkiAlani.includes(item.deger)
                            ? 'border-purple-500 bg-purple-500/20 dark-bg-tertiary'
                            : 'border-transparent hover:border-purple-500/30'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{item.emoji}</div>
                        <div className="text-[10px] md:text-xs font-semibold dark-text-primary">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Ek Not */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold dark-text-primary mb-1.5">
                    Ek Not <span className="text-xs dark-text-muted">(Opsiyonel)</span>
                  </label>
                  <p className="text-xs dark-text-muted mb-2">Eklemek istediğin başka bir detay varsa yazabilirsin.</p>
                  <textarea
                    value={ekNot}
                    onChange={(e) => setEkNot(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 neumorphic-input rounded-lg dark-text-primary resize-none text-sm"
                    placeholder="Ek notlarınız..."
                  />
                </div>

                {/* Sabit Bilgi Metni */}
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg neumorphic-inset">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-[10px] md:text-xs dark-text-secondary leading-relaxed">
                      <p className="font-semibold dark-text-primary mb-0.5">Bilgilendirme:</p>
                      <p>Gönderdiğin öneri incelenir, kabul edilirse seçtiğin ödül otomatik olarak hesabına tanımlanır.</p>
                      <p className="mt-0.5">Spam, alakasız veya uygulanamaz öneriler reddedilir.</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg neumorphic-inset hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-lg shadow-purple-900/40 text-sm"
                >
                  Öneriyi Gönder
                </button>
              </form>
            </div>
          </div>
        </ProtectedPage>
      </div>

      {/* Profil Bilgileri Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={async () => {
            setIsProfileModalOpen(false);
            setIsEditingProfile(false);
            await refreshProfile();
          }}
          profileData={profileData}
          setProfileData={refreshProfile}
          isEditing={isEditingProfile}
          setIsEditing={setIsEditingProfile}
          fetchWithAuth={fetchWithAuth}
          API_URL={API_URL}
          setLoading={setLoading}
        />
      )}

      {/* Şifre Değiştirme Modal */}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          fetchWithAuth={fetchWithAuth}
          API_URL={API_URL}
          setLoading={setLoading}
        />
      )}
    </div>
  );
}

export default withAuth(Oneri);
