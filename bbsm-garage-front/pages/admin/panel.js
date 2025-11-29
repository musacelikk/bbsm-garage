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

  // Kullanıcıları yükle
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
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

