import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../auth-context';
import { API_URL } from '../config';

const ProfileContext = createContext();

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }) {
  const { fetchWithAuth, user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetchWithAuth ve user hazır olana kadar bekle
    if (!fetchWithAuth || !user) {
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/auth/profile`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [fetchWithAuth, user]); // fetchWithAuth ve user hazır olduğunda çalış

  const refreshProfile = useCallback(async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/auth/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        return data;
      }
    } catch (error) {
      console.error('Profil yenileme hatası:', error);
    }
  }, [fetchWithAuth]);

  const firmaAdi = profileData?.firmaAdi ? profileData.firmaAdi.toUpperCase() : 'KULLANICI';

  // Context value'yu memoize et
  const contextValue = useMemo(() => ({
    profileData,
    setProfileData,
    loading,
    refreshProfile,
    firmaAdi
  }), [profileData, loading, refreshProfile, firmaAdi]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}
