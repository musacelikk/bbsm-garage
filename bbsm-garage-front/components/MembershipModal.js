import React, { useState, useEffect } from 'react';

const MembershipModal = ({ isOpen, onClose, profileData, fetchWithAuth, API_URL }) => {
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && profileData) {
      loadMembershipData();
    }
  }, [isOpen, profileData]);

  const loadMembershipData = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/membership`);
      if (response.ok) {
        const data = await response.json();
        setMembershipData({
          plan: data.plan || 'Standart',
          status: data.membership_status === 'active' ? 'Aktif' : 
                  data.membership_status === 'expired' ? 'Süresi Dolmuş' : 
                  data.membership_status === 'inactive' ? 'Tanımsız' : 'Tanımsız',
          startDate: data.membership_start_date,
          endDate: data.membership_end_date,
          features: data.features || ['Sınırsız kart kaydı', 'Sınırsız teklif oluşturma', 'Raporlama']
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMembershipData({
          plan: 'Standart',
          status: 'Tanımsız',
          startDate: null,
          endDate: null,
          features: ['Sınırsız kart kaydı', 'Sınırsız teklif oluşturma', 'Raporlama']
        });
      }
    } catch (error) {
      console.error('Üyelik bilgileri yükleme hatası:', error);
      setMembershipData({
        plan: 'Standart',
        status: 'Tanımsız',
        startDate: null,
        endDate: null,
        features: ['Sınırsız kart kaydı', 'Sınırsız teklif oluşturma', 'Raporlama']
      });
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    if (status === 'Aktif') return 'bg-green-500/20 text-green-400';
    if (status === 'Beklemede') return 'bg-yellow-500/20 text-yellow-400';
    if (status === 'Süresi Dolmuş') return 'bg-red-500/20 text-red-400';
    if (status === 'Tanımsız') return 'dark-bg-tertiary dark-text-muted';
    return 'dark-bg-tertiary dark-text-muted';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="relative dark-card-bg neumorphic-card rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 dark-card-bg border-b dark-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold dark-text-primary">Üyelik Bilgileri</h2>
          <button
            onClick={onClose}
            className="dark-text-muted hover:dark-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : membershipData ? (
            <div className="space-y-6">
              <div className="dark-bg-secondary neumorphic-card rounded-xl p-6 border dark-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold dark-text-secondary mb-1">Üyelik Planı</h3>
                    <p className="text-3xl font-bold text-blue-400">{membershipData.plan || 'Standart'}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold neumorphic-inset ${getStatusColor(membershipData.status || 'Aktif')}`}>
                    {membershipData.status || 'Aktif'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="dark-card-bg neumorphic-card rounded-lg border dark-border p-4">
                  <label className="block text-sm font-semibold dark-text-muted mb-2">Başlangıç Tarihi</label>
                  <p className="text-base font-medium dark-text-primary">{formatDate(membershipData.startDate)}</p>
                </div>
                <div className="dark-card-bg neumorphic-card rounded-lg border dark-border p-4">
                  <label className="block text-sm font-semibold dark-text-muted mb-2">Bitiş Tarihi</label>
                  <p className="text-base font-medium dark-text-primary">
                    {membershipData.endDate ? formatDate(membershipData.endDate) : 'Sınırsız'}
                  </p>
                </div>
              </div>

              <div className="dark-card-bg neumorphic-card rounded-lg border dark-border p-4">
                <h4 className="text-lg font-semibold dark-text-primary mb-3">Plan Özellikleri</h4>
                <ul className="space-y-2">
                  {(membershipData.features || []).map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="dark-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="dark-bg-secondary neumorphic-card border dark-border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold dark-text-primary mb-1">Üyelik Yönetimi</p>
                    <p className="text-sm dark-text-secondary">
                      Üyelik planınızı yükseltmek veya değiştirmek için bizimle iletişime geçin.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="dark-text-muted">Üyelik bilgileri yüklenemedi</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 dark-bg-tertiary border-t dark-border px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors font-semibold"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipModal;

