const express = require('express');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { createOAuth2Client, getAuthUrl } = require('../config/google');
const { getDb } = require('../config/firebase');
const { inMemoryStore } = require('../utils/store');
const { generateApiKey, generateUserId } = require('../utils/helpers');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth/google - Redirect to Google OAuth
router.get('/google', authLimiter, (req, res) => {
  const oauth2Client = createOAuth2Client();
  const url = getAuthUrl(oauth2Client);
  res.json({ url });
});

// GET /api/auth/google/callback - Handle OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=no_code`);
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    const db = getDb();
    let userId;
    let isNewUser = false;

    if (db) {
      // Check if user exists
      const snapshot = await db
        .collection('users')
        .where('email', '==', userInfo.email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Create new user
        const apiKey = generateApiKey();
        const userRef = db.collection('users').doc();
        userId = userRef.id;

        await userRef.set({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          googleId: userInfo.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date,
          apiKey,
          apiKeyCreatedAt: new Date().toISOString(),
          apiUsageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        isNewUser = true;
      } else {
        const doc = snapshot.docs[0];
        userId = doc.id;

        await doc.ref.update({
          accessToken: tokens.access_token,
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          tokenExpiry: tokens.expiry_date,
          name: userInfo.name,
          picture: userInfo.picture,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      // In-memory store
      let existing = null;
      for (const [id, u] of inMemoryStore.users) {
        if (u.email === userInfo.email) {
          existing = { id, ...u };
          break;
        }
      }

      if (!existing) {
        userId = generateUserId();
        const apiKey = generateApiKey();
        inMemoryStore.users.set(userId, {
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          googleId: userInfo.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date,
          apiKey,
          apiKeyCreatedAt: new Date().toISOString(),
          apiUsageCount: 0,
          createdAt: new Date().toISOString(),
        });
        isNewUser = true;
      } else {
        userId = existing.id;
        const user = inMemoryStore.users.get(userId);
        user.accessToken = tokens.access_token;
        if (tokens.refresh_token) user.refreshToken = tokens.refresh_token;
        user.tokenExpiry = tokens.expiry_date;
        user.name = userInfo.name;
        user.picture = userInfo.picture;
      }
    }

    const jwtToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?token=${jwtToken}&new=${isNewUser}`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, (req, res) => {
  const { accessToken, refreshToken, tokenExpiry, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
