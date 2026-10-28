import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK in secure server environment
admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered securely whenever a female partner logs or updates her daily check-in.
 * Sends an instant push notification to the connected male partner via FCM.
 * Includes deduplication to avoid repeat notifications for the same check-in date.
 */
export const notifyMalePartnerOnCheckIn = onDocumentWritten(
  {
    document: 'female_users/{femaleUid}/daily_logs/{dateStr}',
    region: 'us-central1',
  },
  async (event) => {
    // If document was deleted, do not send a notification
    if (!event.data?.after.exists) {
      return;
    }

    const { femaleUid, dateStr } = event.params;
    const logData = event.data.after.data();

    if (!logData) return;

    try {
      // 1. Fetch female partner profile
      const femaleUserDoc = await db.collection('female_users').doc(femaleUid).get();
      if (!femaleUserDoc.exists) {
        return;
      }

      const femaleProfile = femaleUserDoc.data() || {};
      const partnerConnected = femaleProfile.partnerConnected;
      const partnerName = femaleProfile.partnerName || 'Partner';
      const trackerName = femaleProfile.displayName || 'Your partner';
      const partnerFcmToken = femaleProfile.partnerFcmToken;
      const partnerNotificationsEnabled = femaleProfile.partnerNotificationsEnabled !== false;

      // 2. Validate that partner is connected and has enabled push notifications with an FCM token
      if (!partnerConnected || !partnerFcmToken || !partnerNotificationsEnabled) {
        return;
      }

      // 3. Deduplication check: Avoid sending multiple notifications for the same date check-in
      const dedupRef = db
        .collection('female_users')
        .doc(femaleUid)
        .collection('notification_logs')
        .doc(`${dateStr}_partner_checkin`);

      const dedupDoc = await dedupRef.get();
      if (dedupDoc.exists) {
        console.log(`Notification for ${dateStr} already delivered to partner. Skipping duplicate.`);
        return;
      }

      // 4. Construct safe, structured FCM Web Push Message
      const message: admin.messaging.Message = {
        token: partnerFcmToken,
        notification: {
          title: 'Daily Check-in Received',
          body: `${trackerName} has logged her updates for today. Tap to view today's vitals.`,
        },
        data: {
          type: 'partner_checkin',
          date: dateStr,
          partnerName,
          trackerName,
          url: '/',
        },
        webpush: {
          notification: {
            icon: '/pwa-192x192.png',
            badge: '/favicon.svg',
            tag: `checkin-${dateStr}`,
            requireInteraction: false,
          },
          fcmOptions: {
            link: '/',
          },
        },
      };

      // 5. Dispatch via FCM Admin API
      await admin.messaging().send(message);

      // 6. Record notification delivery to ensure no duplicates
      await dedupRef.set({
        deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
        recipientToken: partnerFcmToken.slice(0, 10) + '...',
        date: dateStr,
      });

      console.log(`Successfully sent check-in push notification to male partner for ${dateStr}.`);
    } catch (err: any) {
      console.error(`Error notifying male partner for ${femaleUid}:`, err);
      // If token is invalid or expired, automatically clear it to keep database healthy
      if (
        err?.code === 'messaging/registration-token-not-registered' ||
        err?.code === 'messaging/invalid-registration-token'
      ) {
        await db.collection('female_users').doc(femaleUid).update({
          partnerFcmToken: admin.firestore.FieldValue.delete(),
          partnerNotificationsEnabled: false,
        });
      }
    }
  }
);

/**
 * Scheduled Cloud Function running daily at 3:00 PM and 9:00 PM.
 * Checks whether the female user has submitted today's check-in.
 * If not submitted, sends a polite reminder notification.
 */
export const scheduledCheckInReminder = onSchedule(
  {
    schedule: '0 15,21 * * *', // 3:00 PM and 9:00 PM
    timeZone: 'UTC',
  },
  async () => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const todayStr = now.toISOString().split('T')[0];

    try {
      // 1. Query all female users who opted into push notifications
      const snapshot = await db
        .collection('female_users')
        .where('notificationsEnabled', '==', true)
        .get();

      if (snapshot.empty) {
        console.log('No female users subscribed to check-in reminders.');
        return;
      }

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const femaleUid = doc.id;
        const fcmToken = data.fcmToken;

        if (!fcmToken) continue;

        // 2. Check if today's check-in has already been submitted
        const todayLogRef = db
          .collection('female_users')
          .doc(femaleUid)
          .collection('daily_logs')
          .doc(todayStr);

        const todayLogDoc = await todayLogRef.get();
        if (todayLogDoc.exists) {
          // Female has already logged for today, skip reminder
          continue;
        }

        // 3. Deduplication check: Avoid repeat reminder for this specific slot
        const slotKey = `${todayStr}_reminder_${currentHour >= 18 ? 'evening' : 'afternoon'}`;
        const dedupRef = db
          .collection('female_users')
          .doc(femaleUid)
          .collection('notification_logs')
          .doc(slotKey);

        const dedupDoc = await dedupRef.get();
        if (dedupDoc.exists) {
          continue;
        }

        // 4. Tailor reminder message for 3:00 PM vs. 9:00 PM
        const isEvening = currentHour >= 18;
        const reminderTitle = isEvening
          ? 'Evening Cycle Check-in'
          : 'Gentle Cycle Reminder (3:00 PM)';

        const reminderBody = isEvening
          ? "Don't forget to log today's vitals and comfort before winding down."
          : 'How are you feeling this afternoon? Tap to log today’s updates.';

        const message: admin.messaging.Message = {
          token: fcmToken,
          notification: {
            title: reminderTitle,
            body: reminderBody,
          },
          data: {
            type: 'daily_reminder',
            date: todayStr,
            slot: isEvening ? 'evening' : 'afternoon',
            url: '/',
          },
          webpush: {
            notification: {
              icon: '/pwa-192x192.png',
              badge: '/favicon.svg',
              tag: `reminder-${slotKey}`,
            },
            fcmOptions: {
              link: '/',
            },
          },
        };

        try {
          await admin.messaging().send(message);
          await dedupRef.set({
            deliveredAt: admin.firestore.FieldValue.serverTimestamp(),
            slot: slotKey,
          });
        } catch (sendErr: any) {
          console.error(`Error sending reminder to ${femaleUid}:`, sendErr);
          if (
            sendErr?.code === 'messaging/registration-token-not-registered' ||
            sendErr?.code === 'messaging/invalid-registration-token'
          ) {
            await doc.ref.update({
              fcmToken: admin.firestore.FieldValue.delete(),
              notificationsEnabled: false,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error executing scheduled check-in reminders:', err);
    }
  }
);
