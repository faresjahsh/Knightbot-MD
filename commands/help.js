const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const channelLink = global.channelLink || 'https://whatsapp.com/channel/0029Vb8jjfWCRs1sVz0x1w3v';
    const helpMessage = `
╔═══════════════════╗
   *🤖 ${settings.botName || 'KnightBot-MD'}*
   الإصدار: *${settings.version || '3.0.0'}*
   المطور: *${settings.botOwner || 'Mr Unique Hacker'}*
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
🖼️ *أوامر الصور الجاهزة*:
║ ➤ .pies <دولة> — إرسال صورة حسب الدولة
║ ➤ .china — صورة صينية جاهزة
║ ➤ .indonesia — صورة إندونيسية جاهزة
║ ➤ .japan — صورة يابانية جاهزة
║ ➤ .korea — صورة كورية جاهزة
║ ➤ .hijab — صورة حجاب جاهزة
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
║ ➤ .gpt <سؤال> — سؤال الذكاء الاصطناعي
║ ➤ .gemini <سؤال> — سؤال Gemini
║ ➤ .imagine <وصف> — توليد صورة بالذكاء الاصطناعي
║ ➤ .flux <وصف> — توليد صورة بأسلوب Flux
║ ➤ .sora <وصف> — توليد فيديو أو مشهد وصفي
╚═══════════════════╝

╔═══════════════════╗
🎯 *الأوامر الترفيهية*:
║ ➤ .compliment @مستخدم — إرسال مجاملة
║ ➤ .insult @مستخدم — إرسال مزحة هجومية
║ ➤ .flirt — إرسال كلام غزل
║ ➤ .shayari — إرسال شِعر أو خواطر
║ ➤ .goodnight — رسالة تصبح على خير
║ ➤ .roseday — رسالة يوم الوردة
║ ➤ .character @مستخدم — تحليل شخصية للمرح
║ ➤ .wasted @مستخدم — تأثير wasted على الصورة
║ ➤ .ship @مستخدم — نسبة توافق بين شخصين
║ ➤ .simp @مستخدم — حكم طريف على المستخدم
║ ➤ .stupid @مستخدم [نص] — رسالة مزاح للمستخدم
╚═══════════════════╝

╔═══════════════════╗
🔤 *أوامر Textmaker*:
║ ➤ .metallic <نص> — كتابة معدنية
║ ➤ .ice <نص> — كتابة ثلجية
║ ➤ .snow <نص> — كتابة بالثلج
║ ➤ .impressive <نص> — كتابة مميزة
║ ➤ .matrix <نص> — كتابة ستايل ماتريكس
║ ➤ .light <نص> — كتابة مضيئة
║ ➤ .neon <نص> — كتابة نيون
║ ➤ .devil <نص> — كتابة ستايل ديفل
║ ➤ .purple <نص> — كتابة بنفسجية
║ ➤ .thunder <نص> — كتابة برق
║ ➤ .leaves <نص> — كتابة بالأوراق
║ ➤ .1917 <نص> — كتابة ستايل 1917
║ ➤ .arena <نص> — كتابة أرينا
║ ➤ .hacker <نص> — كتابة هاكر
║ ➤ .sand <نص> — كتابة رملية
║ ➤ .blackpink <نص> — كتابة Blackpink
║ ➤ .glitch <نص> — كتابة جليتش
║ ➤ .fire <نص> — كتابة نارية
╚═══════════════════╝

╔═══════════════════╗
📥 *أوامر التحميل*:
║ ➤ .play <اسم> — تشغيل أو تنزيل صوت
║ ➤ .song <اسم> — تنزيل أغنية
║ ➤ .spotify <بحث> — جلب نتيجة من سبوتيفاي
║ ➤ .instagram <رابط> — تنزيل من إنستغرام
║ ➤ .facebook <رابط> — تنزيل من فيسبوك
║ ➤ .tiktok <رابط> — تنزيل من تيك توك
║ ➤ .video <اسم> — تنزيل فيديو
║ ➤ .ytmp4 <رابط> — تنزيل فيديو يوتيوب
╚═══════════════════╝

╔═══════════════════╗
🧩 *أوامر متنوعة*:
║ ➤ .heart — تأثير قلب
║ ➤ .horny — تأثير مرح
║ ➤ .circle — تأثير دائري
║ ➤ .lgbt — تأثير ألوان
║ ➤ .lolice — تأثير مضحك
║ ➤ .its-so-stupid — تأثير نصي
║ ➤ .namecard — إنشاء بطاقة اسم
║ ➤ .oogway — تصميم اقتباس
║ ➤ .tweet — تصميم تغريدة
║ ➤ .ytcomment — تصميم تعليق يوتيوب
║ ➤ .comrade — تأثير رفيق
║ ➤ .gay — تأثير مرح
║ ➤ .glass — تأثير زجاجي
║ ➤ .jail — تأثير السجن
║ ➤ .passed — تأثير نجاح
║ ➤ .triggered — تأثير Triggered
╚═══════════════════╝

╔═══════════════════╗
🖼️ *أوامر الأنمي*:
║ ➤ .nom — صورة أنمي أكل
║ ➤ .poke — صورة أنمي نكز
║ ➤ .cry — صورة أنمي بكاء
║ ➤ .kiss — صورة أنمي قبلة
║ ➤ .pat — صورة أنمي تربيت
║ ➤ .hug — صورة أنمي حضن
║ ➤ .wink — صورة أنمي غمزة
║ ➤ .facepalm — صورة أنمي تعجب
╚═══════════════════╝

╔═══════════════════╗
💻 *أوامر GitHub*:
║ ➤ .git — عرض رابط Git
║ ➤ .github — عرض معلومات المستودع
║ ➤ .sc / .script / .repo — إرسال رابط السورس
╚═══════════════════╝

📢 *قناة واتساب الرسمية للتحديثات:*
${channelLink}`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);

            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'KnightBot MD',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, {
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'KnightBot MD by Mr Unique Hacker',
                        serverMessageId: -1
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;
