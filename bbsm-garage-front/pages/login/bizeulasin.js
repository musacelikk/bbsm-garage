import { useState } from 'react';
import Head from "next/head";
import Link from "next/link";
import withAuth from '../../withAuth';

function BizeUlasin() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  };

  return (
    <>
      <Head>
        <title>BBSM Garage - Bize Ulaşın</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} bg-white border-r border-gray-200 lg:translate-x-0`} aria-label="Sidebar">
        <div className="h-full px-4 pt-6 pb-4 text-center overflow-y-auto bg-my-beyaz">
          <ul className="space-y-4">
            <li>
              <Link href="/login/kartlar" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Kartlar</Link>
            </li>
            <li>
              <Link href="/login/teklif" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Teklif</Link>
            </li>
            <li>
              <Link href="/login/stok" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Stok Takibi</Link>
            </li>
            <li>
              <Link href="/login/bizeulasin" className="block p-2 f text-md border-2 border-my-açıkgri font-bold text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Bize Ulaşın</Link>
            </li>
            <div className="divider mt-10 mb-10"></div>
            <li>
              <Link href="/" className="block p-2 font-medium text-md text-my-açıkgri focus:border-2 focus:border-my-açıkgri focus:font-bold focus:text-my-4b4b4bgri bg-my-ebbeyaz rounded-xl hover:text-my-beyaz hover:bg-my-siyah group">Çıkış Yap</Link>
            </li>
            </ul>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
            <div className="px-3 py-3 lg:px-5 lg:pl-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button onClick={toggleMenu} className={`lg:hidden p-3 font-bold text-lg leading-tight antialiased ${isOpen && 'hidden'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                  </button>
                  <a href="#" className="flex ml-2 md:mr-8 lg:mr-24">
                    <img src="/images/BBSMlogo.png" className="h-16 mr-3" alt="logo" />
                    <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-my-siyah"></span>
                  </a>
                </div>
                <div className="flex items-center">
                  <button type="button" className="flex items-center text-sm">
                    <span className="sr-only">Open user menu</span>
                    <p className="text-center text-my-siyah font-semibold items-center pr-8">Yasin Ufuk ORHANLAR</p>
                    <img src="/images/yasin.webp" className="h-16 w-16 rounded-full" alt="Yasin Bey" />
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <div className="p-6 pt-8 lg:ml-64">
            <div className="p-6 mt-20 bg-my-beyaz rounded-3xl">
              <div className="block shadow-lg rounded-full bg-my-beyaz p-4 items-center pb-4">
                <p className="font-bold text-xl text-center text-my-siyah">Bize Ulaşın</p>
              </div>
              <div className="grid gap-6 mt-8 mb-4 md:grid-cols-3 text-center">
                <div className="w-full">
                  <p className="text-my-siyah font-bold mb-4">Firma Adı</p>
                  <p className="text-my-beyaz shadow-lg bg-gradient-to-r from-blue-600 to-slate-800 p-2 text-center font-bold rounded-full">BBSM GARAGE</p>
                </div>
                <div className="w-full">
                  <p className="text-my-siyah font-bold mb-4">Web Sitemiz</p>
                  <a className="text-my-beyaz shadow-lg bg-gradient-to-r from-amber-300 to-orange-600 pl-8 p-2 pr-8 text-center font-bold rounded-full" href="http://www.bbsmgarage.com/">Tıkla</a>
                </div>
                <div className="w-full">
                  <p className="text-my-siyah font-bold mb-4">Telefon Numarası</p>
                  <p className="text-my-beyaz shadow-lg bg-gradient-to-r from-green-900 to-lime-600 p-2 text-center font-bold rounded-full">+90 553 323 1993</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
}
export default withAuth(BizeUlasin);
