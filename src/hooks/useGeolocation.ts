import { useState, useEffect } from 'react';
import { logger, LogCategory } from '../services/logging/logger';

interface GeolocationState {
  location: GeolocationPosition | null;
  error: GeolocationPositionError | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export function useGeolocation(options: GeolocationOptions = {}): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    // Check if geolocation is supported
    if (!('geolocation' in navigator)) {
      setState({
        location: null,
        error: {
          code: 0,
          message: 'Geolocation is not supported by your browser',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3
        } as GeolocationPositionError,
        loading: false
      });
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 30000
    };

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        location: position,
        error: null,
        loading: false
      });

      // Log location acquisition for crisis services
      logger.info('Location acquired for crisis services', {
        category: LogCategory.CRISIS,
        metadata: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setState({
        location: null,
        error,
        loading: false
      });

      // Log error for debugging
      logger.error('Failed to get location', new Error(error.message), {
        category: LogCategory.CRISIS,
        metadata: { errorCode: error.code }
      });
    };

    let watchId: number | null = null;

    if (options.watchPosition) {
      // Watch position for continuous updates
      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    } else {
      // Get current position once
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    }

    // Cleanup function
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(_watchId);
      }
    };
  }, [
    options.enableHighAccuracy,
    options.timeout,
    options.maximumAge,
    options.watchPosition
  ]);

  return state;
}