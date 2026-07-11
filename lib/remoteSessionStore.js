const axios = require('axios');

const DEFAULT_REMOTE_SESSION_BASE_URL = String(
  process.env.SESSION_STORAGE_BASE_URL ||
  process.env.DEFAULT_PUBLIC_BASE_URL ||
  process.env.PUBLIC_BASE_URL ||
  ''
).trim().replace(/\/+$/, '');
const SESSION_STORE_API_PREFIX = String(process.env.SESSION_STORAGE_API_PREFIX || '/api/session-store').trim() || '/api/session-store';
const SESSION_STORE_TOKEN = String(process.env.SESSION_STORAGE_TOKEN || '').trim();
const SESSION_STORE_TIMEOUT_MS = Math.max(5000, Number(process.env.SESSION_STORAGE_TIMEOUT_MS || 20000));

function normalizePhone(phone = '') {
  return String(phone || '').replace(/\D/g, '').trim();
}

function isRemoteSessionStoreEnabled() {
  return Boolean(DEFAULT_REMOTE_SESSION_BASE_URL);
}

function buildSessionStoreUrl(pathname = '') {
  return `${DEFAULT_REMOTE_SESSION_BASE_URL}${SESSION_STORE_API_PREFIX}${pathname}`;
}

function buildHeaders() {
  if (!SESSION_STORE_TOKEN) return {};
  return { 'x-session-store-token': SESSION_STORE_TOKEN };
}

async function request(config = {}) {
  if (!isRemoteSessionStoreEnabled()) {
    throw new Error('Remote session store base URL is not configured');
  }

  const response = await axios({
    timeout: SESSION_STORE_TIMEOUT_MS,
    ...config,
    headers: {
      ...(buildHeaders()),
      ...(config.headers || {})
    }
  });

  return response.data || {};
}

async function listRemoteSessions() {
  const data = await request({ method: 'GET', url: buildSessionStoreUrl('/list') });
  return Array.isArray(data.sessions) ? data.sessions : [];
}

async function fetchRemoteSession(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;
  const data = await request({ method: 'GET', url: buildSessionStoreUrl(`/${normalizedPhone}`) });
  return data.session || null;
}

async function upsertRemoteSession(phone, session = {}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;
  const data = await request({
    method: 'PUT',
    url: buildSessionStoreUrl(`/${normalizedPhone}`),
    data: {
      phone: normalizedPhone,
      session
    }
  });
  return data.session || null;
}

async function deleteRemoteSession(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return false;
  const data = await request({ method: 'DELETE', url: buildSessionStoreUrl(`/${normalizedPhone}`) });
  return data.deleted !== false;
}

async function touchRemoteSession(phone, metadata = {}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;
  const data = await request({
    method: 'POST',
    url: buildSessionStoreUrl(`/${normalizedPhone}/touch`),
    data: {
      phone: normalizedPhone,
      ownerId: metadata.ownerId || '',
      registered: metadata.registered === true,
      lastConnectedAt: metadata.lastConnectedAt || null
    }
  });
  return data.session || null;
}

module.exports = {
  isRemoteSessionStoreEnabled,
  listRemoteSessions,
  fetchRemoteSession,
  upsertRemoteSession,
  deleteRemoteSession,
  touchRemoteSession
};
