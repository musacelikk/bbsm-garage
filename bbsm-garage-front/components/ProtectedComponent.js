import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth-context';
import { API_URL } from '../config';

const ProtectedComponent = () => {
  const [protectedData, setProtectedData] = useState(null);
  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    const fetchProtectedData = async () => {
      const response = await fetchWithAuth(`${API_URL}/protected`);

      if (response.ok) {
        const data = await response.json();
        setProtectedData(data);
      } else {
        console.error('Failed to fetch protected data', response.status);
      }
    };

    fetchProtectedData();
  }, [fetchWithAuth]);

  return (
    <div>
      <h1>Protected Data</h1>
      {protectedData ? (
        <pre>{JSON.stringify(protectedData, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default ProtectedComponent;
