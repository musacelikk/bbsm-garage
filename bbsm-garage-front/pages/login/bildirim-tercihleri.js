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
import { useTheme } from '../../contexts/ThemeContext';

function BildirimTercihleri() {
  const { fetchWithAuth, getUsername, logout } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const { activeTheme } = useTheme();
  const { success, error: showError } = useToast();
  const username = getUsername() || 'Kullanıcı';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
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
  }, []);

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

  const handleSave = async () => {
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
        <title>BBSM Garage - Bildirim Tercihleri</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activePage="bildirim-tercihleri"
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
              <h1 className="text-xl md:text-2xl font-semibold dark-text-primary mb-4 md:mb-6">Bildirim Tercihleri</h1>

              <div className="space-y-6">
                {/* Genel Ayarlar */}
                <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                  <h2 className="text-lg font-medium dark-text-primary mb-4">Genel Ayarlar</h2>
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
                <div className="dark-card-bg neumorphic-inset rounded-lg p-4 md:p-6">
                  <h2 className="text-lg font-medium dark-text-primary mb-4">Bildirim Türleri</h2>
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
                    onClick={handleSave}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 transition-all touch-manipulation min-h-[44px] active:scale-95 disabled:opacity-50 ${activeTheme === 'modern' ? 'text-gray-900' : 'text-white'}`}
                  >
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ProtectedPage>
      </div>

    </div>
  );
}

export default withAuth(BildirimTercihleri);
