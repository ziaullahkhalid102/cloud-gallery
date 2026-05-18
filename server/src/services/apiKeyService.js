const { getDb } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');
const { generateApiKey } = require('../utils/helpers');

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

module.exports = { createApiKey, regenerateApiKey, getApiKeyInfo };
