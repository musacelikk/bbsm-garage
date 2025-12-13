import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useProfile } from '../contexts/ProfileContext';
import { API_URL } from '../config';

const Sidebar = ({ isOpen, onClose, activePage, setIsProfileModalOpen, setIsChangePasswordModalOpen, logout }) => {
  const { profileData, firmaAdi, refreshProfile } = useProfile();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  const handleProfileClick = async () => {
    setIsSettingsOpen(false);
    try {
      const data = await refreshProfile();
      if (data) {
        setIsProfileModalOpen(true);
      } else {
        alert('Profil bilgileri yüklenemedi');
      }
    } catch (error) {
      console.error('Profil yükleme hatası:', error);
      alert('Profil bilgileri yüklenirken bir hata oluştu');
    }
  };
  
  // Kilitli sayfalar (üyelik sayfası hariç)
  const lockedPages = ['dashboard', 'kartlar', 'teklif', 'stok', 'gelir', 'son-hareketler', 'bizeulasin'];
  
  // Üyelik kontrolü
  const hasMembership = profileData?.membership_end_date ? true : false;
  
  const menuItems = [
    { 
      href: '/login/dashboard', 
      label: 'Dashboard', 
      key: 'dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      href: '/login/kartlar', 
      label: 'Kartlar', 
      key: 'kartlar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      href: '/login/teklif', 
      label: 'Teklif', 
      key: 'teklif',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      href: '/login/stok', 
      label: 'Stok Takibi', 
      key: 'stok',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      href: '/login/gelir', 
      label: 'Gelir Raporu', 
      key: 'gelir',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      href: '/login/son-hareketler', 
      label: 'Son Hareketler', 
      key: 'son-hareketler',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      href: '/login/bizeulasin', 
      label: 'Bize Ulaşın', 
      key: 'bizeulasin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      href: '/login/oneri', 
      label: 'Öneri & Ödül', 
      key: 'oneri',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    { 
      href: '/login/uyelik', 
      label: 'Üyelik', 
      key: 'uyelik',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
  ];

  const getLinkClassName = (key) => {
    const isLocked = lockedPages.includes(key) && !hasMembership;
    const isActive = activePage === key;
    
    if (isLocked) {
      return `flex items-center gap-3 p-3 font-medium text-md dark-text-muted opacity-50 cursor-not-allowed rounded-xl transition-all`;
    }
    
    if (isActive) {
      return `flex items-center gap-3 p-3 text-md font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 neumorphic-outset rounded-xl group transition-all shadow-lg`;
    }
    
    return `flex items-center gap-3 p-3 font-medium text-md dark-text-secondary rounded-xl hover:dark-text-primary hover:dark-bg-tertiary group transition-all`;
  };
  
  const isPageLocked = (key) => {
    return lockedPages.includes(key) && !hasMembership;
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSettingsOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => {
            setIsSettingsOpen(false);
            onClose();
          }}
        />
      )}
      <aside className={`fixed top-0 left-0 z-50 w-64 h-screen transition-all duration-500 ease-out lg:transition-none ${isOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full sidebar-exit'} dark-bg-secondary lg:translate-x-0`} aria-label="Sidebar" style={{ boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)' }}>
        <div className="h-full px-4 pt-6 pb-4 overflow-y-auto dark-bg-secondary relative z-40 flex flex-col">
          {/* Profil Bölümü */}
          <div className="mb-8 px-2">
            <div className="relative">
              <button 
                ref={buttonRef}
                type="button" 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="w-full flex items-start gap-3 p-3 rounded-xl neumorphic-inset hover:dark-bg-tertiary transition-all cursor-pointer"
              >
                <img 
                  src={profileData?.profileImage ? `${API_URL}${profileData.profileImage}` : '/images/yasin.webp'} 
                  className="h-10 w-10 rounded-full object-cover border-2 dark-border flex-shrink-0 mt-0.5" 
                  alt="Kullanıcı"
                  onError={(e) => {
                    e.target.src = '/images/yasin.webp';
                  }}
                />
                <div className="flex-1 text-left min-w-0 overflow-hidden">
                  <p className="text-sm font-semibold dark-text-primary break-words leading-tight">{firmaAdi}</p>
                  <p className="text-xs dark-text-muted mt-1">Firma Hesabı</p>
                </div>
                <svg className={`w-4 h-4 dark-text-muted transition-transform flex-shrink-0 mt-1 ${isSettingsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Settings Dropdown */}
              {isSettingsOpen && (
                <div 
                  ref={dropdownRef}
                  className="absolute left-0 top-full mt-2 w-full dark-card-bg neumorphic-outset rounded-lg dark-border z-[60] animate-fade-in"
                >
                    <div className="py-2">
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-3 text-sm dark-text-primary hover:dark-bg-tertiary transition-colors flex items-center gap-3 rounded-lg mx-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil Bilgileri
                      </button>
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          setIsChangePasswordModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-3 text-sm dark-text-primary hover:dark-bg-tertiary transition-colors flex items-center gap-3 rounded-lg mx-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Şifre Değiştir
                      </button>
                      <div className="border-t dark-border my-1"></div>
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center gap-3 rounded-lg mx-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <ul className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <li key={item.key}>
                {isPageLocked(item.key) ? (
                  <div className={getLinkClassName(item.key)}>
                    {item.icon}
                    <span>{item.label}</span>
                    <svg className="w-5 h-5 dark-text-muted ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                ) : (
                  <Link 
                    href={item.href} 
                    className={getLinkClassName(item.key)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Bottom Card - Bilgilendirme */}
          <div className="mt-6 dark-card-bg neumorphic-card rounded-xl p-4 border dark-border glassmorphic">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-semibold dark-text-primary">Son Güncellemeler</h3>
              </div>
              <button className="dark-text-muted hover:dark-text-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs dark-text-secondary">Haftalık raporlarınızı kontrol edin.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

