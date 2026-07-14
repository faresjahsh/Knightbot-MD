const { MongoClient } = require('mongodb');
const zlib = require('zlib');

const MONGODB_URI = String(process.env.MONGODB_URI || process.env.MONGO_URL || '').trim();
const MONGODB_DB_NAME = String(process.env.MONGODB_DB_NAME || 'faresbot').trim() || 'faresbot';
const SESSION_COLLECTION_NAME = String(process.env.MONGODB_SESSIONS_COLLECTION || 'whatsapp_sessions').trim() || 'whatsapp_sessions';
const SESSION_STORE_TIMEOUT_MS = Math.max(5000, Number(process.env.SESSION_STORAGE_TIMEOUT_MS || 20000));
const SESSION_COMPRESSION_MIN_BYTES = Math.max(256, Number(process.env.SESSION_COMPRESSION_MIN_BYTES || 512));

let collectionPromise = null;

function normalizePhone(phone = '') {
  return String(phone || '').replace(/\D/g, '').trim();
}

function isRemoteSessionStoreEnabled() {
  return Boolean(MONGODB_URI);
}

function encodeStoredFile(rawContent = '') {
  if (typeof rawContent !== 'string') return null;
  const buffer = Buffer.from(rawContent, 'utf8');
  if (!buffer.length) {
    return '';
  }

  if (buffer.length < SESSION_COMPRESSION_MIN_BYTES) {
    return rawContent;
  }

  try {
    const compressed = zlib.gzipSync(buffer, { level: 9 });
    if (compressed.length >= buffer.length) {
      return rawContent;
    }
    return {
      encoding: 'gzip-base64',
      data: compressed.toString('base64'),
      size: buffer.length,
      compressedSize: compressed.length,
    };
  } catch (_) {
    return rawContent;
  }
}

function decodeStoredFile(value) {
  if (typeof value === 'string') {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return '';
  }
  if (value.encoding === 'gzip-base64' && typeof value.data === 'string') {
    try {
      return zlib.gunzipSync(Buffer.from(value.data, 'base64')).toString('utf8');
    } catch (_) {
      return '';
    }
  }
  if (typeof value.content === 'string') {
    return value.content;
  }
  return '';
}

function sanitizeSessionFiles(files = {}, { forStorage = false } = {}) {
  const output = {};
  for (const [fileName, rawContent] of Object.entries(files || {})) {
    const safeName = String(fileName || '').trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    if (!safeName || !safeName.endsWith('.json')) continue;
    const content = forStorage ? encodeStoredFile(rawContent) : decodeStoredFile(rawContent);
    if (typeof content !== 'string' && (!content || typeof content !== 'object')) continue;
    output[safeName] = content;
  }
  return output;
}

function estimateFilesByteLength(files = {}) {
  let total = 0;
  for (const value of Object.values(files || {})) {
    if (typeof value === 'string') {
      total += Buffer.byteLength(value, 'utf8');
      continue;
    }
    if (value?.encoding === 'gzip-base64' && typeof value.data === 'string') {
      total += Buffer.byteLength(value.data, 'utf8');
    }
  }
  return total;
}

function normalizeSessionDocument(phone, payload = {}, { forStorage = false } = {}) {
  const normalizedPhone = normalizePhone(phone || payload.phone || payload.sessionId || '');
  if (!normalizedPhone) return null;
  const now = new Date().toISOString();
  const files = sanitizeSessionFiles(payload.files || {}, { forStorage });

  return {
    _id: normalizedPhone,
    phone: normalizedPhone,
    sessionId: normalizedPhone,
    ownerId: String(payload.ownerId || '').trim(),
    registered: payload.registered === true,
    lastConnectedAt: payload.lastConnectedAt || null,
    updatedAt: payload.updatedAt || now,
    files,
    fileCount: Object.keys(files).length,
    fileBytes: estimateFilesByteLength(files),
    storageVersion: 2,
  };
}

async function getSessionCollection() {
  if (!isRemoteSessionStoreEnabled()) {
    throw new Error('MongoDB session store is not configured');
  }

  if (!collectionPromise) {
    collectionPromise = (async () => {
      const client = new MongoClient(MONGODB_URI, {
        appName: 'KnightBot-MD Session Store',
        serverSelectionTimeoutMS: SESSION_STORE_TIMEOUT_MS,
        connectTimeoutMS: SESSION_STORE_TIMEOUT_MS,
        maxPoolSize: 10,
        retryWrites: true,
      });

      await client.connect();
      const db = client.db(MONGODB_DB_NAME);
      const collection = db.collection(SESSION_COLLECTION_NAME);
      await Promise.allSettled([
        collection.createIndex({ phone: 1 }, { unique: true }),
        collection.createIndex({ updatedAt: -1 }),
        collection.createIndex({ lastConnectedAt: -1 }),
      ]);
      return collection;
    })().catch((error) => {
      collectionPromise = null;
      throw error;
    });
  }

  return collectionPromise;
}

function normalizeFetchedSession(doc = {}) {
  if (!doc) return null;
  const normalizedPhone = normalizePhone(doc.phone || doc.sessionId || doc._id || '');
  if (!normalizedPhone) return null;
  const files = sanitizeSessionFiles(doc.files || {}, { forStorage: false });
  return {
    ...doc,
    phone: normalizedPhone,
    sessionId: normalizedPhone,
    ownerId: String(doc.ownerId || '').trim(),
    registered: doc.registered === true,
    lastConnectedAt: doc.lastConnectedAt || null,
    updatedAt: doc.updatedAt || null,
    files,
    fileCount: Object.keys(files).length,
  };
}

async function listRemoteSessions() {
  const collection = await getSessionCollection();
  const sessions = await collection
    .find({}, { projection: { _id: 0, files: 0 } })
    .sort({ lastConnectedAt: -1, updatedAt: -1, phone: 1 })
    .toArray();
  return Array.isArray(sessions) ? sessions.map((item) => normalizeFetchedSession(item)).filter(Boolean) : [];
}

async function fetchRemoteSession(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;
  const collection = await getSessionCollection();
  const session = await collection.findOne({ _id: normalizedPhone }, { projection: { _id: 0 } });
  return normalizeFetchedSession(session || null);
}

async function upsertRemoteSession(phone, session = {}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const collection = await getSessionCollection();
  const normalized = normalizeSessionDocument(normalizedPhone, session, { forStorage: true });
  if (!normalized) return null;

  await collection.updateOne(
    { _id: normalizedPhone },
    {
      $set: {
        phone: normalized.phone,
        sessionId: normalized.sessionId,
        ownerId: normalized.ownerId,
        registered: normalized.registered,
        lastConnectedAt: normalized.lastConnectedAt,
        updatedAt: normalized.updatedAt,
        files: normalized.files,
        fileCount: normalized.fileCount,
        fileBytes: normalized.fileBytes,
        storageVersion: normalized.storageVersion,
      },
      $setOnInsert: {
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  return fetchRemoteSession(normalizedPhone);
}

async function deleteRemoteSession(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return false;
  const collection = await getSessionCollection();
  const result = await collection.deleteOne({ _id: normalizedPhone });
  return result.deletedCount > 0;
}

async function touchRemoteSession(phone, metadata = {}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;
  const collection = await getSessionCollection();
  const now = new Date().toISOString();

  const setPayload = {
    phone: normalizedPhone,
    sessionId: normalizedPhone,
    updatedAt: now,
  };

  if (String(metadata.ownerId || '').trim()) {
    setPayload.ownerId = String(metadata.ownerId || '').trim();
  }
  if (typeof metadata.registered !== 'undefined') {
    setPayload.registered = metadata.registered === true;
  }
  if (Object.prototype.hasOwnProperty.call(metadata, 'lastConnectedAt')) {
    setPayload.lastConnectedAt = metadata.lastConnectedAt || null;
  }

  await collection.updateOne(
    { _id: normalizedPhone },
    {
      $set: setPayload,
      $setOnInsert: {
        createdAt: now,
        files: {},
        fileCount: 0,
        fileBytes: 0,
        storageVersion: 2,
      },
    },
    { upsert: true }
  );

  return fetchRemoteSession(normalizedPhone);
}

module.exports = {
  isRemoteSessionStoreEnabled,
  listRemoteSessions,
  fetchRemoteSession,
  upsertRemoteSession,
  deleteRemoteSession,
  touchRemoteSession,
};
