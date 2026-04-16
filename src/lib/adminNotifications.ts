import { Timestamp } from 'firebase/firestore';

// Utilisation de process.env (configuré dans vite.config.ts) ou import.meta.env
const telegramBotToken = process.env.VITE_TELEGRAM_BOT_TOKEN || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.VITE_TELEGRAM_CHAT_ID || import.meta.env.VITE_TELEGRAM_CHAT_ID;

interface AdminNotificationPayload {
  subject: string;
  text: string;
  html: string;
}

export async function sendAdminNotificationEmails(payload: AdminNotificationPayload) {
  if (!telegramBotToken || !telegramChatId) {
    console.warn('⚠️ [Telegram] Configuration manquante :', { 
      hasToken: !!telegramBotToken, 
      hasChatId: !!telegramChatId 
    });
    return;
  }

  console.log('🚀 [Telegram] Envoi d\'une notification...', payload.subject);

  // Telegram supporte l'HTML basique.
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
      console.error('❌ [Telegram] Erreur API:', errorData);
      throw new Error(`Telegram API Error: ${errorData.description}`);
    }

    console.log('✅ [Telegram] Notification envoyée avec succès !');
  } catch (error) {
    console.error('❌ [Telegram] Erreur lors de l\'envoi:', error);
    throw error;
  }
}
