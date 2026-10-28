import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { app } from '../firebase/config';

let messagingInstance: Messaging | null = null;

/**
 * Checks whether push notifications and service workers are supported by current browser
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;

  try {
    const supported = await isSupported();
    return supported;
  } catch (err) {
    console.warn('FCM isSupported check failed:', err);
    return false;
  }
}

/**
 * Get or initialize Firebase Messaging instance
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (messagingInstance) return messagingInstance;
  const supported = await isPushNotificationSupported();
  if (!supported) return null;

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (err) {
    console.warn('Failed to initialize Firebase Messaging:', err);
    return null;
  }
}

/**
 * Requests browser notification permission and retrieves FCM registration token
 * strictly after the user opts in.
 */
export async function requestPushNotificationToken(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  permission: NotificationPermission;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, permission: 'denied', error: 'Notifications not supported on this browser.' };
  }

  try {
    const currentPermission = Notification.permission;
    let finalPermission = currentPermission;

    if (currentPermission !== 'granted') {
      finalPermission = await Notification.requestPermission();
    }

    if (finalPermission !== 'granted') {
      return {
        success: false,
        permission: finalPermission,
        error: finalPermission === 'denied'
          ? 'Notification permission was denied in browser settings.'
          : 'Notification permission was dismissed.',
      };
    }

    // Register FCM Service Worker
    let swRegistration: ServiceWorkerRegistration;
    try {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/',
      });
      await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.warn('Could not register firebase-messaging-sw.js:', swErr);
      // Fallback to active service worker if already registered by PWA
      swRegistration = (await navigator.serviceWorker.getRegistration('/')) || (await navigator.serviceWorker.ready);
    }

    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return { success: false, permission: finalPermission, error: 'Firebase Messaging is unavailable on this device.' };
    }

    const token = await getToken(messaging, {
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      return { success: false, permission: finalPermission, error: 'Could not obtain FCM device registration token.' };
    }

    return { success: true, token, permission: finalPermission };
  } catch (err: any) {
    console.error('Error requesting push notification token:', err);
    return {
      success: false,
      permission: Notification.permission || 'denied',
      error: err?.message || 'Failed to register for push notifications.',
    };
  }
}

/**
 * Listen for foreground push notifications and dispatch to app UI
 */
export async function setupForegroundNotificationListener(
  onNotificationReceived: (payload: { title: string; body: string; data?: Record<string, any> }) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Cycle Companion';
      const body = payload.notification?.body || payload.data?.body || 'New cycle update available.';
      const data = payload.data;

      // Notify in-app subscriber
      onNotificationReceived({ title, body, data });

      // If document is currently hidden (e.g., user is on another browser tab), show native system notification
      if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/favicon.svg',
            tag: payload.data?.tag || 'cycle-notification',
          });
        } catch {
          // Some mobile browsers restrict new Notification constructor inside page context; SW handles it
        }
      }
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Error attaching onMessage listener:', err);
    return null;
  }
}

/**
 * Send a sample/test local notification to preview styling and test device/smartwatch mirroring
 */
export async function triggerLocalTestNotification(role: 'female' | 'male'): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;

  const title = role === 'male'
    ? 'Daily Check-in Received'
    : 'Gentle Cycle Reminder (3:00 PM)';

  const body = role === 'male'
    ? "Your partner has logged her updates for today. Tap to view today's vitals."
    : "How are you feeling this afternoon? Tap to log your comfort and energy.";

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/favicon.svg',
          tag: 'test-cycle-notification',
          vibrate: [200, 100, 200],
        } as any);
        return true;
      }
    }

    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/favicon.svg',
    });
    return true;
  } catch (err) {
    console.warn('Failed to trigger local notification:', err);
    return false;
  }
}
