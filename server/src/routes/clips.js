const express = require('express');
const { createOAuth2Client } = require('../config/google');
const { authenticateToken, authenticateApiKey } = require('../middleware/auth');
const { upload, getFileCategory } = require('../middleware/fileValidation');
const { apiLimiter } = require('../middleware/rateLimiter');
const driveService = require('../services/driveService');
const { getDb } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');

const router = express.Router();

function getClipsDb() {
  const db = getDb();
  if (db) return { type: 'firestore', db };
  if (!inMemoryStore.clips) {
    inMemoryStore.clips = new Map();
    inMemoryStore.clipLikes = new Map();
    inMemoryStore.clipComments = new Map();
    inMemoryStore.clipFollowers = new Map();
  }
  return { type: 'memory' };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// POST /api/clips/upload — Upload video clip
router.post('/upload', apiLimiter, authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (!videoMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only video files are allowed (mp4, webm, mov, mkv)' });
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File exceeds 100MB limit' });
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: req.user.accessToken,
      refresh_token: req.user.refreshToken,
      expiry_date: req.user.tokenExpiry,
    });

    const folderId = await driveService.getOrCreateAppFolder(oauth2Client);
    const fileName = `clip_${Date.now()}_${req.file.originalname}`;

    const fileData = await driveService.uploadFileToDrive(
      oauth2Client,
      req.file.buffer,
      fileName,
      req.file.mimetype,
      folderId
    );

    const caption = req.body.caption || '';
    const hashtags = req.body.hashtags ? req.body.hashtags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const duration = parseInt(req.body.duration) || 0;

    const clipData = {
      userId: req.user.id,
      userName: req.user.name || req.user.email,
      userPicture: req.user.picture || null,
      driveFileId: fileData.id,
      caption,
      hashtags,
      videoUrl: fileData.webContentLink || '',
      thumbnailUrl: null,
      duration,
      views: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    };

    const store = getClipsDb();
    let clipId;

    if (store.type === 'firestore') {
      const docRef = await store.db.collection('clips').add(clipData);
      clipId = docRef.id;
    } else {
      clipId = generateId();
      inMemoryStore.clips.set(clipId, clipData);
    }

    res.json({
      success: true,
      video: { id: clipId, ...clipData },
    });
  } catch (error) {
    console.error('Clip upload error:', error);
    if (error.code === 401) {
      return res.status(401).json({ error: 'Google Drive authorization expired' });
    }
    res.status(500).json({ error: 'Failed to upload clip' });
  }
});

// Helper: Add stream URL to video objects
function addStreamUrl(videos, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return videos.map(v => ({
    ...v,
    streamUrl: `${baseUrl}/api/clips/${v.id}/stream`,
  }));
}

// GET /api/clips/feed — Get video feed
router.get('/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const store = getClipsDb();
    let videos = [];

    if (store.type === 'firestore') {
      const snapshot = await store.db
        .collection('clips')
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit)
        .get();

      videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const allClips = Array.from(inMemoryStore.clips.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      videos = allClips.slice(offset, offset + limit);
    }

    res.json({ videos: addStreamUrl(videos, req), page, limit });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

// GET /api/clips/trending — Get trending videos
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const store = getClipsDb();
    let videos = [];

    if (store.type === 'firestore') {
      const snapshot = await store.db
        .collection('clips')
        .orderBy('likesCount', 'desc')
        .limit(limit)
        .get();
      videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const allClips = Array.from(inMemoryStore.clips.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.likesCount - a.likesCount);
      videos = allClips.slice(0, limit);
    }

    res.json({ videos: addStreamUrl(videos, req) });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to load trending' });
  }
});

// GET /api/clips/user/:userId — Get user's clips
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const store = getClipsDb();
    let videos = [];

    if (store.type === 'firestore') {
      const snapshot = await store.db
        .collection('clips')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      videos = Array.from(inMemoryStore.clips.entries())
        .filter(([, data]) => data.userId === userId)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ videos: addStreamUrl(videos, req) });
  } catch (error) {
    console.error('User clips error:', error);
    res.status(500).json({ error: 'Failed to load user clips' });
  }
});

// POST /api/clips/:id/like — Toggle like on a clip
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const clipId = req.params.id;
    const userId = req.user.id;
    const store = getClipsDb();

    if (store.type === 'firestore') {
      const likeRef = store.db.collection('clipLikes').doc(`${userId}_${clipId}`);
      const likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        await likeRef.delete();
        await store.db.collection('clips').doc(clipId).update({
          likesCount: require('firebase-admin').firestore.FieldValue.increment(-1),
        });
        res.json({ liked: false });
      } else {
        await likeRef.set({ userId, clipId, createdAt: new Date().toISOString() });
        await store.db.collection('clips').doc(clipId).update({
          likesCount: require('firebase-admin').firestore.FieldValue.increment(1),
        });
        res.json({ liked: true });

        // Create like notification
        try {
          const clipDoc = await store.db.collection('clips').doc(clipId).get();
          const clipData = clipDoc.data();
          if (clipData && clipData.userId !== userId) {
            await store.db.collection('clipNotifications').add({
              toUserId: clipData.userId,
              type: 'like',
              fromUserId: userId,
              fromUserName: req.user.name || req.user.email,
              fromUserPicture: req.user.picture || null,
              videoId: clipId,
              videoCaption: clipData.caption || '',
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (notifErr) {
          console.error('Like notification error:', notifErr);
        }
      }
    } else {
      const likeKey = `${userId}_${clipId}`;
      const isLiked = inMemoryStore.clipLikes.has(likeKey);
      const clip = inMemoryStore.clips.get(clipId);

      if (!clip) return res.status(404).json({ error: 'Clip not found' });

      if (isLiked) {
        inMemoryStore.clipLikes.delete(likeKey);
        clip.likesCount = Math.max(0, clip.likesCount - 1);
        res.json({ liked: false });
      } else {
        inMemoryStore.clipLikes.set(likeKey, { userId, clipId });
        clip.likesCount += 1;
        res.json({ liked: true });
      }
    }
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/clips/:id/view — Record a view
router.post('/:id/view', async (req, res) => {
  try {
    const clipId = req.params.id;
    const store = getClipsDb();

    if (store.type === 'firestore') {
      await store.db.collection('clips').doc(clipId).update({
        views: require('firebase-admin').firestore.FieldValue.increment(1),
      });
    } else {
      const clip = inMemoryStore.clips.get(clipId);
      if (clip) clip.views += 1;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record view' });
  }
});

// GET /api/clips/:id/comments — Get comments for a clip
router.get('/:id/comments', async (req, res) => {
  try {
    const clipId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    const store = getClipsDb();
    let comments = [];

    if (store.type === 'firestore') {
      try {
        const snapshot = await store.db
          .collection('clipComments')
          .where('videoId', '==', clipId)
          .orderBy('createdAt', 'desc')
          .offset(offset)
          .limit(limit)
          .get();
        comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (indexErr) {
        const snapshot = await store.db
          .collection('clipComments')
          .where('videoId', '==', clipId)
          .get();
        comments = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(offset, offset + limit);
      }
    } else {
      comments = Array.from(inMemoryStore.clipComments.entries())
        .filter(([, data]) => data.videoId === clipId)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(offset, offset + limit);
    }

    res.json({ comments });
  } catch (error) {
    console.error('Comments error:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// POST /api/clips/:id/comments — Add a comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const clipId = req.params.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const commentData = {
      userId: req.user.id,
      userName: req.user.name || req.user.email,
      userPicture: req.user.picture || null,
      videoId: clipId,
      text: text.trim(),
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    const store = getClipsDb();
    let commentId;

    if (store.type === 'firestore') {
      const docRef = await store.db.collection('clipComments').add(commentData);
      commentId = docRef.id;
      await store.db.collection('clips').doc(clipId).update({
        commentsCount: require('firebase-admin').firestore.FieldValue.increment(1),
      });
    } else {
      commentId = generateId();
      inMemoryStore.clipComments.set(commentId, commentData);
      const clip = inMemoryStore.clips.get(clipId);
      if (clip) clip.commentsCount += 1;
    }

    res.json({
      success: true,
      comment: { id: commentId, ...commentData },
    });

    // Create comment notification
    try {
      const store2 = getClipsDb();
      if (store2.type === 'firestore') {
        const clipDoc = await store2.db.collection('clips').doc(clipId).get();
        const clipData = clipDoc.data();
        if (clipData && clipData.userId !== req.user.id) {
          await store2.db.collection('clipNotifications').add({
            toUserId: clipData.userId,
            type: 'comment',
            fromUserId: req.user.id,
            fromUserName: req.user.name || req.user.email,
            fromUserPicture: req.user.picture || null,
            videoId: clipId,
            videoCaption: clipData.caption || '',
            commentText: text.trim(),
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (notifErr) {
      console.error('Comment notification error:', notifErr);
    }
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/clips/:id/stream — Stream video from Google Drive
router.get('/:id/stream', async (req, res) => {
  try {
    const clipId = req.params.id;
    const store = getClipsDb();
    let clipData;

    if (store.type === 'firestore') {
      const doc = await store.db.collection('clips').doc(clipId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Clip not found' });
      clipData = doc.data();
    } else {
      clipData = inMemoryStore.clips.get(clipId);
      if (!clipData) return res.status(404).json({ error: 'Clip not found' });
    }

    // Get the uploader's OAuth tokens to access their Drive file
    let userTokens;
    if (store.type === 'firestore') {
      const userDoc = await store.db.collection('users').doc(clipData.userId).get();
      if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
      userTokens = userDoc.data();
    } else {
      userTokens = inMemoryStore.users.get(clipData.userId);
      if (!userTokens) return res.status(404).json({ error: 'User not found' });
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: userTokens.accessToken,
      refresh_token: userTokens.refreshToken,
      expiry_date: userTokens.tokenExpiry,
    });

    const drive = require('googleapis').google.drive({ version: 'v3', auth: oauth2Client });

    const fileMeta = await drive.files.get({
      fileId: clipData.driveFileId,
      fields: 'mimeType,size',
    });

    const range = req.headers.range;
    const fileSize = parseInt(fileMeta.data.size) || 0;
    const mimeType = fileMeta.data.mimeType || 'video/mp4';

    if (range && fileSize > 0) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const response = await drive.files.get(
        { fileId: clipData.driveFileId, alt: 'media' },
        { responseType: 'stream', headers: { Range: `bytes=${start}-${end}` } }
      );

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      });
      response.data.pipe(res);
    } else {
      const response = await drive.files.get(
        { fileId: clipData.driveFileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const headers = {
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      };
      if (fileSize > 0) headers['Content-Length'] = fileSize;
      res.writeHead(200, headers);
      response.data.pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error.message);
    if (error.code === 401 || error.code === 403) {
      return res.status(401).json({ error: 'Drive authorization expired' });
    }
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// DELETE /api/clips/:id — Delete a clip
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const clipId = req.params.id;
    const store = getClipsDb();

    if (store.type === 'firestore') {
      const clipDoc = await store.db.collection('clips').doc(clipId).get();
      if (!clipDoc.exists) {
        return res.status(404).json({ error: 'Clip not found' });
      }
      if (clipDoc.data().userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      await store.db.collection('clips').doc(clipId).delete();
    } else {
      const clip = inMemoryStore.clips.get(clipId);
      if (!clip) return res.status(404).json({ error: 'Clip not found' });
      if (clip.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      inMemoryStore.clips.delete(clipId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete clip error:', error);
    res.status(500).json({ error: 'Failed to delete clip' });
  }
});

module.exports = router;
