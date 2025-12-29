import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth-context';
import { API_URL } from '../config';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// NotificationProvider içinde useAuth kullanmak için wrapper component
const NotificationProviderContent = ({ children }) => {
  const { fetchWithAuth, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bildirimleri yükle
  const fetchNotifications = useCallback(async () => {
    if (!fetchWithAuth || !user) return;
    
    try {
      const response = await fetchWithAuth(`${API_URL}/notification`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.isRead)?.length || 0);
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  }, [fetchWithAuth, user]);

  // Bildirimleri okundu olarak işaretle
  const markAsRead = useCallback(async (notificationId) => {
    if (!fetchWithAuth) return;
    
    try {
      const response = await fetchWithAuth(`${API_URL}/notification/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error);
    }
  }, [fetchWithAuth]);

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = useCallback(async () => {
    if (!fetchWithAuth) return;
    
    try {
      const response = await fetchWithAuth(`${API_URL}/notification/read-all`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenirken hata:', error);
    }
  }, [fetchWithAuth]);

  // İlk yüklemede ve periyodik olarak bildirimleri çek
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Her 30 saniyede bir kontrol et
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Context value'yu memoize et
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }), [notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const NotificationProvider = ({ children }) => {
  return <NotificationProviderContent>{children}</NotificationProviderContent>;
};
