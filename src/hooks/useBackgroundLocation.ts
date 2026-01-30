import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

// Types for the location data we care about
export interface LocationData {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    altitude: number | null;
  };
  timestamp: string;
}

export interface UseBackgroundLocationOptions {
  onLocation: (location: LocationData) => void;
  onError?: (error: string) => void;
}

export function useBackgroundLocation({ onLocation, onError }: UseBackgroundLocationOptions) {
  const [isTracking, setIsTracking] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastLocation, setLastLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webWatchIdRef = useRef<number | null>(null);
  const bgGeoRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);

  // Initialize background geolocation plugin
  useEffect(() => {
    const initPlugin = async () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      setIsNative(isNativePlatform);

      if (isNativePlatform) {
        try {
          // Dynamic import for native platform
          const module = await import('@transistorsoft/capacitor-background-geolocation');
          const BackgroundGeolocation = module.default;
          bgGeoRef.current = BackgroundGeolocation;

          // Configure the plugin
          await BackgroundGeolocation.ready({
            // Geolocation Config
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            distanceFilter: 10, // meters
            // Activity Recognition
            stopTimeout: 5,
            // Application config
            debug: false, // Set to true for debugging sounds/notifications
            logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
            stopOnTerminate: false, // Continue tracking when app is terminated
            startOnBoot: true, // Auto-start on device boot
            // HTTP / Persistence
            batchSync: false,
            autoSync: false, // We'll handle sync ourselves
            // iOS specific
            pausesLocationUpdatesAutomatically: false,
            // Android specific
            foregroundService: true,
            notification: {
              title: 'Shwe Leo',
              text: 'Sharing live location with dispatch',
              channelName: 'Location Tracking',
              smallIcon: 'drawable/ic_notification',
              largeIcon: 'drawable/ic_launcher',
              priority: BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH,
            },
            enableHeadless: true,
          });

          setIsReady(true);
          console.log('[BackgroundGeolocation] Plugin ready');
        } catch (err: any) {
          console.error('[BackgroundGeolocation] Failed to initialize:', err);
          setError('Failed to initialize background location');
          onError?.('Failed to initialize background location');
          // Fall back to web mode
          setIsNative(false);
          setIsReady(true);
        }
      } else {
        // Web platform - use standard geolocation
        setIsReady(true);
      }
    };

    initPlugin();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, [onError]);

  const startTracking = useCallback(async () => {
    setError(null);

    if (isNative && bgGeoRef.current) {
      try {
        const BackgroundGeolocation = bgGeoRef.current;
        
        // Set up location listener
        subscriptionRef.current = BackgroundGeolocation.onLocation((location: any) => {
          const locationData: LocationData = {
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              speed: location.coords.speed ?? null,
              heading: location.coords.heading ?? null,
              altitude: location.coords.altitude ?? null,
            },
            timestamp: location.timestamp || new Date().toISOString(),
          };
          setLastLocation(locationData);
          onLocation(locationData);
        }, (errorCode: any) => {
          console.error('[BackgroundGeolocation] Location error:', errorCode);
        });

        await BackgroundGeolocation.start();
        setIsTracking(true);
        console.log('[BackgroundGeolocation] Started tracking');
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to start tracking';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } else {
      // Web fallback
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      webWatchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const locationData: LocationData = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading,
              altitude: position.coords.altitude,
            },
            timestamp: new Date().toISOString(),
          };
          setLastLocation(locationData);
          onLocation(locationData);
        },
        (err) => {
          let errorMsg = 'Unknown location error';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = 'Location permission denied. Please enable location access.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = 'Location unavailable. Please check GPS settings.';
              break;
            case err.TIMEOUT:
              errorMsg = 'Location request timed out.';
              break;
          }
          setError(errorMsg);
          onError?.(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
      setIsTracking(true);
    }
  }, [isNative, onLocation, onError]);

  const stopTracking = useCallback(async () => {
    if (isNative && bgGeoRef.current) {
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.remove();
          subscriptionRef.current = null;
        }
        await bgGeoRef.current.stop();
        setIsTracking(false);
        console.log('[BackgroundGeolocation] Stopped tracking');
      } catch (err: any) {
        console.error('[BackgroundGeolocation] Failed to stop:', err);
      }
    } else {
      // Web fallback
      if (webWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(webWatchIdRef.current);
        webWatchIdRef.current = null;
      }
      setIsTracking(false);
    }
  }, [isNative]);

  const getCurrentPosition = useCallback(async (): Promise<LocationData | null> => {
    if (isNative && bgGeoRef.current) {
      try {
        const location = await bgGeoRef.current.getCurrentPosition({
          timeout: 30,
          maximumAge: 5000,
          desiredAccuracy: 10,
        });
        return {
          coords: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            speed: location.coords.speed ?? null,
            heading: location.coords.heading ?? null,
            altitude: location.coords.altitude ?? null,
          },
          timestamp: location.timestamp || new Date().toISOString(),
        };
      } catch (err) {
        console.error('[BackgroundGeolocation] Failed to get current position:', err);
        return null;
      }
    } else {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed,
                heading: position.coords.heading,
                altitude: position.coords.altitude,
              },
              timestamp: new Date().toISOString(),
            });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }
  }, [isNative]);

  return {
    isTracking,
    isNative,
    isReady,
    lastLocation,
    error,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}
