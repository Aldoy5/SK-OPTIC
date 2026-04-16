import { Timestamp } from 'firebase/firestore';

const telegramBotToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const telegramChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

interface AdminNotificationPayload {
  subject: string;
  text: string;
  html: string;
}

export async function sendAdminNotificationEmails(payload: AdminNotificationPayload) {
  if (!telegramBotToken || !telegramChatId) {
    console.warn('Configuration Telegram manquante (Bot Token ou Chat ID).');
    return;
  }

  // Telegram supporte l'HTML basique. On simplifie le HTML ou on utilise le texte.
  // On combine le sujet et le texte pour le message Telegram.
  const message = `<b>${payload.subject}</b>\n\n${payload.text}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API Error: ${errorData.description}`);
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification Telegram:', error);
    throw error;
  }
}
