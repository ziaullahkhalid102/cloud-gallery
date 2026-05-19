const jwt = require('jsonwebtoken');
const { getDb, admin } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();

    if (db) {
      const userDoc = await db.collection('users').doc(decoded.userId).get();
      if (!userDoc.exists) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = { id: decoded.userId, ...userDoc.data() };
    } else {
      const user = inMemoryStore.users.get(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.user = { id: decoded.userId, ...user };
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

async function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['x-embed-token'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key or embed token required' });
  }

  try {
    const db = getDb();
    let user;

    const isEmbed = apiKey.startsWith('cg_embed_');

    if (db) {
      const field = isEmbed ? 'embedToken' : 'apiKey';
      const snapshot = await db
        .collection('users')
        .where(field, '==', apiKey)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(401).json({ error: isEmbed ? 'Invalid embed token' : 'Invalid API key' });
      }

      const doc = snapshot.docs[0];
      user = { id: doc.id, ...doc.data() };
    } else {
      for (const [id, u] of inMemoryStore.users) {
        if (isEmbed ? u.embedToken === apiKey : u.apiKey === apiKey) {
          user = { id, ...u };
          break;
        }
      }
      if (!user) {
        return res.status(401).json({ error: isEmbed ? 'Invalid embed token' : 'Invalid API key' });
      }
    }

    // Track API usage
    if (db) {
      await db
        .collection('users')
        .doc(user.id)
        .update({
          apiUsageCount: admin.firestore.FieldValue.increment(1),
          lastApiUsage: new Date().toISOString(),
        });
    } else {
      const stored = inMemoryStore.users.get(user.id);
      stored.apiUsageCount = (stored.apiUsageCount || 0) + 1;
      stored.lastApiUsage = new Date().toISOString();
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { authenticateToken, authenticateApiKey };
