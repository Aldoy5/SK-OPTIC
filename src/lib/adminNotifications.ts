import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const adminNotificationEmails = (process.env.VITE_ADMIN_NOTIFICATION_EMAILS || '')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean);

interface AdminNotificationPayload {
  subject: string;
  text: string;
  html: string;
}


export async function sendAdminNotificationEmails(payload: AdminNotificationPayload) {
  if (!adminNotificationEmails.length) {
    return;
  }

  await Promise.all(
    adminNotificationEmails.map((to) =>
      addDoc(collection(db, 'mail'), {
        to: [to],
        message: {
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        },
        createdAt: Timestamp.now(),
      })
    )
  );
}
