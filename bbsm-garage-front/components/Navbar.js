import React from 'react';
import CurrencyBar from './CurrencyBar';

function Navbar({ 
  onToggleSidebar,
  isSidebarOpen
}) {

  return (
    <nav className="fixed top-0 left-0 z-40 w-full navbar-bg neumorphic-outset border-b dark-border lg:left-64 lg:w-[calc(100%-16rem)] hover:transform-none">
      <div className="px-3 py-2 lg:px-5">
        <div className="flex items-center justify-between w-full">
          {/* Sol taraf: Logo + BBSM Tech + ServisPanel */}
          <div className="flex items-center flex-shrink-0">
            <button 
              onClick={onToggleSidebar} 
              className={`lg:hidden p-2 font-bold text-lg leading-tight antialiased ${isSidebarOpen ? 'hidden' : ''} neumorphic-inset dark-text-primary active:scale-95 transition-transform touch-manipulation min-w-[40px] min-h-[40px] rounded-lg`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <a href="#" className="flex items-center ml-2">
              <img src="/BBSM.ico" className="h-6 w-6 mr-2" alt="logo" />
              <span className="text-sm sm:text-base font-semibold dark-text-primary whitespace-nowrap">BBSM Tech</span>
              <span className="text-sm sm:text-base font-medium dark-text-secondary ml-2 whitespace-nowrap hidden sm:inline">ServisPanel</span>
            </a>
          </div>

          {/* Orta: Döviz Kurları */}
          <div className="flex-1 flex items-center justify-center px-2 hidden lg:flex">
            <CurrencyBar />
          </div>

          {/* Sağ taraf: Tarih */}
          <div className="flex items-center gap-2 text-xs dark-text-muted flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;

