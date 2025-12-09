import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const refreshProfile = async () => {
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
  };

  const firmaAdi = profileData?.firmaAdi ? profileData.firmaAdi.toUpperCase() : 'KULLANICI';

  return (
    <ProfileContext.Provider value={{ profileData, setProfileData, loading, refreshProfile, firmaAdi }}>
      {children}
    </ProfileContext.Provider>
  );
}
