import React, { useState, useEffect } from 'react';
import Head from "next/head";
import { useRouter } from 'next/router';
import { useLoading } from '../_app';
import { API_URL } from '../../config';
import { useTheme } from '../../contexts/ThemeContext';

function AdminPanel() {
  const { loading, setLoading } = useLoading();
  const { activeTheme } = useTheme();
  const router = useRouter();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    activeMemberships: 0,
    pendingRequests: 0,
    pendingOneriler: 0,
    unreadNotifications: 0,
    todayActivities: 0,
  });
  // Log Görüntüleme State'leri
  const [systemLogs, setSystemLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({
    action: 'all',
    dateRange: { start: '', end: '' },
  });
  // Klavye Kısayolları State
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  // Filtreleme ve Sayfalama State'leri
  const [userFilters, setUserFilters] = useState({
    status: 'all', // 'all', 'active', 'inactive'
    membershipStatus: 'all', // 'all', 'active', 'expired', 'undefined'
    emailVerified: 'all', // 'all', 'verified', 'unverified'
    dateRange: { start: '', end: '' },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [requestFilters, setRequestFilters] = useState({
    status: 'all', // 'all', 'pending', 'approved', 'rejected'
  });
  const [oneriFilters, setOneriFilters] = useState({
    status: 'all', // 'all', 'pending', 'approved', 'rejected'
  });
  // Kullanıcı Detay State'leri
  const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [userCards, setUserCards] = useState([]);
  const [userTeklifler, setUserTeklifler] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [userDetailTab, setUserDetailTab] = useState('cards');
  // Toplu İşlemler State'leri
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  // Email Gönderme State'leri
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    recipients: [], // 'all', 'selected', 'custom'
    customEmails: '',
    subject: '',
    message: '',
    template: 'custom', // 'custom', 'welcome', 'notification'
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

  // Klavye Kısayolları
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleKeyPress = (e) => {
      // Ctrl/Cmd + K ile kısayolları göster/gizle
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowKeyboardShortcuts(!showKeyboardShortcuts);
      }
      // Ctrl/Cmd + 1-5 ile tab'lar arası geçiş
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = ['dashboard', 'users', 'requests', 'oneriler', 'settings'];
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex]);
        }
      }
      // Escape ile modalları kapat
      if (e.key === 'Escape') {
        if (isEmailModalOpen) {
          setIsEmailModalOpen(false);
        }
        if (isUserDetailModalOpen) {
          setIsUserDetailModalOpen(false);
        }
        if (isOneriModalOpen) {
          setIsOneriModalOpen(false);
        }
        if (isMembershipModalOpen) {
          setIsMembershipModalOpen(false);
        }
        if (isDeleteUserModalOpen) {
          setIsDeleteUserModalOpen(false);
        }
        if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isAuthenticated, showKeyboardShortcuts, isEmailModalOpen, isUserDetailModalOpen, isOneriModalOpen, isMembershipModalOpen, isDeleteUserModalOpen]);

  // Sistem ayarlarını yükle
  useEffect(() => {
    if (isAuthenticated) {
      loadSystemSettings();
    }
  }, [isAuthenticated]);

  // Kullanıcıları ve teklifleri yükle
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchMembershipRequests();
      fetchOneriler();
      fetchNotifications();
      fetchSystemLogs();
      // Her 30 saniyede bir teklifleri yenile
      const interval = setInterval(() => {
        fetchMembershipRequests();
        fetchOneriler();
        fetchNotifications();
        fetchSystemLogs();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchSystemLogs = async () => {
    try {
      // Admin için tüm logları çek (tenant_id: 0 veya tüm tenant'lar)
      // TODO: Backend'de admin için özel log endpoint'i eklendiğinde buraya entegre edilecek
      // Şimdilik tüm kullanıcıların loglarını birleştiriyoruz
      const allLogs = [];
      for (const user of users) {
        try {
          const response = await fetchWithAdminAuth(`${API_URL}/log/son-hareketler?limit=10&tenant_id=${user.tenant_id}`);
          if (response.ok) {
            const logs = await response.json();
            allLogs.push(...(logs || []));
          }
        } catch (error) {
          console.error(`Kullanıcı ${user.tenant_id} logları yüklenirken hata:`, error);
        }
      }
      // Tarihe göre sırala (en yeni önce)
      allLogs.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
      setSystemLogs(allLogs.slice(0, 50)); // Son 50 log
    } catch (error) {
      console.error('Sistem logları yüklenirken hata:', error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      // Backend endpoint'i yoksa localStorage'dan yükle
      const savedSettings = localStorage.getItem('adminSystemSettings');
      if (savedSettings) {
        setSystemSettings(JSON.parse(savedSettings));
      }
      // TODO: Backend endpoint'i eklendiğinde buraya entegre edilecek
      // const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/settings`);
      // if (response.ok) {
      //   const data = await response.json();
      //   setSystemSettings(data);
      // }
    } catch (error) {
      console.error('Sistem ayarları yüklenirken hata:', error);
    }
  };

  const saveSystemSettings = async () => {
    try {
      setLoading(true);
      // Backend endpoint'i yoksa localStorage'a kaydet
      localStorage.setItem('adminSystemSettings', JSON.stringify(systemSettings));
      alert('Sistem ayarları kaydedildi');
      // TODO: Backend endpoint'i eklendiğinde buraya entegre edilecek
      // const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/settings`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(systemSettings),
      // });
      // if (response.ok) {
      //   alert('Sistem ayarları kaydedildi');
      // } else {
      //   throw new Error('Ayarlar kaydedilemedi');
      // }
    } catch (error) {
      console.error('Sistem ayarları kaydedilirken hata:', error);
      alert('Sistem ayarları kaydedilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Dashboard istatistiklerini hesapla
  useEffect(() => {
    if (users.length > 0 || membershipRequests.length > 0 || oneriler.length > 0 || notifications.length > 0) {
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        activeMemberships: users.filter(u => u.membership_status === 'active').length,
        pendingRequests: membershipRequests.filter(r => r.status === 'pending').length,
        pendingOneriler: oneriler.filter(o => o.status === 'pending').length,
        unreadNotifications: notifications.filter(n => !n.isRead && n.type === 'contact_message').length,
        todayActivities: 0, // Bu backend'den gelecek
      };
      setDashboardStats(stats);
    }
  }, [users, membershipRequests, oneriler, notifications]);

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

  const handleDeleteUser = async () => {
    if (!deletePassword) {
      setDeletePasswordError('Lütfen şifrenizi girin');
      return;
    }

    if (!selectedUser) {
      return;
    }

    try {
      setLoading(true);
      setDeletePasswordError('');
      
      const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Kullanıcı başarıyla silindi');
        setIsDeleteUserModalOpen(false);
        setDeletePassword('');
        setSelectedUser(null);
        await fetchUsers();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Kullanıcı silinemedi' }));
        setDeletePasswordError(errorData.message || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      setDeletePasswordError('Kullanıcı silinirken bir hata oluştu');
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
        const message = months < 0 
          ? `${Math.abs(months)} ay üyelik süresi kısıldı` 
          : data.message || 'Üyelik eklendi';
        alert(message);
        setIsMembershipModalOpen(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || (months < 0 ? 'Üyelik süresi kısılamadı' : 'Üyelik eklenemedi'));
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

  const fetchUserDetails = async (user) => {
    try {
      setLoading(true);
      setSelectedUserDetail(user);
      setIsUserDetailModalOpen(true);

      // Kullanıcının kartlarını çek
      const cardsResponse = await fetchWithAdminAuth(`${API_URL}/card?tenant_id=${user.tenant_id}`);
      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json();
        setUserCards(cardsData || []);
      }

      // Kullanıcının tekliflerini çek
      const tekliflerResponse = await fetchWithAdminAuth(`${API_URL}/teklif?tenant_id=${user.tenant_id}`);
      if (tekliflerResponse.ok) {
        const tekliflerData = await tekliflerResponse.json();
        setUserTeklifler(tekliflerData || []);
      }

      // Kullanıcının loglarını çek
      const logsResponse = await fetchWithAdminAuth(`${API_URL}/log/son-hareketler?limit=50&tenant_id=${user.tenant_id}`);
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setUserLogs(logsData || []);
      }
    } catch (error) {
      console.error('Kullanıcı detayları yüklenirken hata:', error);
      alert('Kullanıcı detayları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Toplu İşlemler Fonksiyonları
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const bulkToggleActive = async (isActive) => {
    if (selectedUsers.length === 0) {
      alert('Lütfen en az bir kullanıcı seçin');
      return;
    }

    if (!confirm(`${selectedUsers.length} kullanıcıyı ${isActive ? 'aktif' : 'pasif'} etmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      let failCount = 0;

      for (const userId of selectedUsers) {
        try {
          await toggleUserActive(userId, isActive);
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Kullanıcı ${userId} güncellenirken hata:`, error);
        }
      }

      alert(`${successCount} kullanıcı başarıyla güncellendi${failCount > 0 ? `, ${failCount} kullanıcı güncellenemedi` : ''}`);
      setSelectedUsers([]);
      setIsSelectMode(false);
      await fetchUsers();
    } catch (error) {
      console.error('Toplu işlem hatası:', error);
      alert('Toplu işlem sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Email Gönderme Fonksiyonları
  const sendBulkEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      alert('Lütfen konu ve mesaj alanlarını doldurun');
      return;
    }

    let recipients = [];
    if (emailData.recipients === 'all') {
      recipients = users.filter(u => u.email).map(u => u.email);
    } else if (emailData.recipients === 'selected') {
      recipients = users.filter(u => selectedUsers.includes(u.id) && u.email).map(u => u.email);
    } else if (emailData.recipients === 'custom') {
      recipients = emailData.customEmails.split(',').map(e => e.trim()).filter(e => e);
    }

    if (recipients.length === 0) {
      alert('Alıcı bulunamadı');
      return;
    }

    if (!confirm(`${recipients.length} kullanıcıya email göndermek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Backend endpoint'i eklendiğinde buraya entegre edilecek
      // const response = await fetchWithAdminAuth(`${API_URL}/auth/admin/send-email`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     recipients,
      //     subject: emailData.subject,
      //     message: emailData.message,
      //   }),
      // });
      // if (response.ok) {
      //   alert('Email başarıyla gönderildi');
      //   setIsEmailModalOpen(false);
      //   setEmailData({
      //     recipients: [],
      //     customEmails: '',
      //     subject: '',
      //     message: '',
      //     template: 'custom',
      //   });
      // } else {
      //   throw new Error('Email gönderilemedi');
      // }
      alert(`Email gönderme özelliği backend endpoint'i eklendiğinde aktif olacak. ${recipients.length} alıcı seçildi.`);
      setIsEmailModalOpen(false);
      setEmailData({
        recipients: [],
        customEmails: '',
        subject: '',
        message: '',
        template: 'custom',
      });
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      alert('Email gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const applyEmailTemplate = (template) => {
    const templates = {
      welcome: {
        subject: 'BBSM Garage\'a Hoş Geldiniz!',
        message: 'Merhaba,\n\nBBSM Garage sistemine hoş geldiniz. Sistemimizi kullanmaya başlayabilirsiniz.\n\nİyi çalışmalar,\nBBSM Garage Ekibi',
      },
      notification: {
        subject: 'Önemli Duyuru',
        message: 'Merhaba,\n\nSize önemli bir duyuru iletmek istiyoruz.\n\nSaygılarımızla,\nBBSM Garage Ekibi',
      },
      custom: {
        subject: '',
        message: '',
      },
    };
    const selectedTemplate = templates[template] || templates.custom;
    setEmailData({ ...emailData, subject: selectedTemplate.subject, message: selectedTemplate.message, template });
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

  // Filtreleme Fonksiyonları
  const filterUsers = (userList) => {
    return userList.filter(user => {
      // Arama terimi filtresi
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
          user.username?.toLowerCase().includes(search) ||
          user.firmaAdi?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.tenant_id?.toString().includes(search)
        );
        if (!matchesSearch) return false;
      }

      // Durum filtresi
      if (userFilters.status !== 'all') {
        if (userFilters.status === 'active' && !user.isActive) return false;
        if (userFilters.status === 'inactive' && user.isActive) return false;
      }

      // Üyelik durumu filtresi
      if (userFilters.membershipStatus !== 'all') {
        if (userFilters.membershipStatus === 'active' && user.membership_status !== 'active') return false;
        if (userFilters.membershipStatus === 'expired' && user.membership_status !== 'expired') return false;
        if (userFilters.membershipStatus === 'undefined' && user.membership_status && user.membership_status !== 'undefined') return false;
      }

      // Email doğrulama filtresi
      if (userFilters.emailVerified !== 'all') {
        if (userFilters.emailVerified === 'verified' && !user.emailVerified) return false;
        if (userFilters.emailVerified === 'unverified' && user.emailVerified) return false;
      }

      // Tarih aralığı filtresi (üyelik başlangıç tarihine göre)
      if (userFilters.dateRange.start && user.membership_start_date) {
        const startDate = new Date(userFilters.dateRange.start);
        const userDate = new Date(user.membership_start_date);
        if (userDate < startDate) return false;
      }
      if (userFilters.dateRange.end && user.membership_start_date) {
        const endDate = new Date(userFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        const userDate = new Date(user.membership_start_date);
        if (userDate > endDate) return false;
      }

      return true;
    });
  };

  const filterRequests = (requestList) => {
    if (requestFilters.status === 'all') return requestList;
    return requestList.filter(r => r.status === requestFilters.status);
  };

  const filterOneriler = (oneriList) => {
    if (oneriFilters.status === 'all') return oneriList;
    return oneriList.filter(o => o.status === oneriFilters.status);
  };

  // Sayfalama Fonksiyonları
  const paginate = (array, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return array.slice(startIndex, endIndex);
  };

  const getTotalPages = (array, perPage) => {
    return Math.ceil(array.length / perPage) || 1;
  };

  // Filtrelenmiş ve sayfalanmış veriler
  const filteredUsers = filterUsers(users);
  const paginatedUsers = paginate(filteredUsers, currentPage, itemsPerPage);
  const totalUserPages = getTotalPages(filteredUsers, itemsPerPage);

  const filteredRequests = filterRequests(membershipRequests);
  const filteredOneriler = filterOneriler(oneriler);

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
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                title="Klavye Kısayolları (Ctrl+K)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Kısayollar
              </button>
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

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kullanıcılar
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Üyelik Teklifleri
              </button>
              <button
                onClick={() => setActiveTab('oneriler')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'oneriler'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Öneriler
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Ayarlar
              </button>
            </nav>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* İstatistik Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium opacity-90">Toplam Kullanıcı</p>
                      <p className="text-3xl font-bold mt-2">{dashboardStats.totalUsers}</p>
                    </div>
                    <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-400 to-green-500 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium opacity-90">Aktif Kullanıcılar</p>
                      <p className="text-3xl font-bold mt-2">{dashboardStats.activeUsers}</p>
                    </div>
                    <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium opacity-90">Aktif Üyelikler</p>
                      <p className="text-3xl font-bold mt-2">{dashboardStats.activeMemberships}</p>
                    </div>
                    <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-6 rounded-xl shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium opacity-90">Bekleyen İşlemler</p>
                      <p className="text-3xl font-bold mt-2">{dashboardStats.pendingRequests + dashboardStats.pendingOneriler}</p>
                    </div>
                    <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Detaylı İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-my-siyah mb-4">Üyelik Durumları</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Aktif Üyelikler</span>
                      <span className="font-bold text-green-600">{dashboardStats.activeMemberships}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Süresi Dolmuş</span>
                      <span className="font-bold text-red-600">{users.filter(u => u.membership_status === 'expired').length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Üyeliksiz</span>
                      <span className="font-bold text-gray-600">{users.filter(u => !u.membership_status || u.membership_status === 'undefined').length}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-my-siyah mb-4">Bekleyen İşlemler</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Üyelik Teklifleri</span>
                      <span className="font-bold text-yellow-600">{dashboardStats.pendingRequests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Öneriler</span>
                      <span className="font-bold text-purple-600">{dashboardStats.pendingOneriler}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Okunmamış Mesajlar</span>
                      <span className="font-bold text-blue-600">{dashboardStats.unreadNotifications}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Aylık Kullanıcı Artışı */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-my-siyah mb-4">Aylık Kullanıcı Artışı</h3>
                  <div className="space-y-3">
                    {(() => {
                      const monthlyData = {};
                      users.forEach(user => {
                        if (user.membership_start_date) {
                          const date = new Date(user.membership_start_date);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
                        }
                      });
                      const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
                      const maxCount = Math.max(...Object.values(monthlyData), 1);
                      return sortedMonths.map(month => {
                        const count = monthlyData[month];
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={month} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-20">{month}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${percentage}%` }}
                              >
                                <span className="text-xs text-white font-medium">{count}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Üyelik Durumları Grafiği */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-my-siyah mb-4">Üyelik Durumları</h3>
                  <div className="space-y-4">
                    {(() => {
                      const activeCount = users.filter(u => u.membership_status === 'active').length;
                      const expiredCount = users.filter(u => u.membership_status === 'expired').length;
                      const undefinedCount = users.filter(u => !u.membership_status || u.membership_status === 'undefined').length;
                      const total = users.length || 1;
                      return (
                        <>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-24">Aktif</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${(activeCount / total) * 100}%` }}
                              >
                                <span className="text-xs text-white font-medium">{activeCount}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-24">Süresi Dolmuş</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${(expiredCount / total) * 100}%` }}
                              >
                                <span className="text-xs text-white font-medium">{expiredCount}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-24">Üyeliksiz</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="bg-gray-500 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${(undefinedCount / total) * 100}%` }}
                              >
                                <span className="text-xs text-white font-medium">{undefinedCount}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Son Aktiviteler / Loglar */}
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-my-siyah">Son Aktiviteler</h3>
                  <button
                    onClick={fetchSystemLogs}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Yenile
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Tarih</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Kullanıcı</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Aksiyon</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Detay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemLogs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-8 text-gray-500">
                            Henüz aktivite bulunmamaktadır
                          </td>
                        </tr>
                      ) : (
                        systemLogs.slice(0, 10).map((log, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-700">
                              {log.created_at ? new Date(log.created_at).toLocaleString('tr-TR') : '-'}
                            </td>
                            <td className="py-2 px-3 text-gray-700">{log.username || '-'}</td>
                            <td className="py-2 px-3 text-gray-700">{log.action || '-'}</td>
                            <td className="py-2 px-3 text-gray-700">{log.details || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Kullanıcılar Tab */}
          {activeTab === 'users' && (
            <div>
              {/* Kullanıcılar Listesi */}
              <div className="bg-white rounded-xl shadow-md p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-my-siyah mb-4 md:mb-0">Kullanıcılar</h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    {isSelectMode && selectedUsers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{selectedUsers.length} seçili</span>
                        <button
                          onClick={() => bulkToggleActive(true)}
                          disabled={loading}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors disabled:opacity-50"
                        >
                          Toplu Aktif Et
                        </button>
                        <button
                          onClick={() => bulkToggleActive(false)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors disabled:opacity-50"
                        >
                          Toplu Pasif Et
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUsers([]);
                            setIsSelectMode(false);
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-colors"
                        >
                          İptal
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setIsSelectMode(!isSelectMode);
                        if (isSelectMode) setSelectedUsers([]);
                      }}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        isSelectMode
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {isSelectMode ? 'Seçimi İptal Et' : 'Toplu İşlem'}
                    </button>
                    <button
                      onClick={() => {
                        setEmailData({
                          recipients: selectedUsers.length > 0 ? 'selected' : 'all',
                          customEmails: '',
                          subject: '',
                          message: '',
                          template: 'custom',
                        });
                        setIsEmailModalOpen(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Gönder
                    </button>
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

                {/* Filtreleme Kontrolleri */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                      <select
                        value={userFilters.status}
                        onChange={(e) => {
                          setUserFilters({ ...userFilters, status: e.target.value });
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tümü</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Üyelik Durumu</label>
                      <select
                        value={userFilters.membershipStatus}
                        onChange={(e) => {
                          setUserFilters({ ...userFilters, membershipStatus: e.target.value });
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tümü</option>
                        <option value="active">Aktif</option>
                        <option value="expired">Süresi Dolmuş</option>
                        <option value="undefined">Üyeliksiz</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Doğrulama</label>
                      <select
                        value={userFilters.emailVerified}
                        onChange={(e) => {
                          setUserFilters({ ...userFilters, emailVerified: e.target.value });
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tümü</option>
                        <option value="verified">Doğrulanmış</option>
                        <option value="unverified">Doğrulanmamış</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sayfa Başına</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
                      <input
                        type="date"
                        value={userFilters.dateRange.start}
                        onChange={(e) => {
                          setUserFilters({ ...userFilters, dateRange: { ...userFilters.dateRange, start: e.target.value } });
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={userFilters.dateRange.end}
                        onChange={(e) => {
                          setUserFilters({ ...userFilters, dateRange: { ...userFilters.dateRange, end: e.target.value } });
                          setCurrentPage(1);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setUserFilters({
                          status: 'all',
                          membershipStatus: 'all',
                          emailVerified: 'all',
                          dateRange: { start: '', end: '' },
                        });
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Filtreleri Temizle
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
                          {isSelectMode && (
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                              <input
                                type="checkbox"
                                checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                onChange={selectAllUsers}
                                className="w-4 h-4"
                              />
                            </th>
                          )}
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
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={isSelectMode ? 15 : 14} className="text-center py-12 text-gray-500">
                              Kullanıcı bulunamadı
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((user) => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                              {isSelectMode && (
                                <td className="py-3 px-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => toggleUserSelection(user.id)}
                                    className="w-4 h-4"
                                  />
                                </td>
                              )}
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
                                    onClick={() => fetchUserDetails(user)}
                                    disabled={loading}
                                    className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Detay
                                  </button>
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
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsDeleteUserModalOpen(true);
                                      setDeletePassword('');
                                      setDeletePasswordError('');
                                    }}
                                    disabled={loading}
                                    className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    
                    {/* Sayfalama Kontrolleri */}
                    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        Toplam {filteredUsers.length} kullanıcıdan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} arası gösteriliyor
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Önceki
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                            let pageNum;
                            if (totalUserPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalUserPages - 2) {
                              pageNum = totalUserPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 border rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalUserPages, prev + 1))}
                          disabled={currentPage === totalUserPages}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Üyelik Teklifleri Tab */}
          {activeTab === 'requests' && (
            <div>
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

            {/* Filtreleme Kontrolleri */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">Durum:</label>
                <select
                  value={requestFilters.status}
                  onChange={(e) => setRequestFilters({ ...requestFilters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="pending">Bekleyen</option>
                  <option value="approved">Onaylanan</option>
                  <option value="rejected">Reddedilen</option>
                </select>
                <button
                  onClick={() => setRequestFilters({ status: 'all' })}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
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
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-gray-500">
                          Henüz teklif bulunmamaktadır
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
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
            </div>
          )}

          {/* Öneriler Tab */}
          {activeTab === 'oneriler' && (
            <div>
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

            {/* Filtreleme Kontrolleri */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-gray-700">Durum:</label>
                <select
                  value={oneriFilters.status}
                  onChange={(e) => setOneriFilters({ ...oneriFilters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Tümü</option>
                  <option value="pending">Bekleyen</option>
                  <option value="approved">Onaylanan</option>
                  <option value="rejected">Reddedilen</option>
                </select>
                <button
                  onClick={() => setOneriFilters({ status: 'all' })}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Filtreleri Temizle
                </button>
              </div>
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
                    {filteredOneriler.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500">
                          Henüz öneri bulunmamaktadır
                        </td>
                      </tr>
                    ) : (
                      filteredOneriler.map((oneri) => (
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
            </div>
          )}

          {/* Ayarlar Tab */}
          {activeTab === 'settings' && (
            <div>
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
                        onClick={saveSystemSettings}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Kullanıcı Detay Modal */}
          {isUserDetailModalOpen && selectedUserDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-my-siyah">Kullanıcı Detayları</h2>
              <button
                      onClick={() => {
                        setIsUserDetailModalOpen(false);
                        setSelectedUserDetail(null);
                        setUserCards([]);
                        setUserTeklifler([]);
                        setUserLogs([]);
                      }}
                      className="text-gray-500 hover:text-gray-700"
              >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

                  {/* Kullanıcı Bilgileri */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Kullanıcı Adı</label>
                      <p className="text-gray-900">{selectedUserDetail.username || '-'}</p>
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Firma Adı</label>
                      <p className="text-gray-900">{selectedUserDetail.firmaAdi || '-'}</p>
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Yetkili Kişi</label>
                      <p className="text-gray-900">{selectedUserDetail.yetkiliKisi || '-'}</p>
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedUserDetail.email || '-'}</p>
                  </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Telefon</label>
                      <p className="text-gray-900">{selectedUserDetail.telefon || '-'}</p>
                </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant ID</label>
                      <p className="text-gray-900">{selectedUserDetail.tenant_id || '-'}</p>
                </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Doğrulandı</label>
                      <p className="text-gray-900">
                        {selectedUserDetail.emailVerified ? (
                          <span className="text-green-600">✓ Doğrulandı</span>
                        ) : (
                          <span className="text-red-600">✗ Doğrulanmadı</span>
                        )}
                      </p>
              </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Durum</label>
                      <p className="text-gray-900">
                        {selectedUserDetail.isActive ? (
                          <span className="text-green-600">✓ Aktif</span>
                        ) : (
                          <span className="text-gray-600">⏸ Pasif</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Üyelik Başlangıç</label>
                      <p className="text-gray-900">
                        {selectedUserDetail.membership_start_date
                          ? new Date(selectedUserDetail.membership_start_date).toLocaleDateString('tr-TR')
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Üyelik Bitiş</label>
                      <p className="text-gray-900">
                        {selectedUserDetail.membership_end_date
                          ? new Date(selectedUserDetail.membership_end_date).toLocaleDateString('tr-TR')
                          : '-'}
                      </p>
                    </div>
          </div>

                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200 mb-4">
                    <nav className="flex space-x-4" aria-label="Tabs">
                <button
                        onClick={() => setUserDetailTab('cards')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          userDetailTab === 'cards'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Kartlar ({userCards.length})
                </button>
                      <button
                        onClick={() => setUserDetailTab('teklifler')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          userDetailTab === 'teklifler'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Teklifler ({userTeklifler.length})
                      </button>
                      <button
                        onClick={() => setUserDetailTab('logs')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          userDetailTab === 'logs'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Loglar ({userLogs.length})
                      </button>
                    </nav>
            </div>

                  {/* Kartlar Tab */}
                  {userDetailTab === 'cards' && (
              <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">ID</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Plaka</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Marka/Model</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Müşteri</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Giriş Tarihi</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Ödeme</th>
                    </tr>
                  </thead>
                  <tbody>
                          {userCards.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-8 text-gray-500">
                                Henüz kart bulunmamaktadır
                              </td>
                            </tr>
                          ) : (
                            userCards.slice(0, 10).map((card) => (
                              <tr key={card.card_id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-700">{card.card_id}</td>
                                <td className="py-2 px-3 text-gray-700">{card.plaka || '-'}</td>
                                <td className="py-2 px-3 text-gray-700">{card.markaModel || '-'}</td>
                                <td className="py-2 px-3 text-gray-700">{card.musteriAdi || '-'}</td>
                                <td className="py-2 px-3 text-gray-700">
                                  {card.girisTarihi ? new Date(card.girisTarihi).toLocaleDateString('tr-TR') : '-'}
                          </td>
                                <td className="py-2 px-3">
                                  {card.odemeAlindi ? (
                                    <span className="text-green-600">✓ Alındı</span>
                            ) : (
                                    <span className="text-red-600">✗ Alınmadı</span>
                            )}
                          </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      {userCards.length > 10 && (
                        <p className="text-sm text-gray-500 mt-2">Toplam {userCards.length} karttan ilk 10'u gösteriliyor</p>
                      )}
                    </div>
                  )}

                  {/* Teklifler Tab */}
                  {userDetailTab === 'teklifler' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">ID</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Plaka</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Marka/Model</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Müşteri</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Giriş Tarihi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userTeklifler.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-8 text-gray-500">
                                Henüz teklif bulunmamaktadır
                          </td>
                            </tr>
                          ) : (
                            userTeklifler.slice(0, 10).map((teklif) => (
                              <tr key={teklif.teklif_id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-700">{teklif.teklif_id}</td>
                                <td className="py-2 px-3 text-gray-700">{teklif.plaka || '-'}</td>
                                <td className="py-2 px-3 text-gray-700">{teklif.markaModel || '-'}</td>
                                <td className="py-2 px-3 text-gray-700">{teklif.musteriAdi || '-'}</td>
                                <td className="py-2 px-3 text-gray-700">
                                  {teklif.girisTarihi ? new Date(teklif.girisTarihi).toLocaleDateString('tr-TR') : '-'}
                          </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      {userTeklifler.length > 10 && (
                        <p className="text-sm text-gray-500 mt-2">Toplam {userTeklifler.length} tekliften ilk 10'u gösteriliyor</p>
                      )}
                    </div>
                  )}

                  {/* Loglar Tab */}
                  {userDetailTab === 'logs' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Tarih</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Aksiyon</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Detay</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userLogs.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center py-8 text-gray-500">
                                Henüz log bulunmamaktadır
                          </td>
                            </tr>
                          ) : (
                            userLogs.slice(0, 20).map((log, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2 px-3 text-gray-700">
                                  {log.created_at ? new Date(log.created_at).toLocaleString('tr-TR') : '-'}
                                </td>
                                <td className="py-2 px-3 text-gray-700">{log.action || '-'}</td>
                                <td className="py-2 px-3 text-gray-700">{log.details || '-'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      {userLogs.length > 20 && (
                        <p className="text-sm text-gray-500 mt-2">Toplam {userLogs.length} logtan ilk 20'si gösteriliyor</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Email Gönderme Modal */}
          {isEmailModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-my-siyah">Toplu Email Gönder</h2>
                              <button
                      onClick={() => {
                        setIsEmailModalOpen(false);
                        setEmailData({
                          recipients: [],
                          customEmails: '',
                          subject: '',
                          message: '',
                          template: 'custom',
                        });
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alıcılar</label>
                      <select
                        value={emailData.recipients}
                        onChange={(e) => setEmailData({ ...emailData, recipients: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Tüm Kullanıcılar ({users.filter(u => u.email).length})</option>
                        <option value="selected">Seçili Kullanıcılar ({selectedUsers.length})</option>
                        <option value="custom">Özel Email Adresleri</option>
                      </select>
                    </div>

                    {emailData.recipients === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Adresleri (virgülle ayırın)</label>
                        <textarea
                          value={emailData.customEmails}
                          onChange={(e) => setEmailData({ ...emailData, customEmails: e.target.value })}
                          placeholder="email1@example.com, email2@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Şablon</label>
                      <select
                        value={emailData.template}
                        onChange={(e) => applyEmailTemplate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="custom">Özel</option>
                        <option value="welcome">Hoş Geldiniz</option>
                        <option value="notification">Duyuru</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                      <input
                        type="text"
                        value={emailData.subject}
                        onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                        placeholder="Email konusu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                      <textarea
                        value={emailData.message}
                        onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                        placeholder="Email mesajı"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="8"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => {
                          setIsEmailModalOpen(false);
                          setEmailData({
                            recipients: [],
                            customEmails: '',
                            subject: '',
                            message: '',
                            template: 'custom',
                          });
                                }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={sendBulkEmail}
                                disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                        {loading ? 'Gönderiliyor...' : 'Gönder'}
                              </button>
                            </div>
                  </div>
              </div>
          </div>
            </div>
          )}
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

      {/* Kullanıcı Silme Modal */}
      {isDeleteUserModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Kullanıcı Sil</h2>
              <button
                onClick={() => {
                  setIsDeleteUserModalOpen(false);
                  setSelectedUser(null);
                  setDeletePassword('');
                  setDeletePasswordError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">Dikkat!</p>
                  <p className="text-sm text-red-700">
                    <strong>{selectedUser.username}</strong> kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Şifresi
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeletePasswordError('');
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  deletePasswordError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Şifrenizi girin"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteUser();
                  }
                }}
              />
              {deletePasswordError && (
                <p className="mt-1 text-sm text-red-600">{deletePasswordError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteUserModalOpen(false);
                  setSelectedUser(null);
                  setDeletePassword('');
                  setDeletePasswordError('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading || !deletePassword}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bildirim kutusu dışına tıklanınca kapat */}
      {isNotificationOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsNotificationOpen(false)}
        ></div>
      )}

      {/* Klavye Kısayolları Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-my-siyah">Klavye Kısayolları</h2>
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Kısayolları Göster/Gizle</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl+K</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Dashboard</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl+1</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Kullanıcılar</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl+2</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Üyelik Teklifleri</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl+3</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Öneriler</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl+4</kbd>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">Ayarlar</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Ctrl+5</kbd>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-700">Modal Kapat</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      if (!customMonths || customMonths === 0) {
        alert('Lütfen geçerli bir ay sayısı girin (0\'dan farklı)');
        return;
      }
      onAdd(customMonths, customDate);
    } else {
      if (!selectedMonths || selectedMonths === 0) {
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
            <h2 className="text-2xl font-bold text-my-siyah">Üyelik Süresi Ver/Kıs</h2>
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Süre Ekle</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[1, 2, 3, 6, 12].map(month => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonths(month);
                      setUseCustomDate(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMonths === month && !useCustomDate && selectedMonths > 0
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    +{month} Ay
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Süre Kıs</label>
              <div className="grid grid-cols-3 gap-2">
                {[-1, -2, -3, -6, -12].map(month => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonths(month);
                      setUseCustomDate(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMonths === month && !useCustomDate && selectedMonths < 0
                        ? 'bg-red-600 text-white'
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
                    value={customMonths}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setCustomMonths(value);
                    }}
                    placeholder="Ay sayısı (pozitif: ekle, negatif: kıs)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pozitif değer: Süre ekler, Negatif değer: Süre kısar
                  </p>
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
              disabled={loading || (!selectedMonths && !useCustomDate) || (selectedMonths === 0) || (useCustomDate && customMonths === 0)}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                (selectedMonths && selectedMonths < 0) || (useCustomDate && customMonths < 0)
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading 
                ? 'İşleniyor...' 
                : (selectedMonths && selectedMonths < 0) || (useCustomDate && customMonths < 0)
                  ? 'Süre Kıs'
                  : 'Süre Ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

