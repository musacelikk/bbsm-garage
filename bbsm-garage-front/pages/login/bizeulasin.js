import { useState, useEffect } from 'react';
import Head from "next/head";
import Link from "next/link";
import { useLoading } from '../_app';
import withAuth from '../../withAuth';
import { useAuth } from '../../auth-context';
import { API_URL } from '../../config';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import ProtectedPage from '../../components/ProtectedPage';
import { useSwipe } from '../../hooks/useTouchGestures';
import { useProfile } from '../../contexts/ProfileContext';

function BizeUlasin() {
  const { getUsername, logout, fetchWithAuth } = useAuth();
  const { loading, setLoading } = useLoading();
  const { profileData, refreshProfile } = useProfile();
  const username = getUsername() || 'Kullanıcı';
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMenu = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormStatus({ type: 'success', message: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormStatus({ type: 'error', message: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' });
      }
    } catch (error) {
      setFormStatus({ type: 'error', message: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Sidebar için swipe gesture
  const sidebarSwipe = useSwipe(
    null,
    () => setIsOpen(true),
    null,
    null,
    50
  );

  return (
    <div {...sidebarSwipe} className="min-h-screen dark-bg-primary">
      <Head>
        <title>BBSM Garage - Bize Ulaşın</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <Sidebar 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        activePage="bizeulasin"
        setIsProfileModalOpen={() => {}}
        setIsChangePasswordModalOpen={() => {}}
        logout={logout}
      />

      <div className="flex-1 flex flex-col">
        <Navbar
          onToggleSidebar={toggleMenu}
          isSidebarOpen={isOpen}  
        />

        <ProtectedPage>
          <div className="p-3 md:p-4 lg:p-6 pt-16 lg:ml-64">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-xl md:text-2xl font-semibold dark-text-primary mb-4 md:mb-6">Bize Ulaşın</h1>

              {/* İletişim Kartları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
                <div className="dark-card-bg neumorphic-card rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-lg mb-3">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium dark-text-muted mb-1.5">Telefon</h3>
                  <a href="tel:+905533231993" className="text-sm font-semibold dark-text-primary hover:text-blue-400 transition-colors">
                    +90 553 323 1993
                  </a>
                </div>

                <div className="dark-card-bg neumorphic-card rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-4">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium dark-text-muted mb-1.5">E-posta</h3>
                  <a href="mailto:info@bbsmgarage.com" className="text-sm font-semibold dark-text-primary hover:text-green-400 transition-colors break-all">
                    info@bbsmgarage.com
                  </a>
                </div>

                <div className="dark-card-bg neumorphic-card rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-lg mb-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium dark-text-muted mb-1.5">Adres</h3>
                  <p className="text-sm font-semibold dark-text-primary">BBSM Garage</p>
                </div>

                <div className="dark-card-bg neumorphic-card rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-center w-10 h-10 bg-orange-500/20 rounded-lg mb-3">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xs font-medium dark-text-muted mb-1.5">Çalışma Saatleri</h3>
                  <p className="text-sm font-semibold dark-text-primary">Pzt - Cmt: 09:00 - 18:00</p>
                  <p className="text-xs dark-text-muted mt-1">Pazar: Kapalı</p>
                </div>
              </div>

              {/* İletişim Formu ve Bilgiler */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* İletişim Formu */}
                <div className="dark-card-bg neumorphic-card rounded-xl p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold dark-text-primary mb-6">Mesaj Gönderin</h2>
                  
                  {formStatus.message && (
                    <div className={`mb-6 p-4 rounded-lg neumorphic-inset ${
                      formStatus.type === 'success' 
                        ? 'bg-green-500/20 text-green-400 border dark-border' 
                        : 'bg-red-500/20 text-red-400 border dark-border'
                    }`}>
                      {formStatus.message}
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold dark-text-primary mb-2">
                        Adınız Soyadınız
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 neumorphic-input rounded-lg dark-text-primary"
                        placeholder="Adınız ve soyadınız"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold dark-text-primary mb-2">
                        E-posta Adresiniz
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 neumorphic-input rounded-lg dark-text-primary"
                        placeholder="ornek@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold dark-text-primary mb-2">
                        Konu
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 neumorphic-input rounded-lg dark-text-primary"
                        placeholder="Mesaj konusu"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold dark-text-primary mb-2">
                        Mesajınız
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows="5"
                        className="w-full px-4 py-3 neumorphic-input rounded-lg dark-text-primary resize-none"
                        placeholder="Mesajınızı buraya yazın..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-slate-800 text-white font-bold py-3 px-6 rounded-lg neumorphic-inset hover:from-blue-700 hover:to-slate-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                    </button>
                  </form>
                </div>

                {/* Ek Bilgiler */}
                <div className="space-y-6">
                  {/* Web Sitesi */}
                  <div className="dark-card-bg neumorphic-card rounded-xl p-6 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold dark-text-primary mb-4">Web Sitemiz</h2>
                    <a 
                      href="http://www.bbsmgarage.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      www.bbsmgarage.com
                    </a>
                  </div>

                  {/* Sosyal Medya */}
                  <div className="dark-card-bg neumorphic-card rounded-xl p-6 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold dark-text-primary mb-4">Sosyal Medya</h2>
                    <div className="flex flex-wrap gap-4">
                      <a
                        href="https://wa.me/905424873202"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors neumorphic-inset"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Hızlı İletişim */}
                  <div className="dark-bg-secondary neumorphic-card rounded-xl p-6 sm:p-8 border dark-border">
                    <h2 className="text-xl sm:text-2xl font-bold dark-text-primary mb-4">Hızlı İletişim</h2>
                    <p className="dark-text-secondary mb-4">
                      Sorularınız için bize ulaşabilirsiniz. Müşteri memnuniyeti bizim önceliğimizdir.
                    </p>
                    <div className="space-y-2">
                      <a
                        href="tel:+905533231993"
                        className="flex items-center gap-3 text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Hemen Ara
                      </a>
                      <a
                        href="https://wa.me/905424873202"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-green-400 hover:text-green-300 font-semibold"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp Mesaj Gönder
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProtectedPage>
      </div>

    </div>
  );
}

export default withAuth(BizeUlasin);

