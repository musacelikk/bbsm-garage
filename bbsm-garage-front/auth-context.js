import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const router = useRouter();
  
  // Idle timeout ayarları (30 dakika = 1800000 ms, uyarı 5 dakika kala = 300000 ms)
  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 dakika
  const WARNING_TIME = 5 * 60 * 1000; // 5 dakika kala uyarı

  const login = useCallback((token) => {
    const userData = { token };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(async (isIdleTimeout = false) => {
    // Modal'ı kapat
    setShowIdleWarning(false);
    
    // Logout logunu kaydet (token varsa)
    const currentUser = user;
    if (currentUser?.token) {
      try {
        const API_URL = typeof window !== 'undefined' 
          ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
          : 'http://localhost:4000';
        
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentUser.token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Logout endpoint hatası logout'u engellemez
        });
      } catch (error) {
        // Logout endpoint hatası logout'u engellemez
        console.error('Logout log kaydetme hatası:', error);
      }
    }
    
    // Idle timeout'tan geldiyse mesaj kaydet
    if (isIdleTimeout) {
      localStorage.setItem('idleLogoutMessage', 'true');
    }
    
    setUser(null);
    localStorage.removeItem('user');
    router.push('/'); // Giriş sayfasına yönlendirin
  }, [user, router]);

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan token'ı kontrol et
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData && userData.token) {
          // Token'ın geçerliliğini kontrol et (basit kontrol - süre kontrolü yapmıyoruz)
          setUser(userData);
        } else {
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Token parse hatası:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Idle timeout kontrolü
  useEffect(() => {
    if (!user?.token) return; // Kullanıcı giriş yapmamışsa çalıştırma

    let idleTimer;
    let warningTimer;
    let lastActivityTime = Date.now();

    // Aktivite tespit fonksiyonu
    const resetIdleTimer = () => {
      lastActivityTime = Date.now();
      setShowIdleWarning(false);
      
      // Mevcut timer'ları temizle
      if (idleTimer) clearTimeout(idleTimer);
      if (warningTimer) clearTimeout(warningTimer);

      // Uyarı timer'ı (1 dakika kala)
      warningTimer = setTimeout(() => {
        setShowIdleWarning(true);
      }, IDLE_TIMEOUT - WARNING_TIME);

      // Logout timer'ı (30 dakika)
      idleTimer = setTimeout(() => {
        logout(true); // Idle timeout'tan geldiğini belirt
      }, IDLE_TIMEOUT);
    };

    // Aktivite event listener'ları
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      // Son aktiviteden bu yana geçen süre kontrolü (1 saniyeden fazla geçmişse reset et)
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity > 1000) {
        resetIdleTimer();
      }
    };

    // Event listener'ları ekle
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // İlk timer'ı başlat
    resetIdleTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (idleTimer) clearTimeout(idleTimer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, [user?.token, logout]);

  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const token = user?.token;
    if (!token) {
      logout();
      return;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // Token geçersiz veya süresi dolmuş, çıkış yap
      logout();
    }

    return response;
  }, [user?.token, logout]);

  // JWT token'dan username'i decode et
  const getUsername = useCallback(() => {
    if (!user?.token) return null;
    try {
      const base64Url = user.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      return payload.username || null;
    } catch (error) {
      console.error('Token decode hatası:', error);
      return null;
    }
  }, [user?.token]);

  // Idle warning modal'ı kapat ve timer'ı sıfırla
  const handleContinueSession = useCallback(() => {
    setShowIdleWarning(false);
    // Timer'ı reset etmek için bir aktivite event'i tetikle
    if (typeof window !== 'undefined') {
      const event = new Event('mousedown');
      document.dispatchEvent(event);
    }
  }, []);

  // Context value'yu memoize et
  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    fetchWithAuth,
    getUsername,
    isLoading
  }), [user, login, logout, fetchWithAuth, getUsername, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      {/* Idle Warning Modal */}
      {showIdleWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
          <div className="dark-card-bg neumorphic-card rounded-2xl md:rounded-3xl max-w-md w-full mx-auto p-4 sm:p-6 md:p-8">
            <div className="text-center">
              <div className="mb-3 sm:mb-4">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold dark-text-primary mb-3 sm:mb-4">Oturum Sonlandırılıyor</h2>
              <p className="text-sm sm:text-base dark-text-secondary mb-4 sm:mb-6 leading-relaxed">
                Uzun süredir işlem yapılmadığı için oturumunuz 5 dakika içinde sonlandırılacak.
                <br className="hidden sm:block" />
                <span className="block sm:hidden mt-2"></span>
                <br className="hidden sm:block" />
                <span className="block sm:hidden mt-2"></span>
                Devam etmek istiyor musunuz?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <button
                  onClick={handleContinueSession}
                  className="w-full sm:w-auto bg-blue-500 text-white font-semibold text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors neumorphic-inset"
                >
                  Devam Et
                </button>
                <button
                  onClick={logout}
                  className="w-full sm:w-auto bg-red-500 text-white font-semibold text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors neumorphic-inset"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
