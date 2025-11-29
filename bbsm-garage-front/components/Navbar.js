import React, { useState } from 'react';
import { API_URL } from '../config';

function Navbar({ 
  firmaAdi, 
  profileData, 
  fetchWithAuth, 
  setIsProfileModalOpen, 
  setProfileData, 
  setIsChangePasswordModalOpen,
  setIsMembershipModalOpen,
  logout,
  onToggleSidebar,
  isSidebarOpen
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleProfileClick = async () => {
    setIsSettingsOpen(false);
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setIsProfileModalOpen(true);
      } else {
        alert('Profil bilgileri yüklenemedi');
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      alert('Profil bilgileri yüklenirken bir hata oluştu');
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onToggleSidebar} 
              className={`lg:hidden p-3 font-bold text-lg leading-tight antialiased ${isSidebarOpen ? 'hidden' : ''} active:scale-95 transition-transform touch-manipulation min-w-[44px] min-h-[44px]`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <a href="#" className="flex ml-2 md:mr-8 lg:mr-24">
              <img src="/images/BBSMlogo.png" className="h-16 mr-3" alt="logo" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-my-siyah"></span>
            </a>
          </div>
          <div className="flex items-center relative">
            <button 
              type="button" 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center text-sm hidden md:flex hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="sr-only">Open user menu</span>
              <p className="text-center text-my-siyah font-semibold items-center pr-8">{firmaAdi}</p>
              <img 
                src={profileData?.profileImage ? `${API_URL}${profileData.profileImage}` : '/images/yasin.webp'} 
                className="h-16 w-16 rounded-full object-cover" 
                alt="Kullanıcı"
                onError={(e) => {
                  e.target.src = '/images/yasin.webp';
                }}
              />
            </button>
            
            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSettingsOpen(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-fade-in">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-my-siyah">{firmaAdi}</p>
                      <p className="text-xs text-gray-500 mt-1">Firma Hesabı</p>
                    </div>
                    <button
                      onClick={handleProfileClick}
                      className="w-full text-left px-4 py-3 text-sm text-my-siyah hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profil Bilgileri
                    </button>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        if (setIsMembershipModalOpen) {
                          setIsMembershipModalOpen(true);
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-my-siyah hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Üyelik
                    </button>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setIsChangePasswordModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-my-siyah hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Şifre Değiştir
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

