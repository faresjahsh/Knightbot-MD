const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
  const channelLink = global.channelLink || settings.channelLink || 'https://whatsapp.com/channel/0029Vb8jjfWCRs1sVz0x1w3v';
  const repoUrl = global.repoUrl || settings.repoUrl || 'https://t.me/Faresw_bot';

  const helpMessage = `
╔═══════════════════╗
   *🤖 ${settings.botName || 'KnightBot-MD'}*
   الإصدار: *${settings.version || '3.0.0'}*
   المطور: *${settings.botOwner || 'Professor'}*
╚═══════════════════╝

*📜 قائمة الأوامر بالعربي:*

╔═══════════════════╗
🌐 *الأوامر العامة*:
║ ➤ .help / .menu / .bot — عرض قائمة الأوامر
║ ➤ .ping — فحص سرعة استجابة البوت
║ ➤ .alive — التأكد أن البوت يعمل
║ ➤ .tts <نص> — تحويل النص إلى صوت
║ ➤ .owner — عرض معلومات مالك البوت
║ ➤ .joke — إرسال نكتة عشوائية
║ ➤ .quote — إرسال اقتباس عشوائي
║ ➤ .fact — إرسال معلومة عشوائية
║ ➤ .weather <المدينة> — معرفة الطقس
║ ➤ .news — عرض آخر الأخبار
║ ➤ .attp <نص> — تحويل النص إلى ملصق متحرك
║ ➤ .lyrics <اسم الأغنية> — جلب كلمات الأغنية
║ ➤ .8ball <سؤال> — إجابة عشوائية على سؤالك
║ ➤ .groupinfo — عرض معلومات المجموعة
║ ➤ .staff / .admins — عرض مشرفي المجموعة
║ ➤ .vv — فتح رسالة العرض مرة واحدة
║ ➤ .trt <نص> <لغة> — ترجمة النص
║ ➤ .ss <رابط> — تصوير موقع من الرابط
║ ➤ .jid — إظهار المعرف
║ ➤ .url — استخراج الرابط من الرسالة
╚═══════════════════╝

╔═══════════════════╗
👮‍♂️ *أوامر الإدارة*:
║ ➤ .ban @مستخدم — حظر مستخدم
║ ➤ .promote @مستخدم — ترقية عضو إلى مشرف
║ ➤ .demote @مستخدم — تنزيل مشرف إلى عضو
║ ➤ .mute <دقائق> — كتم المجموعة مؤقتاً
║ ➤ .unmute — فك كتم المجموعة
║ ➤ .delete / .del — حذف رسالة
║ ➤ .kick @مستخدم — طرد عضو من المجموعة
║ ➤ .warnings @مستخدم — عرض تحذيرات العضو
║ ➤ .warn @مستخدم — إعطاء تحذير
║ ➤ .antilink — إدارة منع الروابط
║ ➤ .antibadword — إدارة منع الكلمات السيئة
║ ➤ .clear — تنظيف الرسائل أو البيانات المخصصة
║ ➤ .tag <رسالة> — منشن للأعضاء مع رسالة
║ ➤ .tagall — منشن لجميع الأعضاء
║ ➤ .tagnotadmin — منشن للأعضاء بدون المشرفين
║ ➤ .hidetag <رسالة> — إرسال منشن مخفي للجميع
║ ➤ .chatbot — تشغيل أو إيقاف الشات بوت
║ ➤ .resetlink — إعادة تعيين رابط المجموعة
║ ➤ .antitag <on/off> — منع المنشن المزعج
║ ➤ .welcome <on/off> — تشغيل رسالة الترحيب
║ ➤ .goodbye <on/off> — تشغيل رسالة الوداع
║ ➤ .setgdesc <وصف> — تغيير وصف المجموعة
║ ➤ .setgname <اسم جديد> — تغيير اسم المجموعة
║ ➤ .setgpp — تغيير صورة المجموعة بالرد على صورة
╚═══════════════════╝

╔═══════════════════╗
🔒 *أوامر المالك*:
║ ➤ .mode <public/private> — تغيير وضع البوت
║ ➤ .clearsession — حذف الجلسات القديمة
║ ➤ .antidelete — تشغيل أو إيقاف مانع الحذف
║ ➤ .cleartmp — حذف الملفات المؤقتة
║ ➤ .update — فحص تحديثات المشروع
║ ➤ .settings — عرض حالة إعدادات البوت
║ ➤ .setpp — تغيير صورة البوت بالرد على صورة
║ ➤ .autoreact <on/off> — تشغيل التفاعل التلقائي
║ ➤ .autostatus <on/off> — إدارة التفاعل مع الحالات
║ ➤ .autostatus react <on/off> — تشغيل تفاعل الحالات فقط
║ ➤ .autotyping <on/off> — إظهار الكتابة تلقائياً
║ ➤ .autoread <on/off> — تشغيل القراءة التلقائية
║ ➤ .anticall <on/off> — منع الاتصالات
║ ➤ .pmblocker <on/off/status> — إدارة حظر الخاص
║ ➤ .pmblocker setmsg <نص> — ضبط رسالة حظر الخاص
║ ➤ .setmention — تعيين رسالة المنشن من رد
║ ➤ .mention <on/off> — تشغيل أو إيقاف رد المنشن
╚═══════════════════╝

╔═══════════════════╗
🎨 *أوامر الصور والملصقات*:
║ ➤ .blur — تمويه الصورة المردود عليها
║ ➤ .simage — تحويل الملصق إلى صورة
║ ➤ .sticker — تحويل صورة أو فيديو إلى ملصق
║ ➤ .removebg — إزالة خلفية الصورة
║ ➤ .remini — تحسين جودة الصورة
║ ➤ .crop — قص الصورة المردود عليها
║ ➤ .tgsticker <رابط> — تنزيل ملصقات تيليجرام
║ ➤ .meme — إنشاء ميم
║ ➤ .take <اسم الحزمة> — تغيير بيانات الملصق
║ ➤ .emojimix <1>+<2> — دمج إيموجيين
║ ➤ .igs <رابط> — تنزيل ستوري إنستغرام
║ ➤ .igsc <رابط> — تنزيل محتوى إنستغرام
╚═══════════════════╝

╔═══════════════════╗
🎮 *أوامر الألعاب*:
║ ➤ .tictactoe @مستخدم — بدء لعبة إكس أو
║ ➤ .hangman — بدء لعبة الرجل المشنوق
║ ➤ .guess <حرف> — تخمين حرف في اللعبة
║ ➤ .trivia — بدء سؤال معلومات عامة
║ ➤ .answer <إجابة> — إرسال إجابة سؤال التريفيا
║ ➤ .truth — سؤال صراحة عشوائي
║ ➤ .dare — تحدي عشوائي
╚═══════════════════╝

╔═══════════════════╗
🤖 *أوامر الذكاء الاصطناعي*:
║ ➤ .ai <سؤال> — سؤال الذكاء الاصطناعي بالعربي
║ ➤ .gpt <سؤال> — سؤال الذكاء الاصطناعي
║ ➤ .gemini <سؤال> — سؤال Gemini
║ ➤ .imagine <وصف> — توليد صورة بالذكاء الاصطناعي
║ ➤ .flux <وصف> — توليد صورة بأسلوب Flux
║ ➤ .sora <وصف> — توليد فيديو أو مشهد وصفي
╚═══════════════════╝

╔═══════════════════╗
📥 *أوامر التحميل*:
║ ➤ .play <اسم> — تشغيل أو تنزيل صوت
║ ➤ .song <اسم> — تنزيل أغنية
║ ➤ .spotify <بحث> — جلب نتيجة من سبوتيفاي
║ ➤ .instagram <رابط> — تنزيل من إنستغرام
║ ➤ .facebook <رابط> — تنزيل من فيسبوك
║ ➤ .tiktok <رابط> — تنزيل من تيك توك بدون علامة مائية
║ ➤ .video <اسم> — تنزيل فيديو
║ ➤ .ytmp4 <رابط> — تنزيل فيديو يوتيوب
║ ➤ *مهم:* يمكنك أيضاً إرسال رابط تيك توك/إنستغرام/فيسبوك مباشرة وسيحاول البوت تنزيله تلقائياً.
╚═══════════════════╝

╔═══════════════════╗
💻 *أوامر GitHub*:
║ ➤ .git — عرض رابط Git
║ ➤ .github — عرض معلومات المستودع
║ ➤ .sc / .script / .repo — إرسال رابط السورس
╚═══════════════════╝

📢 *قناة واتساب الرسمية للتحديثات:*
${channelLink}

🔗 *رابط المشروع:*
${repoUrl}`;

  try {
    const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
    const hasImage = fs.existsSync(imagePath);
    const payload = hasImage
      ? {
          image: fs.readFileSync(imagePath),
          caption: helpMessage,
          footer: 'اضغط الزر لفتح القناة مباشرة',
          templateButtons: [
            {
              index: 1,
              urlButton: {
                displayText: 'عرض القناة',
                url: channelLink
              }
            },
            {
              index: 2,
              quickReplyButton: {
                displayText: 'معلومات المالك',
                id: 'owner'
              }
            }
          ]
        }
      : {
          text: helpMessage,
          footer: 'اضغط الزر لفتح القناة مباشرة',
          templateButtons: [
            {
              index: 1,
              urlButton: {
                displayText: 'عرض القناة',
                url: channelLink
              }
            },
            {
              index: 2,
              quickReplyButton: {
                displayText: 'معلومات المالك',
                id: 'owner'
              }
            }
          ]
        };

    await sock.sendMessage(chatId, payload, { quoted: message });
  } catch (error) {
    console.error('helpCommand send error:', error);
    try {
      const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        await sock.sendMessage(chatId, {
          image: fs.readFileSync(imagePath),
          caption: `${helpMessage}\n\nاضغط هذا الرابط لفتح القناة:\n${channelLink}`
        }, { quoted: message });
      } else {
        await sock.sendMessage(chatId, {
          text: `${helpMessage}\n\nاضغط هذا الرابط لفتح القناة:\n${channelLink}`
        }, { quoted: message });
      }
    } catch (fallbackError) {
      console.error('helpCommand fallback error:', fallbackError);
    }
  }
}

module.exports = helpCommand;
