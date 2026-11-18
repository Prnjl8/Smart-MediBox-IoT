import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Native Haptic Feedback Helpers
 */
export const nativeHaptics = {
  impactLight: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (navigator.vibrate) navigator.vibrate(20);
    }
  },
  impactMedium: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (navigator.vibrate) navigator.vibrate(40);
    }
  },
  impactHeavy: async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (navigator.vibrate) navigator.vibrate(80);
    }
  },
  success: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    }
  },
  warning: async () => {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
    }
  },
};

/**
 * Native Local Push Notifications
 */
export const nativeNotifications = {
  requestPermissions: async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
      return false;
    }
  },

  sendImmediate: async ({ title, body, id = Date.now() }) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 500) },
            sound: 'beep.wav',
            attachments: null,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' });
      }
    }
  },
};

/**
 * Initialize Mobile Status Bar
 */
export async function initMobileStatusBar() {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
  } catch {}
}
