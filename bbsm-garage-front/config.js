// API Configuration
const getApiUrl = () => {
  // Client-side'da kullanılabilir olması için NEXT_PUBLIC_ prefix'i gerekli
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }
  // Server-side'da
  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000';
};

export const API_URL = getApiUrl();

