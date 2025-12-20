import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const ChangePasswordModal = ({ isOpen, onClose, fetchWithAuth, API_URL, setLoading }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  // Şifre güçlülük kontrolü
  const validatePasswordStrength = (password) => {
    if (!password || password.length < 8) {
      return 'Şifre en az 8 karakter olmalıdır';
    }

    if (password.length > 128) {
      return 'Şifre en fazla 128 karakter olabilir';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const errors = [];
    if (!hasUpperCase) {
      errors.push('en az bir büyük harf');
    }
    if (!hasLowerCase) {
      errors.push('en az bir küçük harf');
    }
    if (!hasNumbers) {
      errors.push('en az bir sayı');
    }
    if (!hasSpecialChar) {
      errors.push('en az bir özel karakter (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }

    if (errors.length > 0) {
      return `Şifre güvenliği için şunlar gereklidir: ${errors.join(', ')}`;
    }

    return null;
  };

  // Şifre gereksinimlerini kontrol et (görsel gösterim için)
  const getPasswordRequirements = (password) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Şifre güçlülük kontrolü
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (oldPassword === newPassword) {
      setError('Yeni şifre eski şifre ile aynı olamaz');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showSuccess('Şifre başarıyla değiştirildi!');
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Şifre değiştirilemedi' }));
        setError(errorData.message || 'Şifre değiştirilemedi');
        showError(errorData.message || 'Şifre değiştirilemedi');
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      const errorMessage = 'Şifre değiştirilirken bir hata oluştu';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 modal-overlay" onClick={onClose}>
      <div className="dark-card-bg neumorphic-card rounded-2xl max-w-md w-full mx-4 modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold dark-text-primary">Şifre Değiştir</h2>
            <button
              onClick={onClose}
              className="dark-text-muted hover:dark-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="w-16 h-16 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-400">Şifre başarıyla değiştirildi!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/20 border dark-border rounded-lg neumorphic-inset">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold dark-text-primary mb-1">Eski Şifre</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold dark-text-primary mb-1">Yeni Şifre</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                  required
                  minLength={8}
                />
                <div className={`mt-2 overflow-hidden transition-all duration-300 ease-in-out ${newPassword ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-2.5 bg-gray-800/50 rounded-lg border dark-border">
                    <p className="text-xs font-semibold dark-text-primary mb-2">Şifre Gereksinimleri:</p>
                    <div className="space-y-1.5">
                      <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).minLength ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).minLength ? '✓' : '✗'}</span>
                        <span>En az 8 karakter</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasUpperCase ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasUpperCase ? '✓' : '✗'}</span>
                        <span>En az bir büyük harf (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasLowerCase ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasLowerCase ? '✓' : '✗'}</span>
                        <span>En az bir küçük harf (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasNumbers ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasNumbers ? '✓' : '✗'}</span>
                        <span>En az bir sayı (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${getPasswordRequirements(newPassword).hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
                        <span className="font-bold w-4 text-center">{getPasswordRequirements(newPassword).hasSpecialChar ? '✓' : '✗'}</span>
                        <span>En az bir özel karakter (!@#$%^&*()_+-=[]&#123;&#125;|;:,.&#60;&#62;?)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold dark-text-primary mb-1">Yeni Şifre Tekrar</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 rounded-lg neumorphic-input dark-text-primary"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border dark-border dark-text-primary rounded-lg neumorphic-inset hover:dark-bg-tertiary transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg neumorphic-inset hover:bg-blue-600 transition-colors"
                >
                  Değiştir
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

