import React from 'react';
import Link from 'next/link';

const Sidebar = ({ isOpen, onClose, activePage, profileData }) => {
  // Kilitli sayfalar (üyelik sayfası hariç)
  const lockedPages = ['dashboard', 'kartlar', 'teklif', 'stok', 'gelir', 'son-hareketler', 'bizeulasin'];
  
  // Üyelik kontrolü
  const hasMembership = profileData?.membership_end_date ? true : false;
  
  const menuItems = [
    { href: '/login/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/login/kartlar', label: 'Kartlar', key: 'kartlar' },
    { href: '/login/teklif', label: 'Teklif', key: 'teklif' },
    { href: '/login/stok', label: 'Stok Takibi', key: 'stok' },
    { href: '/login/gelir', label: 'Gelir Raporu', key: 'gelir' },
    { href: '/login/son-hareketler', label: 'Son Hareketler', key: 'son-hareketler' },
    { href: '/login/bizeulasin', label: 'Bize Ulaşın', key: 'bizeulasin' },
    { href: '/login/uyelik', label: 'Üyelik', key: 'uyelik' },
  ];

  const getLinkClassName = (key) => {
    const isLocked = lockedPages.includes(key) && !hasMembership;
    const baseClass = `block p-3 font-medium text-md ${isLocked ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-my-açıkgri'} focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl ${isLocked ? '' : 'hover:text-my-beyaz hover:bg-my-siyah'} group active:scale-95 transition-transform`;
    
    if (activePage === key) {
      return `block p-3 text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl ${isLocked ? '' : 'hover:text-my-beyaz hover:bg-my-siyah'} group active:scale-95 transition-transform`;
    }
    
    return baseClass;
  };
  
  const isPageLocked = (key) => {
    return lockedPages.includes(key) && !hasMembership;
  };

  return (
    <>
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-all duration-500 ease-out ${isOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full sidebar-exit'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={onClose}
          />
        )}
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz relative z-40">
          <ul className="space-y-4">
            {menuItems.map((item) => (
              <li key={item.key}>
                {isPageLocked(item.key) ? (
                  <div className={getLinkClassName(item.key)}>
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href={item.href} 
                    className={getLinkClassName(item.key)}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

