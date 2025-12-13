import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number;
  longitude: number;
  error: string | null;
  loading: boolean;
  refetch: () => void;
}

const KUALA_LUMPUR_LAT = 3.139;
const KUALA_LUMPUR_LNG = 101.6869;

export function useGeolocation(): GeolocationState {
  const [latitude, setLatitude] = useState<number>(KUALA_LUMPUR_LAT);
  const [longitude, setLongitude] = useState<number>(KUALA_LUMPUR_LNG);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setError(null);
        setLoading(false);
      },
      (err: GeolocationPositionError) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
            break;
        }

        setError(errorMessage);
        // Fallback to Kuala Lumpur on error
        setLatitude(KUALA_LUMPUR_LAT);
        setLongitude(KUALA_LUMPUR_LNG);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    latitude,
    longitude,
    error,
    loading,
    refetch: fetchLocation,
  };
}
