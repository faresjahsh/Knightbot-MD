const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

function parseRepoInfo(repoUrl = '') {
  const match = String(repoUrl).match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) {
    return { owner: 'faresjahsh', repo: 'Knightbot-MD', htmlUrl: 'https://github.com/faresjahsh/Knightbot-MD' };
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ''),
    htmlUrl: `https://github.com/${match[1]}/${match[2].replace(/\.git$/i, '')}`
  };
}

async function githubCommand(sock, chatId, message) {
  try {
    const repoInfo = parseRepoInfo(settings.repoUrl || global.repoUrl);
    const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'KnightBot-MD'
      }
    });

    if (!res.ok) throw new Error('GitHub API request failed');
    const json = await res.json();

    let txt = `*📦 معلومات المستودع*\n\n`;
    txt += `*الاسم:* ${json.full_name || `${repoInfo.owner}/${repoInfo.repo}`}\n`;
    txt += `*الوصف:* ${json.description || 'لا يوجد وصف'}\n`;
    txt += `*النجوم:* ${json.stargazers_count ?? 0}\n`;
    txt += `*الفوركات:* ${json.forks_count ?? 0}\n`;
    txt += `*المشاهدات:* ${json.watchers_count ?? 0}\n`;
    txt += `*الحجم:* ${Number.isFinite(json.size) ? (json.size / 1024).toFixed(2) : '0.00'} MB\n`;
    txt += `*آخر تحديث:* ${json.updated_at ? moment(json.updated_at).format('DD/MM/YYYY - HH:mm:ss') : 'غير معروف'}\n`;
    txt += `*الرابط:* ${json.html_url || repoInfo.htmlUrl}`;

    const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
    if (fs.existsSync(imgPath)) {
      const imgBuffer = fs.readFileSync(imgPath);
      await sock.sendMessage(chatId, { image: imgBuffer, caption: txt }, { quoted: message });
      return;
    }

    await sock.sendMessage(chatId, { text: txt }, { quoted: message });
  } catch (error) {
    console.error('githubCommand error:', error);
    await sock.sendMessage(chatId, {
      text: `❌ تعذر جلب معلومات المستودع الآن.\n${settings.repoUrl || global.repoUrl || ''}`.trim()
    }, { quoted: message });
  }
}

module.exports = githubCommand;
