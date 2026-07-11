const { MongoClient } = require('mongodb');

const MONGODB_URI = String(process.env.MONGODB_URI || process.env.MONGO_URL || '').trim();
const MONGODB_DB_NAME = String(process.env.MONGODB_DB_NAME || 'faresbot').trim() || 'faresbot';
const SESSION_COLLECTION_NAME = String(process.env.MONGODB_SESSIONS_COLLECTION || 'whatsapp_sessions').trim() || 'whatsapp_sessions';
const SESSION_STORE_TIMEOUT_MS = Math.max(5000, Number(process.env.SESSION_STORAGE_TIMEOUT_MS || 20000));

let collectionPromise = null;

function normalizePhone(phone = '') {
  return String(phone || '').replace(/\D/g, '').trim();
}

function isRemoteSessionStoreEnabled() {
  return Boolean(MONGODB_URI);
}

function sanitizeSessionFiles(files = {}) {
  const output = {};
  for (const [fileName, rawContent] of Object.entries(files || {})) {
    const safeName = String(fileName || '').trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
    if (!safeName || !safeName.endsWith('.json')) continue;
    if (typeof rawContent !== 'string') continue;
    output[safeName] = rawContent;
  }
  return output;
}

function normalizeSessionDocument(phone, payload = {}) {
  const normalizedPhone = normalizePhone(phone || payload.phone || payload.sessionId || '');
  if (!normalizedPhone) return null;
  const now = new Date().toISOString();
  const files = sanitizeSessionFiles(payload.files || {});

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

async function listRemoteSessions() {
  const collection = await getSessionCollection();
  const sessions = await collection
    .find({}, { projection: { _id: 0 } })
    .sort({ lastConnectedAt: -1, updatedAt: -1, phone: 1 })
    .toArray();
  return Array.isArray(sessions) ? sessions : [];
}

async function fetchRemoteSession(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;
  const collection = await getSessionCollection();
  const session = await collection.findOne({ _id: normalizedPhone }, { projection: { _id: 0 } });
  return session || null;
}

async function upsertRemoteSession(phone, session = {}) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const collection = await getSessionCollection();
  const normalized = normalizeSessionDocument(normalizedPhone, session);
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

  await collection.updateOne(
    { _id: normalizedPhone },
    {
      $set: {
        phone: normalizedPhone,
        sessionId: normalizedPhone,
        ownerId: String(metadata.ownerId || '').trim(),
        registered: metadata.registered === true,
        lastConnectedAt: metadata.lastConnectedAt || null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        files: {},
        fileCount: 0,
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
