const { getDb } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');
const { generateApiKey, generateEmbedToken } = require('../utils/helpers');

async function createApiKey(userId) {
  const apiKey = generateApiKey();
  const db = getDb();

  if (db) {
    await db.collection('users').doc(userId).update({
      apiKey,
      apiKeyCreatedAt: new Date().toISOString(),
      apiUsageCount: 0,
    });
  } else {
    const user = inMemoryStore.users.get(userId);
    if (user) {
      user.apiKey = apiKey;
      user.apiKeyCreatedAt = new Date().toISOString();
      user.apiUsageCount = 0;
    }
  }

  return apiKey;
}

async function regenerateApiKey(userId) {
  return createApiKey(userId);
}

async function deleteApiKey(userId) {
  const db = getDb();

  if (db) {
    await db.collection('users').doc(userId).update({
      apiKey: null,
      apiKeyCreatedAt: null,
      apiUsageCount: 0,
      lastApiUsage: null,
    });
  } else {
    const user = inMemoryStore.users.get(userId);
    if (user) {
      user.apiKey = null;
      user.apiKeyCreatedAt = null;
      user.apiUsageCount = 0;
      user.lastApiUsage = null;
    }
  }
}

async function getApiKeyInfo(userId) {
  const db = getDb();
  let user;

  if (db) {
    const doc = await db.collection('users').doc(userId).get();
    user = doc.data();
  } else {
    user = inMemoryStore.users.get(userId);
  }

  if (!user) return null;

  return {
    apiKey: user.apiKey || null,
    createdAt: user.apiKeyCreatedAt || null,
    usageCount: user.apiUsageCount || 0,
    lastUsage: user.lastApiUsage || null,
  };
}

async function createEmbedToken(userId) {
  const embedToken = generateEmbedToken();
  const db = getDb();

  if (db) {
    await db.collection('users').doc(userId).update({
      embedToken,
      embedTokenCreatedAt: new Date().toISOString(),
    });
  } else {
    const user = inMemoryStore.users.get(userId);
    if (user) {
      user.embedToken = embedToken;
      user.embedTokenCreatedAt = new Date().toISOString();
    }
  }

  return embedToken;
}

async function deleteEmbedToken(userId) {
  const db = getDb();

  if (db) {
    await db.collection('users').doc(userId).update({
      embedToken: null,
      embedTokenCreatedAt: null,
    });
  } else {
    const user = inMemoryStore.users.get(userId);
    if (user) {
      user.embedToken = null;
      user.embedTokenCreatedAt = null;
    }
  }
}

async function getEmbedTokenInfo(userId) {
  const db = getDb();
  let user;

  if (db) {
    const doc = await db.collection('users').doc(userId).get();
    user = doc.data();
  } else {
    user = inMemoryStore.users.get(userId);
  }

  if (!user) return null;

  return {
    embedToken: user.embedToken || null,
    createdAt: user.embedTokenCreatedAt || null,
  };
}

module.exports = {
  createApiKey,
  regenerateApiKey,
  deleteApiKey,
  getApiKeyInfo,
  createEmbedToken,
  deleteEmbedToken,
  getEmbedTokenInfo,
};
