import React, { useState, useEffect } from 'react';
import Head from "next/head";
import { useRouter } from 'next/router';
import { useLoading } from '../_app';
import { API_URL } from '../../config';

function AdminPanel() {
  const { loading, setLoading } = useLoading();
  const router = useRouter();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [membershipRequests, setMembershipRequests] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [oneriler, setOneriler] = useState([]);
  const [selectedOneri, setSelectedOneri] = useState(null);
  const [isOneriModalOpen, setIsOneriModalOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    maxUsers: 100,
    emailNotifications: true,
    smsNotifications: false,
  });

  // Admin kontrolü - sayfa yüklenmeden önce kontrol et
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUserData = localStorage.getItem('adminUser');
    
    if (!adminToken) {
      // Token yoksa hemen login sayfasına yönlendir
      router.replace('/admin/login');
      return;
    }

    // Token varsa kullanıcı bilgisini yükle
    if (adminUserData) {
      try {
        const user = JSON.parse(adminUserData);
        setAdminUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Admin user data parse error:', error);
        // Parse hatası varsa token'ı temizle ve login'e yönlendir
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.replace('/admin/login');
      }
    } else {
      // User data yoksa token'ı temizle ve login'e yönlendir
      localStorage.removeItem('adminToken');
      router.replace('/admin/login');
    }
  }, [router]);

  // Sayfa yüklendiğinde fade-in animasyonu (sadece authenticated ise)
  useEffect(() => {
    if (isAuthenticated) {
      setIsPageLoaded(false);
      const timer = setTimeout(() => {
        setIsPageLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  // Kullanıcıları ve teklifleri yükle
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchMembershipRequests();
      fetchOneriler();
      fetchNotifications();
      // Her 30 saniyede bir teklifleri yenile
      const interval = setInterval(() => {
        fetchMembershipRequests();
        fetchOneriler();
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen hata' }));
        console.error('Kullanıcılar yüklenemedi:', errorData);
        
        if (response.status === 401 || errorData.message?.includes('expired') || errorData.message?.includes('jwt')) {
          alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.replace('/admin/login');
          return;
        }
        
        alert(`Kullanıcılar yüklenirken bir hata oluştu: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Kullanıcılar yükleme hatası:', error);
      
      if (error.message?.includes('expired') || error.message?.includes('jwt')) {
        alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.replace('/admin/login');
        return;
      }
      
      alert(`Kullanıcılar yüklenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      setLoading(true);
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Kullanıcı durumu güncellendi');
        await fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Kullanıcı durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Kullanıcı durumu güncelleme hatası:', error);
      alert('Kullanıcı durumu güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipRequests = async () => {
    try {
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/membership-requests`);
      if (response.ok) {
        const data = await response.json();
        setMembershipRequests(data);
      } else {
        console.error('Teklifler yüklenemedi');
      }
    } catch (error) {
      console.error('Teklifler yükleme hatası:', error);
    }
  };

  const approveRequest = async (requestId) => {
    try {
      setLoading(true);
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/membership-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Teklif onaylandı');
        await fetchMembershipRequests();
        await fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Teklif onaylanamadı');
      }
    } catch (error) {
      console.error('Teklif onaylama hatası:', error);
      alert('Teklif onaylanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async (requestId) => {
    const reason = prompt('Red nedeni (isteğe bağlı):');
    try {
      setLoading(true);
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/membership-requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || undefined }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Teklif reddedildi');
        await fetchMembershipRequests();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Teklif reddedilemedi');
      }
    } catch (error) {
      console.error('Teklif reddetme hatası:', error);
      alert('Teklif reddedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addMembership = async (months, customDate) => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const body = customDate 
        ? { months, customDate } 
        : { months };
      
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/users/${selectedUser.id}/add-membership`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Üyelik eklendi');
        setIsMembershipModalOpen(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Üyelik eklenemedi');
      }
    } catch (error) {
      console.error('Üyelik ekleme hatası:', error);
      alert('Üyelik eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchOneriler = async () => {
    try {
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/oneriler`);
      if (response.ok) {
        const data = await response.json();
        setOneriler(data || []);
      }
    } catch (error) {
      console.error('Öneriler yüklenirken hata:', error);
    }
  };

  const approveOneri = async (oneriId) => {
    try {
      setLoading(true);
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/oneriler/${oneriId}/approve`, {
        method: 'PATCH',
      });

      if (response.ok) {
        alert('Öneri onaylandı ve kullanıcıya bildirim gönderildi.');
        await fetchOneriler();
        setIsOneriModalOpen(false);
        setSelectedOneri(null);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen hata' }));
        alert(`Öneri onaylanırken hata: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Öneri onaylama hatası:', error);
      alert('Öneri onaylanırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const rejectOneri = async (oneriId) => {
    try {
      setLoading(true);
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/oneriler/${oneriId}/reject`, {
        method: 'PATCH',
      });

      if (response.ok) {
        alert('Öneri reddedildi ve kullanıcıya bildirim gönderildi.');
        await fetchOneriler();
        setIsOneriModalOpen(false);
        setSelectedOneri(null);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen hata' }));
        alert(`Öneri reddedilirken hata: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Öneri reddetme hatası:', error);
      alert('Öneri reddedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Admin için bildirimleri çek (tenant_id: 0, username: 'musacelik')
      // Admin token ile notification endpoint'ini çağır
      const response = await fetchWithAdminAuth(`${API_URL}/notification`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data || []);
      } else {
        console.error('Bildirimler yüklenemedi');
      }
    } catch (error) {
      console.error('Bildirimler yükleme hatası:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetchWithAdminAuth(`${API_URL}/notification/${notificationId}/read`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Bildirim okundu işaretlenirken hata:', error);
    }
  };

  const pendingRequestsCount = membershipRequests.filter(r => r.status === 'pending').length;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead && n.type === 'contact_message').length;
  const totalNotificationCount = pendingRequestsCount + unreadNotificationsCount;

  // Eğer authenticate değilse hiçbir şey render etme
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const fetchWithAdminAuth = async (url, options = {}) => {
    const adminToken = localStorage.getItem('adminToken');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
  };

  return (
    <div 
      className={`min-h-screen transition-all duration-1000 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}
    >
      <Head>
        <title>BBSM Garage - Yönetici Paneli</title>
        <link rel="icon" href="/BBSM.ico" />
      </Head>

      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="#" className="flex ml-2 md:mr-8 lg:mr-24">
                <img src="/images/BBSMlogo.png" className="h-16 mr-3" alt="logo" />
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-my-siyah">YÖNETİCİ PANELİ</span>
              </a>
            </div>
            <div className="flex items-center gap-4">
              {adminUser && (
                <p className="text-center text-my-siyah font-semibold items-center">
                  {adminUser.username || 'Yönetici'}
                </p>
              )}
              {/* Bildirim Kutusu */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {totalNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalNotificationCount}
                    </span>
                  )}
                </button>
                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-y-auto">
                    {/* Contact Mesajları */}
                    {notifications.filter(n => n.type === 'contact_message').length > 0 && (
                      <>
                        <div className="p-4 border-b border-gray-200 bg-blue-50">
                          <h3 className="font-semibold text-gray-900">İletişim Mesajları</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {unreadNotificationsCount > 0 
                              ? `${unreadNotificationsCount} okunmamış mesaj`
                              : `${notifications.filter(n => n.type === 'contact_message').length} mesaj`}
                          </p>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {notifications
                            .filter(n => n.type === 'contact_message')
                            .slice(0, 5)
                            .map((notification) => (
                              <div 
                                key={notification.id} 
                                className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                onClick={() => markNotificationAsRead(notification.id)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
                                    <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                    {notification.content && (
                                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                        {notification.content}
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                      {new Date(notification.createdAt).toLocaleString('tr-TR')}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                        {notifications.filter(n => n.type === 'contact_message').length > 5 && (
                          <div className="p-2 border-t border-gray-200 bg-gray-50">
                            <p className="text-xs text-center text-gray-500">
                              {notifications.filter(n => n.type === 'contact_message').length - 5} mesaj daha...
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Üyelik Teklifleri */}
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Üyelik Teklifleri</h3>
                      <p className="text-xs text-gray-500 mt-1">{pendingRequestsCount} bekleyen teklif</p>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {membershipRequests.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Henüz teklif bulunmamaktadır
                        </div>
                      ) : (
                        membershipRequests.map((request) => (
                          <div key={request.id} className={`p-4 hover:bg-gray-50 ${request.status === 'pending' ? 'bg-yellow-50' : ''}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900">{request.username}</p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    request.user_isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {request.user_isActive ? 'Aktif' : 'Pasif'}
                                  </span>
                                </div>
                                {request.user_firmaAdi && (
                                  <p className="text-xs text-gray-500 mb-1">{request.user_firmaAdi}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                  {request.months < 1 
                                    ? `${Math.round(Number(request.months) * 30)} gün`
                                    : `${request.months} ay`} üyelik talep ediyor
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(request.created_at).toLocaleString('tr-TR')}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                request.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {request.status === 'pending' ? 'Bekliyor' : request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                              </span>
                            </div>
                            {request.status === 'pending' && (
                              <div className="space-y-2 mt-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      approveRequest(request.id);
                                      setIsNotificationOpen(false);
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                                  >
                                    Onayla
                                  </button>
                                  <button
                                    onClick={() => {
                                      rejectRequest(request.id);
                                      setIsNotificationOpen(false);
                                    }}
                                    className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                                  >
                                    Reddet
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    const user = users.find(u => u.id === request.user_id);
                                    if (user) {
                                      toggleUserActive(request.user_id, request.user_isActive);
                                    }
                                    setIsNotificationOpen(false);
                                  }}
                                  className={`w-full px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    request.user_isActive
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {request.user_isActive ? 'Kullanıcıyı Pasif Et' : 'Kullanıcıyı Aktif Et'}
                                </button>
                              </div>
                            )}
                            {request.admin_response && (
                              <p className="text-xs text-gray-600 mt-2 italic">{request.admin_response}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6 pt-8 mt-20">
        <div className="p-4 md:p-6 mt-5 bg-my-beyaz rounded-3xl">
          {/* Başlık */}
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-my-siyah">Yönetici Paneli</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Sistem yönetim paneli</p>
          </div>

          {/* Üyelik Teklifleri Listesi */}
          <div className="bg-white rounded-xl shadow-md p-5 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4 md:mb-0">Üyelik Teklifleri</h2>
              <button
                onClick={fetchMembershipRequests}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Yenile
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı Durumu</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Süre</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tarih</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membershipRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-gray-500">
                          Henüz teklif bulunmamaktadır
                        </td>
                      </tr>
                    ) : (
                      membershipRequests.map((request) => (
                        <tr key={request.id} className={`border-b border-gray-100 hover:bg-gray-50 ${request.status === 'pending' ? 'bg-yellow-50' : ''}`}>
                          <td className="py-3 px-4 text-gray-700">{request.id}</td>
                          <td className="py-3 px-4 text-gray-700 font-medium">
                            {request.username}
                            {request.user_firmaAdi && (
                              <span className="block text-xs text-gray-500 mt-1">{request.user_firmaAdi}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${
                                request.user_isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {request.user_isActive ? '✓ Aktif' : '⏸ Pasif'}
                              </span>
                              <button
                                onClick={() => {
                                  const user = users.find(u => u.id === request.user_id);
                                  if (user) {
                                    toggleUserActive(request.user_id, request.user_isActive);
                                  }
                                }}
                                disabled={loading}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  request.user_isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {request.user_isActive ? 'Pasif Et' : 'Aktif Et'}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {request.months < 1 
                              ? `${Math.round(Number(request.months) * 30)} gün`
                              : `${request.months} ay`}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {request.status === 'pending' ? 'Bekliyor' : request.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700 text-sm">
                            {new Date(request.created_at).toLocaleString('tr-TR')}
                          </td>
                          <td className="py-3 px-4">
                            {request.status === 'pending' ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => approveRequest(request.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Onayla
                                </button>
                                <button
                                  onClick={() => rejectRequest(request.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Reddet
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">{request.admin_response || '-'}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Öneriler Listesi */}
          <div className="bg-white rounded-xl shadow-md p-5 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4 md:mb-0">Öneriler</h2>
              <button
                onClick={fetchOneriler}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Yenile
              </button>
            </div>

            {/* Öneri İstatistikleri */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Bekleyen</h3>
                <p className="text-2xl font-bold">{oneriler.filter(o => o.status === 'pending').length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-green-500 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Onaylanan</h3>
                <p className="text-2xl font-bold">{oneriler.filter(o => o.status === 'approved').length}</p>
              </div>
              <div className="bg-gradient-to-br from-red-400 to-red-500 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Reddedilen</h3>
                <p className="text-2xl font-bold">{oneriler.filter(o => o.status === 'rejected').length}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-1">Toplam</h3>
                <p className="text-2xl font-bold">{oneriler.length}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Başlık</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Etki Alanı</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tarih</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oneriler.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500">
                          Henüz öneri bulunmamaktadır
                        </td>
                      </tr>
                    ) : (
                      oneriler.map((oneri) => (
                        <tr key={oneri.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-700 text-sm">{oneri.id}</td>
                          <td className="py-3 px-4 text-gray-700 text-sm">{oneri.username || '-'}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                setSelectedOneri(oneri);
                                setIsOneriModalOpen(true);
                              }}
                              className="text-left text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm max-w-xs truncate"
                            >
                              {oneri.oneriBaslik || '-'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-gray-700 text-sm">
                            {oneri.etkiAlani && Array.isArray(oneri.etkiAlani) 
                              ? oneri.etkiAlani.join(', ') 
                              : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              oneri.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : oneri.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {oneri.status === 'pending' ? 'Bekliyor' : oneri.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700 text-sm">
                            {oneri.tarih ? new Date(oneri.tarih).toLocaleString('tr-TR') : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {oneri.status === 'pending' ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => approveOneri(oneri.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Onayla
                                </button>
                                <button
                                  onClick={() => rejectOneri(oneri.id)}
                                  disabled={loading}
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Reddet
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Öneri Detay Modal */}
          {isOneriModalOpen && selectedOneri && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-my-siyah">Öneri Detayı</h2>
                    <button
                      onClick={() => {
                        setIsOneriModalOpen(false);
                        setSelectedOneri(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı</label>
                      <p className="text-gray-900">{selectedOneri.username || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Başlık</label>
                      <p className="text-gray-900">{selectedOneri.oneriBaslik || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Sorun Tanımı</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedOneri.sorunTanimi || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Mevcut Çözüm</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedOneri.mevcutCozum || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Etki Alanı</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedOneri.etkiAlani && Array.isArray(selectedOneri.etkiAlani) ? (
                          selectedOneri.etkiAlani.map((etki, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                              {etki === 'zaman' ? '⏱ Zaman' : 
                               etki === 'para' ? '💸 Para' : 
                               etki === 'hata' ? '✅ Hata azalması' : 
                               etki === 'memnuniyet' ? '📈 Müşteri memnuniyeti' : etki}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                    {selectedOneri.ekNot && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ek Not</label>
                        <p className="text-gray-900 whitespace-pre-wrap">{selectedOneri.ekNot}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tarih</label>
                      <p className="text-gray-900">
                        {selectedOneri.tarih ? new Date(selectedOneri.tarih).toLocaleString('tr-TR') : '-'}
                      </p>
                    </div>
                    {selectedOneri.status === 'pending' && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => approveOneri(selectedOneri.id)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => rejectOneri(selectedOneri.id)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reddet
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sistem Ayarları */}
          <div className="bg-white rounded-xl shadow-md p-5 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4 md:mb-0">Sistem Ayarları</h2>
              <button
                onClick={() => setIsSystemSettingsOpen(!isSystemSettingsOpen)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isSystemSettingsOpen ? 'Gizle' : 'Göster'}
              </button>
            </div>

            {isSystemSettingsOpen && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700 font-medium">Bakım Modu</span>
                      <input
                        type="checkbox"
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => setSystemSettings({ ...systemSettings, maintenanceMode: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Sistem bakım moduna alınır</p>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Maksimum Kullanıcı Sayısı</label>
                    <input
                      type="number"
                      value={systemSettings.maxUsers}
                      onChange={(e) => setSystemSettings({ ...systemSettings, maxUsers: parseInt(e.target.value, 10) || 100 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700 font-medium">E-posta Bildirimleri</span>
                      <input
                        type="checkbox"
                        checked={systemSettings.emailNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-gray-700 font-medium">SMS Bildirimleri</span>
                      <input
                        type="checkbox"
                        checked={systemSettings.smsNotifications}
                        onChange={(e) => setSystemSettings({ ...systemSettings, smsNotifications: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      // Sistem ayarlarını kaydet (backend endpoint'i eklenebilir)
                      alert('Sistem ayarları kaydedildi (Backend endpoint gerekli)');
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ayarları Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kullanıcılar Listesi */}
          <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4 md:mb-0">Kullanıcılar</h2>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Yenile
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Kullanıcı Adı</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Şifre</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Firma Adı</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Yetkili Kişi</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Telefon</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tenant ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email Doğrulandı</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Durum</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Üyelik Başlangıç</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Üyelik Bitiş</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Üyelik Durum</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => {
                        if (!searchTerm) return true;
                        const search = searchTerm.toLowerCase();
                        return (
                          user.username?.toLowerCase().includes(search) ||
                          user.firmaAdi?.toLowerCase().includes(search) ||
                          user.email?.toLowerCase().includes(search) ||
                          user.tenant_id?.toString().includes(search)
                        );
                      })
                      .map((user) => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-700">{user.id}</td>
                          <td className="py-3 px-4 text-gray-700 font-medium">{user.username || '-'}</td>
                          <td className="py-3 px-4 text-gray-700 font-mono text-sm">{user.password || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{user.firmaAdi || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{user.yetkiliKisi || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{user.email || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{user.telefon || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{user.tenant_id || '-'}</td>
                          <td className="py-3 px-4">
                            {user.emailVerified ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Doğrulandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ✗ Doğrulanmadı
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                ⏸ Pasif
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {user.membership_start_date 
                              ? new Date(user.membership_start_date).toLocaleDateString('tr-TR')
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {user.membership_end_date 
                              ? new Date(user.membership_end_date).toLocaleDateString('tr-TR')
                              : '-'}
                          </td>
                          <td className="py-3 px-4">
                            {user.membership_status === 'active' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Aktif
                              </span>
                            ) : user.membership_status === 'expired' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                ✗ Süresi Dolmuş
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                ⏸ Tanımsız
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => toggleUserActive(user.id, user.isActive)}
                                disabled={loading}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  user.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {user.isActive ? 'Pasif Et' : 'Aktif Et'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsMembershipModalOpen(true);
                                }}
                                disabled={loading}
                                className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Süre Ver
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {users.filter(user => {
                  if (!searchTerm) return true;
                  const search = searchTerm.toLowerCase();
                  return (
                    user.username?.toLowerCase().includes(search) ||
                    user.firmaAdi?.toLowerCase().includes(search) ||
                    user.email?.toLowerCase().includes(search) ||
                    user.tenant_id?.toString().includes(search)
                  );
                }).length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Kullanıcı bulunamadı</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Üyelik Ekleme Modal */}
      {isMembershipModalOpen && selectedUser && (
        <MembershipModal
          user={selectedUser}
          onClose={() => {
            setIsMembershipModalOpen(false);
            setSelectedUser(null);
          }}
          onAdd={addMembership}
          loading={loading}
        />
      )}

      {/* Bildirim kutusu dışına tıklanınca kapat */}
      {isNotificationOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsNotificationOpen(false)}
        ></div>
      )}
    </div>
  );
}

function MembershipModal({ user, onClose, onAdd, loading }) {
  const [selectedMonths, setSelectedMonths] = useState(null);
  const [customDate, setCustomDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customMonths, setCustomMonths] = useState(1);

  const handleSubmit = () => {
    if (useCustomDate) {
      if (!customDate) {
        alert('Lütfen özel tarih seçin');
        return;
      }
      if (!customMonths || customMonths < 1) {
        alert('Lütfen geçerli bir ay sayısı girin');
        return;
      }
      onAdd(customMonths, customDate);
    } else {
      if (!selectedMonths) {
        alert('Lütfen süre seçin');
        return;
      }
      onAdd(selectedMonths, null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-my-siyah">Üyelik Süresi Ver</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">Kullanıcı:</span> {user.username || user.firmaAdi || '-'}
            </p>
            {user.membership_end_date && (
              <p className="text-sm text-gray-600 mb-4">
                Mevcut bitiş: {new Date(user.membership_end_date).toLocaleDateString('tr-TR')}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kullanım Süresi</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 6, 12].map(month => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonths(month);
                      setUseCustomDate(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMonths === month && !useCustomDate
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {month} Ay
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={useCustomDate}
                  onChange={(e) => {
                    setUseCustomDate(e.target.checked);
                    if (e.target.checked) {
                      setSelectedMonths(null);
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold text-gray-700">Özel Gün Gir</span>
              </label>
              {useCustomDate && (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    min="1"
                    value={customMonths}
                    onChange={(e) => setCustomMonths(parseInt(e.target.value) || 1)}
                    placeholder="Ay sayısı"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (!selectedMonths && !useCustomDate)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

