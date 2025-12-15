// Form validasyon yardımcı fonksiyonları

export const validateEmail = (email) => {
  if (!email) return { valid: false, message: 'E-posta adresi gereklidir' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Geçerli bir e-posta adresi giriniz' };
  }
  return { valid: true, message: '' };
};

export const validatePhone = (phone) => {
  if (!phone) return { valid: true, message: '' }; // Telefon opsiyonel
  const phoneRegex = /^[0-9+\s()-]+$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: 'Geçerli bir telefon numarası giriniz' };
  }
  return { valid: true, message: '' };
};

export const validateRequired = (value, fieldName) => {
  if (!value || value.trim() === '') {
    return { valid: false, message: `${fieldName} gereklidir` };
  }
  return { valid: true, message: '' };
};

export const validateNumber = (value, fieldName, min = null, max = null) => {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, message: `${fieldName} gereklidir` };
  }
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, message: `${fieldName} sayı olmalıdır` };
  }
  if (min !== null && num < min) {
    return { valid: false, message: `${fieldName} en az ${min} olmalıdır` };
  }
  if (max !== null && num > max) {
    return { valid: false, message: `${fieldName} en fazla ${max} olmalıdır` };
  }
  return { valid: true, message: '' };
};

export const validateDate = (date, fieldName) => {
  if (!date) {
    return { valid: false, message: `${fieldName} gereklidir` };
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, message: `Geçerli bir ${fieldName} giriniz` };
  }
  return { valid: true, message: '' };
};

export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: 'Şifre gereklidir' };
  }
  if (password.length < 3) {
    return { valid: false, message: 'Şifre en az 3 karakter olmalıdır' };
  }
  return { valid: true, message: '' };
};

export const getErrorMessage = (error) => {
  if (!error) return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  
  // Eğer error bir array ise, tüm mesajları birleştir
  if (Array.isArray(error)) {
    return error.join(', ');
  }
  
  if (typeof error === 'string') {
    // Kullanıcı dostu mesajlara çevir
    if (error.includes('network') || error.includes('fetch')) {
      return 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin.';
    }
    if (error.includes('401') || error.includes('unauthorized')) {
      return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
    }
    if (error.includes('403') || error.includes('forbidden')) {
      return 'Bu işlem için yetkiniz bulunmamaktadır.';
    }
    if (error.includes('404')) {
      return 'İstenen kaynak bulunamadı.';
    }
    if (error.includes('500') || error.includes('internal')) {
      return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
    }
    if (error.includes('timeout')) {
      return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }
    // Backend'den gelen Türkçe hata mesajlarını direkt göster
    return error;
  }
  
  if (error.message) {
    return getErrorMessage(error.message);
  }
  
  if (error.response?.data?.message) {
    return getErrorMessage(error.response.data.message);
  }
  
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
};
