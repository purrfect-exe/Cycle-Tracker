import React, { useState, useEffect } from 'react';
import { useCycle } from '../../context/CycleContext';
import {
  Bell,
  BellOff,
  Check,
  AlertCircle,
  Loader2,
  Send,
  Watch,
  Smartphone,
} from 'lucide-react';
import {
  isPushNotificationSupported,
  requestPushNotificationToken,
  triggerLocalTestNotification,
} from '../../services/notificationService';
import {
  updateFemaleFcmToken,
  updateMaleFcmToken,
} from '../../firebase/cycleService';

export const NotificationSettingsCard: React.FC = () => {
  const { userRole, settings, isSampleDemo } = useCycle();
  const isFemale = userRole === 'female';
  const isMale = userRole === 'male';

  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [testSent, setTestSent] = useState<boolean>(false);

  useEffect(() => {
    // Check support and current permission on mount
    isPushNotificationSupported().then((supported) => {
      setIsSupported(supported);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
        const storedEnabled = localStorage.getItem('cycle_push_notifications_enabled') === 'true';
        setIsEnabled(Notification.permission === 'granted' && storedEnabled);
      }
    });
  }, []);

  const handleToggleNotifications = async () => {
    if (loading) return;

    if (isEnabled) {
      // Opt-out / Disable
      setIsEnabled(false);
      localStorage.setItem('cycle_push_notifications_enabled', 'false');

      if (!isSampleDemo && settings.femaleUid) {
        if (isFemale) {
          await updateFemaleFcmToken(settings.femaleUid, null, false);
        } else if (isMale) {
          await updateMaleFcmToken(settings.femaleUid, settings.secretCode, null, false);
        }
      }

      setFeedback('Notifications turned off.');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    // Explicit opt-in: Request browser permission and FCM token
    setLoading(true);
    setFeedback(null);

    const result = await requestPushNotificationToken();
    setPermission(result.permission);
    setLoading(false);

    if (result.success && result.token) {
      setIsEnabled(true);
      localStorage.setItem('cycle_push_notifications_enabled', 'true');

      // Persist token in Firestore for authenticated user
      if (!isSampleDemo && settings.femaleUid) {
        if (isFemale) {
          await updateFemaleFcmToken(settings.femaleUid, result.token, true);
        } else if (isMale) {
          await updateMaleFcmToken(settings.femaleUid, settings.secretCode, result.token, true);
        }
      }

      setFeedback('Notifications enabled! You will receive timely cycle updates.');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback(result.error || 'Permission was not granted.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    await triggerLocalTestNotification(userRole || 'female');
    setTimeout(() => setTestSent(false), 2500);
  };

  if (!isSupported) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DFECE5] shadow-xs space-y-2 font-sans">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700">Push Notifications</span>
        </div>
        <p className="text-xs text-slate-500">
          Push notifications are not supported in this browser mode or environment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DFECE5] shadow-xs space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                isEnabled
                  ? isMale
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1B3B2B] uppercase tracking-wider">
              Push Notifications
            </h3>
          </div>

          <p className="text-xs text-[#526A5E] leading-relaxed">
            {isFemale
              ? 'Receive gentle check-in reminders at 3:00 PM and 9:00 PM if today has not been logged.'
              : `Receive an instant update as soon as ${settings.trackerName || 'your partner'} logs her daily check-in.`}
          </p>
        </div>

        {/* Minimal Toggle Switch / Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={handleToggleNotifications}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-manipulation active:scale-[0.98] ${
              isEnabled
                ? isMale
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                  : 'bg-[#2D6A4F] hover:bg-[#214E3A] text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Requesting...</span>
              </>
            ) : isEnabled ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enabled</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Notifications</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Permission Blocked Helper */}
      {permission === 'denied' && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Notifications are currently blocked by browser settings. To receive updates, tap the lock/settings icon in your browser address bar and set Notifications to "Allow".
          </span>
        </div>
      )}

      {/* Feedback Message */}
      {feedback && (
        <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 animate-fade-in flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Test / Mirroring Support Hint */}
      {isEnabled && (
        <div className="pt-2 border-t border-[#DFECE5]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6D887C]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Mobile & PWA Ready</span>
            </span>
            <span className="flex items-center gap-1">
              <Watch className="w-3.5 h-3.5 text-slate-500" />
              <span>Smartwatch Mirroring Supported</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleSendTestNotification}
            disabled={testSent}
            className="text-[11px] font-bold text-[#2D6A4F] hover:underline flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
            <span>{testSent ? 'Sent!' : 'Send Test Notification'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
