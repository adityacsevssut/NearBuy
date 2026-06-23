import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import toast from 'react-hot-toast';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const initPushNotifications = async (accessToken: string | null) => {
  // Only proceed if we are running as a native app (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  // We need an access token to attach the FCM token to the user's account
  if (!accessToken) {
    return;
  }

  try {
    // 1. Request permissions from the OS natively (Bypasses web/browser limits)
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('User denied native push notification permission');
      return;
    }

    // 2. Register with Apple / Google to receive push via APNs/FCM
    await PushNotifications.register();

    // 3. Listen for successful registration & grab the token
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, native token: ' + token.value);
      
      // 4. Send this native FCM token to the backend
      try {
        const deviceType = Capacitor.getPlatform(); // 'android' | 'ios'
        
        await fetch(`${API}/api/notifications/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ 
            token: token.value, 
            device_type: deviceType 
          })
        });
        console.log('Successfully synced Push Token to backend');
      } catch (err) {
        console.error('Failed to sync Push Token to backend', err);
      }
    });

    // 4. Handle Registration Errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // 5. Handle incoming push notification while the app is actively open (foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received in foreground: ', notification);
      // Removed toast here to prevent duplicate toasts, since Socket.IO (NotificationContext) 
      // already shows a real-time notification UI for both web and app.
    });

    // 6. Handle action performed (When user taps the notification from the system tray)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ', notification);
      // Optional: You can route the user to specific pages here
      // e.g. window.location.href = '/orders/' + notification.notification.data.orderId;
    });

  } catch (error) {
    console.error('Error initializing push notifications', error);
  }
};
