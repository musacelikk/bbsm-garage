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
        console.error('Kullanıcılar yüklenemedi');
        alert('Kullanıcılar yüklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Kullanıcılar yükleme hatası:', error);
      alert('Kullanıcılar yüklenirken bir hata oluştu');
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
        // Kullanıcı listesini yenile
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
                          <td className="py-3 px-4">
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
    </div>
  );
}

export default AdminPanel;

