import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export const requestGpsActivation = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') {
      const newPerm = await Geolocation.requestPermissions();
      if (newPerm.location !== 'granted') {
        throw new Error("Permission denied");
      }
    }

    if (Capacitor.getPlatform() === 'android') {
      const w = window as any;
      if (w.cordova && w.cordova.plugins && w.cordova.plugins.locationAccuracy) {
        await new Promise<void>((resolve, reject) => {
          w.cordova.plugins.locationAccuracy.request(
            w.cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY,
            () => resolve(),
            (error: any) => reject(new Error("GPS activation denied"))
          );
        });
      }
    }
  } catch (error) {
    console.error("requestGpsActivation error:", error);
    throw error;
  }
};
