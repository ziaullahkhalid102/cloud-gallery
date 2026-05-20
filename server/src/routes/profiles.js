const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDb } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');

const router = express.Router();

function getClipsDb() {
  const db = getDb();
  if (db) return { type: 'firestore', db };
  if (!inMemoryStore.clipFollowers) {
    inMemoryStore.clipFollowers = new Map();
  }
  return { type: 'memory' };
}

// GET /api/profiles/:userId — Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const store = getClipsDb();
    let user;

    if (store.type === 'firestore') {
      const userDoc = await store.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      const data = userDoc.data();
      user = {
        id: userDoc.id,
        name: data.name,
        email: data.email,
        picture: data.picture,
        username: data.username || null,
        bio: data.bio || null,
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0,
        videosCount: data.videosCount || 0,
        totalLikes: data.totalLikes || 0,
      };
    } else {
      const stored = inMemoryStore.users.get(userId);
      if (!stored) return res.status(404).json({ error: 'User not found' });
      user = {
        id: userId,
        name: stored.name,
        email: stored.email,
        picture: stored.picture,
        username: stored.username || null,
        bio: stored.bio || null,
        followersCount: stored.followersCount || 0,
        followingCount: stored.followingCount || 0,
        videosCount: stored.videosCount || 0,
        totalLikes: stored.totalLikes || 0,
      };
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// POST /api/profiles/:userId/follow — Toggle follow
router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const store = getClipsDb();
    const followKey = `${currentUserId}_${targetUserId}`;

    if (store.type === 'firestore') {
      const followRef = store.db.collection('clipFollowers').doc(followKey);
      const followDoc = await followRef.get();
      const admin = require('firebase-admin');

      if (followDoc.exists) {
        await followRef.delete();
        await store.db.collection('users').doc(targetUserId).update({
          followersCount: admin.firestore.FieldValue.increment(-1),
        });
        await store.db.collection('users').doc(currentUserId).update({
          followingCount: admin.firestore.FieldValue.increment(-1),
        });
        res.json({ following: false });
      } else {
        await followRef.set({
          followerId: currentUserId,
          followingId: targetUserId,
          createdAt: new Date().toISOString(),
        });
        await store.db.collection('users').doc(targetUserId).update({
          followersCount: admin.firestore.FieldValue.increment(1),
        });
        await store.db.collection('users').doc(currentUserId).update({
          followingCount: admin.firestore.FieldValue.increment(1),
        });
        res.json({ following: true });
      }
    } else {
      const isFollowing = inMemoryStore.clipFollowers.has(followKey);

      if (isFollowing) {
        inMemoryStore.clipFollowers.delete(followKey);
        res.json({ following: false });
      } else {
        inMemoryStore.clipFollowers.set(followKey, {
          followerId: currentUserId,
          followingId: targetUserId,
        });
        res.json({ following: true });
      }
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
});

module.exports = router;
