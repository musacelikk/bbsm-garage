import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  const login = (token) => {
    const userData = { token };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/'); // Giriş sayfasına yönlendirin
  };

  const fetchWithAuth = async (url, options = {}) => {
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
  };

  // JWT token'dan username'i decode et
  const getUsername = () => {
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
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchWithAuth, getUsername, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
