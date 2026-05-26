const express = require('express');
const { getDb } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');

const router = express.Router();

// GET /api/search/videos — Search videos by caption/hashtag
router.get('/videos', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
      return res.json({ videos: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const db = getDb();
    let videos = [];

    if (db) {
      const snapshot = await db
        .collection('clips')
        .orderBy('createdAt', 'desc')
        .limit(200)
        .get();

      videos = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(v => {
          const caption = (v.caption || '').toLowerCase();
          const tags = (v.hashtags || []).map(t => t.toLowerCase());
          return caption.includes(query) || tags.some(t => t.includes(query));
        })
        .slice(0, limit);
    } else {
      if (inMemoryStore.clips) {
        videos = Array.from(inMemoryStore.clips.entries())
          .map(([id, data]) => ({ id, ...data }))
          .filter(v => {
            const caption = (v.caption || '').toLowerCase();
            const tags = (v.hashtags || []).map(t => t.toLowerCase());
            return caption.includes(query) || tags.some(t => t.includes(query));
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const videosWithStream = videos.map(v => ({
      ...v,
      streamUrl: `${baseUrl}/api/clips/${v.id}/stream`,
    }));
    res.json({ videos: videosWithStream });
  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/search/users — Search users by name/email
router.get('/users', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) {
      return res.json({ users: [] });
    }

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const db = getDb();
    let users = [];

    if (db) {
      const snapshot = await db
        .collection('users')
        .limit(200)
        .get();

      users = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            email: data.email,
            picture: data.picture,
            username: data.username || null,
            followersCount: data.followersCount || 0,
            videosCount: data.videosCount || 0,
          };
        })
        .filter(u => {
          const name = (u.name || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const username = (u.username || '').toLowerCase();
          return name.includes(query) || email.includes(query) || username.includes(query);
        })
        .slice(0, limit);
    } else {
      users = Array.from(inMemoryStore.users.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          email: data.email,
          picture: data.picture,
          username: data.username || null,
          followersCount: data.followersCount || 0,
          videosCount: data.videosCount || 0,
        }))
        .filter(u => {
          const name = (u.name || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return name.includes(query) || email.includes(query);
        })
        .slice(0, limit);
    }

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
