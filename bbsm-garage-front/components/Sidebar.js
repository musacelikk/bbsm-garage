import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useProfile } from '../contexts/ProfileContext';
import { API_URL } from '../config';

const Sidebar = ({ isOpen, onClose, activePage, setIsProfileModalOpen, setIsChangePasswordModalOpen, logout }) => {
  const { profileData, firmaAdi, refreshProfile } = useProfile();
  
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
    { 
      href: '/login/ayarlar', 
      label: 'Ayarlar', 
      key: 'ayarlar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
      return `flex items-center gap-3 p-3 text-md font-semibold text-white sidebar-active neumorphic-outset rounded-xl group transition-all shadow-lg`;
    }
    
    return `flex items-center gap-3 p-3 font-medium text-md dark-text-secondary rounded-xl hover:dark-text-primary hover:dark-bg-tertiary group transition-all`;
  };
  
  const isPageLocked = (key) => {
    return lockedPages.includes(key) && !hasMembership;
  };

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
      <aside className={`fixed top-0 left-0 z-50 w-64 h-screen transition-all duration-500 ease-out lg:transition-none ${isOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full sidebar-exit'} sidebar-bg lg:translate-x-0`} aria-label="Sidebar" style={{ boxShadow: '2px 0 10px rgba(0, 0, 0, 0.3)' }}>
        <div className="h-full px-4 pt-6 pb-4 overflow-y-auto sidebar-bg relative z-40 flex flex-col">
          {/* Profil Bölümü */}
          <div className="mb-6 px-2 pt-2">
            <Link href="/login/ayarlar" className="w-full flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer">
              <img 
                src={profileData?.profileImage ? `${API_URL}${profileData.profileImage}` : '/images/yasin.webp'} 
                className="h-14 w-14 rounded-full object-cover border-2 dark-border mb-2" 
                alt="Kullanıcı"
                onError={(e) => {
                  e.target.src = '/images/yasin.webp';
                }}
              />
              <div className="text-center w-full">
                <p className="text-sm font-semibold dark-text-primary break-words leading-tight">{firmaAdi}</p>
              </div>
            </Link>
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

          {/* Çıkış Yap Butonu */}
          <div className="mt-4">
            <button
              onClick={() => {
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors rounded-lg neumorphic-inset"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Çıkış Yap</span>
            </button>
          </div>

          
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

