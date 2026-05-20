const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');

const router = express.Router();

function getNotifStore() {
  const db = getDb();
  if (db) return { type: 'firestore', db };
  if (!inMemoryStore.clipNotifications) {
    inMemoryStore.clipNotifications = new Map();
  }
  return { type: 'memory' };
}

// GET /api/notifications — Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const store = getNotifStore();
    let notifications = [];

    if (store.type === 'firestore') {
      try {
        const snapshot = await store.db
          .collection('clipNotifications')
          .where('toUserId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .offset((page - 1) * limit)
          .get();

        notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (indexErr) {
        // Fallback if composite index not yet created
        const snapshot = await store.db
          .collection('clipNotifications')
          .where('toUserId', '==', userId)
          .get();

        notifications = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice((page - 1) * limit, page * limit);
      }
    } else {
      const all = [];
      for (const [id, n] of inMemoryStore.clipNotifications) {
        if (n.toUserId === userId) {
          all.push({ id, ...n });
        }
      }
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      notifications = all.slice((page - 1) * limit, page * limit);
    }

    res.json({ notifications, page, limit });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

// GET /api/notifications/unread-count — Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const store = getNotifStore();
    let count = 0;

    if (store.type === 'firestore') {
      const snapshot = await store.db
        .collection('clipNotifications')
        .where('toUserId', '==', userId)
        .where('isRead', '==', false)
        .count()
        .get();
      count = snapshot.data().count;
    } else {
      for (const [, n] of inMemoryStore.clipNotifications) {
        if (n.toUserId === userId && !n.isRead) count++;
      }
    }

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// POST /api/notifications/:id/read — Mark as read
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const store = getNotifStore();

    if (store.type === 'firestore') {
      await store.db
        .collection('clipNotifications')
        .doc(req.params.id)
        .update({ isRead: true });
    } else {
      const n = inMemoryStore.clipNotifications.get(req.params.id);
      if (n) n.isRead = true;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/read-all — Mark all as read
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const store = getNotifStore();

    if (store.type === 'firestore') {
      const snapshot = await store.db
        .collection('clipNotifications')
        .where('toUserId', '==', userId)
        .where('isRead', '==', false)
        .get();

      const batch = store.db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
    } else {
      for (const [, n] of inMemoryStore.clipNotifications) {
        if (n.toUserId === userId) n.isRead = true;
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

module.exports = router;
