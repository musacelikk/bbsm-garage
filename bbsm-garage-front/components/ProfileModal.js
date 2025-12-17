import React, { useState, useEffect } from 'react';

const ProfileModal = ({ isOpen, onClose, profileData, setProfileData, isEditing, setIsEditing, fetchWithAuth, API_URL, setLoading }) => {
  const [formData, setFormData] = useState({
    firmaAdi: '',
    yetkiliKisi: '',
    telefon: '',
    email: '',
    adres: '',
    vergiNo: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  useEffect(() => {
    if (profileData) {
      setFormData({
        firmaAdi: profileData.firmaAdi || '',
        yetkiliKisi: profileData.yetkiliKisi || '',
        telefon: profileData.telefon || '',
        email: profileData.email || '',
        adres: profileData.adres || '',
        vergiNo: profileData.vergiNo || ''
      });
      setEmailVerified(profileData.emailVerified || false);
      setEmailChanged(false);
    }
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // E-posta değiştiğinde doğrulama durumunu sıfırla
    if (name === 'email' && value !== profileData?.email) {
      setEmailChanged(true);
      setEmailVerified(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setEmailVerified(updatedData.emailVerified || false);
        setSuccess(true);
        setIsEditing(false);
        setEmailChanged(false);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setIsSendingVerification(true);
    setError('');
    setSuccess(false);
    
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Doğrulama email\'i gönderilemedi');
      }
    } catch (error) {
      console.error('Doğrulama email gönderme hatası:', error);
      setError('Doğrulama email\'i gönderilirken bir hata oluştu');
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (!isOpen || !profileData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-overlay overflow-y-auto py-8" onClick={onClose}>
      <div className="dark-card-bg neumorphic-card rounded-2xl max-w-2xl w-full mx-4 my-8 modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold dark-text-primary">Profil Bilgileri</h2>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Düzenle
                </button>
              )}
              <button
                onClick={onClose}
                className="dark-text-muted hover:dark-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border dark-border rounded-lg neumorphic-inset">
              <p className="text-sm text-green-400">
                {emailChanged && !emailVerified 
                  ? 'Profil güncellendi! Doğrulama email\'i gönderildi. Lütfen email\'inizi kontrol edin.' 
                  : !isSendingVerification && !emailChanged && formData.email && !emailVerified
                  ? 'Doğrulama email\'i gönderildi. Lütfen email\'inizi kontrol edin.'
                  : 'Profil başarıyla güncellendi!'}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border dark-border rounded-lg neumorphic-inset">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* E-posta Doğrulama Uyarısı */}
          {!isEditing && formData.email && !emailVerified && (
            <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 dark-border rounded-lg neumorphic-inset">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-400 mb-1">E-posta Doğrulanmadı</h3>
                    <p className="text-xs text-yellow-300/80">
                      E-posta adresinizi doğrulamak için lütfen e-posta kutunuzu kontrol edin veya yeni bir doğrulama email'i gönderin.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSendVerificationEmail}
                  disabled={isSendingVerification}
                  className="px-4 py-2 text-sm font-semibold bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors neumorphic-inset flex items-center gap-2 flex-shrink-0"
                >
                  {isSendingVerification ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Doğrula
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Sistem Bilgileri - Düzenlenemez */}
            <div className="border-b dark-border pb-4">
              <h3 className="text-lg font-semibold dark-text-primary mb-3">Sistem Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold dark-text-primary mb-1">Kullanıcı Adı</label>
                  <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                    <p className="dark-text-primary">{profileData.username}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold dark-text-primary mb-1">Tenant ID</label>
                  <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                    <p className="dark-text-primary font-mono">{profileData.tenant_id}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firma Bilgileri - Düzenlenebilir */}
            <div>
              <h3 className="text-lg font-semibold dark-text-primary mb-3">Firma Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold dark-text-primary mb-1">Firma Adı</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firmaAdi"
                      value={formData.firmaAdi}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                      placeholder="Firma Adı"
                    />
                  ) : (
                    <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                      <p className="dark-text-primary">{formData.firmaAdi || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold dark-text-primary mb-1">Vergi No</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="vergiNo"
                      value={formData.vergiNo}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                      placeholder="Vergi Numarası"
                    />
                  ) : (
                    <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                      <p className="dark-text-primary">{formData.vergiNo || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri - Düzenlenebilir */}
            <div>
              <h3 className="text-lg font-semibold dark-text-primary mb-3">İletişim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold dark-text-primary mb-1">Yetkili Kişi</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="yetkiliKisi"
                      value={formData.yetkiliKisi}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                      placeholder="Yetkili Kişi Adı"
                    />
                  ) : (
                    <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                      <p className="dark-text-primary">{formData.yetkiliKisi || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold dark-text-primary mb-1">Telefon</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleChange}
                      className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                      placeholder="05XX XXX XX XX"
                    />
                  ) : (
                    <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                      <p className="dark-text-primary">{formData.telefon || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold dark-text-primary">E-posta</label>
                    {!isEditing && formData.email && (
                      <div className="flex items-center gap-2">
                        {emailVerified ? (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Doğrulandı
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Doğrulanmadı
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                        placeholder="ornek@firma.com"
                      />
                      {emailChanged && (
                        <p className="text-xs text-yellow-400">
                          E-posta değiştirildi. Kaydettikten sonra doğrulama email'i gönderilecek.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border flex items-center justify-between">
                      <p className="dark-text-primary">{formData.email || 'Belirtilmemiş'}</p>
                      {formData.email && !emailVerified && (
                        <button
                          onClick={handleSendVerificationEmail}
                          disabled={isSendingVerification}
                          className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors neumorphic-inset flex items-center gap-1"
                        >
                          {isSendingVerification ? (
                            <>
                              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Gönderiliyor...
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Doğrulama Gönder
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold dark-text-primary mb-1">Adres</label>
                  {isEditing ? (
                    <textarea
                      name="adres"
                      value={formData.adres}
                      onChange={handleChange}
                      rows="3"
                      className="w-full p-3 rounded-lg neumorphic-input dark-text-primary resize-none"
                      placeholder="Firma Adresi"
                    />
                  ) : (
                    <div className="p-3 dark-bg-tertiary neumorphic-inset rounded-lg border dark-border">
                      <p className="dark-text-primary whitespace-pre-wrap">{formData.adres || 'Belirtilmemiş'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                    // Form verilerini sıfırla
                    if (profileData) {
                      setFormData({
                        firmaAdi: profileData.firmaAdi || '',
                        yetkiliKisi: profileData.yetkiliKisi || '',
                        telefon: profileData.telefon || '',
                        email: profileData.email || '',
                        adres: profileData.adres || '',
                        vergiNo: profileData.vergiNo || ''
                      });
                    }
                  }}
                  className="px-6 py-2 border dark-border dark-text-primary rounded-lg neumorphic-inset hover:dark-bg-tertiary transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors"
                >
                  Kaydet
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors"
              >
                Kapat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

