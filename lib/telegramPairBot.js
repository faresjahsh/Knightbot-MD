const fetch = require('node-fetch');
const { normalizeNumber, requestPairingCode } = require('./pairingBridge');

const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
const developerId = String(process.env.TELEGRAM_DEVELOPER_ID || '').trim();
const apiBase = botToken ? `https://api.telegram.org/bot${botToken}` : '';
const awaitingNumbers = new Map();

let pollingStarted = false;
let updateOffset = 0;

function buildMainKeyboard() {
  return {
    inline_keyboard: [[{ text: 'ربط رقم واتس', callback_data: 'link_whatsapp' }]],
  };
}

async function telegramApi(method, body = {}) {
  if (!apiBase) return null;

  const response = await fetch(`${apiBase}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const error = new Error(data?.description || `Telegram API error on ${method}`);
    error.response = data;
    throw error;
  }

  return data.result;
}

async function sendMessage(chatId, text, extra = {}) {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  });
}

async function notifyDeveloper(text) {
  if (!developerId) return;
  try {
    await sendMessage(developerId, text);
  } catch (error) {
    console.error('Failed to notify developer on Telegram:', error.message);
  }
}

async function handleStart(chatId, firstName = '') {
  const safeName = firstName ? ` ${firstName}` : '';
  await sendMessage(
    chatId,
    `أهلاً${safeName}\n\nاضغط الزر بالأسفل لبدء ربط رقم الواتساب واستلام كود الاقتران الصحيح.\n\nأرسل الرقم مع مفتاح الدولة بدون مسافات وبدون علامة + في البداية.`,
    { reply_markup: buildMainKeyboard() }
  );
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery?.message?.chat?.id;
  const data = callbackQuery?.data;

  if (!chatId || !data) return;

  if (data === 'link_whatsapp') {
    awaitingNumbers.set(chatId, true);

    await telegramApi('answerCallbackQuery', {
      callback_query_id: callbackQuery.id,
      text: 'أرسل الرقم الآن',
      show_alert: false,
    }).catch(() => null);

    await sendMessage(
      chatId,
      'أرسل رقمك الآن بصيغة دولية صحيحة، مثال:\n9665XXXXXXXX\n\nالشروط:\n- بدون +\n- بدون مسافات\n- مع مفتاح الدولة'
    );
  }
}

async function handleNumberMessage(message) {
  const chatId = message?.chat?.id;
  const text = (message?.text || '').trim();

  if (!chatId || !text) return;

  if (text === '/start') {
    awaitingNumbers.delete(chatId);
    await handleStart(chatId, message?.from?.first_name || '');
    return;
  }

  if (!awaitingNumbers.get(chatId)) {
    return;
  }

  let normalized;
  try {
    normalized = normalizeNumber(text);
  } catch (error) {
    await sendMessage(chatId, `${error.message}\n\nأعد الإرسال بصيغة مثل: 9665XXXXXXXX`);
    return;
  }

  try {
    await sendMessage(chatId, 'جاري إنشاء كود الاقتران، انتظر قليلًا...');
    const result = await requestPairingCode(normalized);
    awaitingNumbers.delete(chatId);

    await sendMessage(
      chatId,
      `✅ <b>تم إنشاء كود الاقتران</b>\n\n📱 الرقم: <code>${result.number}</code>\n🔐 الكود: <code>${result.code}</code>\n\nطريقة الاستخدام:\n1) افتح واتساب\n2) الأجهزة المرتبطة\n3) ربط جهاز\n4) أدخل الكود كما هو`
    );
  } catch (error) {
    await sendMessage(chatId, `❌ ${error.message}`);
  }
}

async function processUpdate(update) {
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }

  if (update.message) {
    await handleNumberMessage(update.message);
  }
}

async function pollLoop() {
  while (pollingStarted) {
    try {
      const updates = await telegramApi('getUpdates', {
        timeout: 25,
        offset: updateOffset,
        allowed_updates: ['message', 'callback_query'],
      });

      for (const update of updates || []) {
        updateOffset = update.update_id + 1;
        await processUpdate(update);
      }
    } catch (error) {
      console.error('Telegram polling error:', error.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function startTelegramPairBot() {
  if (!botToken || pollingStarted) {
    return;
  }

  pollingStarted = true;

  try {
    await telegramApi('deleteWebhook', { drop_pending_updates: true }).catch(() => null);
    await notifyDeveloper('✅ تم تشغيل بوت التليجرام الخاص بأكواد الاقتران.');
    pollLoop().catch((error) => {
      console.error('Telegram polling loop crashed:', error.message);
    });
    console.log('✅ Telegram pairing bot started');
  } catch (error) {
    pollingStarted = false;
    console.error('Failed to start Telegram pairing bot:', error.message);
  }
}

module.exports = {
  startTelegramPairBot,
};
