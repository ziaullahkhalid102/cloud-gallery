const express = require('express');
const { createOAuth2Client } = require('../config/google');
const { authenticateApiKey } = require('../middleware/auth');
const { upload, getFileCategory } = require('../middleware/fileValidation');
const { apiLimiter } = require('../middleware/rateLimiter');
const driveService = require('../services/driveService');

const router = express.Router();

// POST /api/external/upload - Upload file using API key
router.post('/upload', apiLimiter, authenticateApiKey, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: req.user.accessToken,
      refresh_token: req.user.refreshToken,
      expiry_date: req.user.tokenExpiry,
    });

    const folderId = await driveService.getOrCreateAppFolder(oauth2Client);
    const fileName = req.body.fileName || req.file.originalname;

    const fileData = await driveService.uploadFileToDrive(
      oauth2Client,
      req.file.buffer,
      fileName,
      req.file.mimetype,
      folderId
    );

    res.json({
      success: true,
      file: {
        id: fileData.id,
        name: fileData.name,
        mimeType: fileData.mimeType,
        size: fileData.size,
        category: getFileCategory(fileName),
        webViewLink: fileData.webViewLink,
        webContentLink: fileData.webContentLink,
      },
    });
  } catch (error) {
    console.error('External upload error:', error);
    if (error.code === 401) {
      return res.status(401).json({ error: 'Google Drive authorization expired. User needs to re-login.' });
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/external/files - List files using API key
router.get('/files', apiLimiter, authenticateApiKey, async (req, res) => {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: req.user.accessToken,
      refresh_token: req.user.refreshToken,
      expiry_date: req.user.tokenExpiry,
    });

    const folderId = await driveService.getOrCreateAppFolder(oauth2Client);
    const data = await driveService.listFiles(oauth2Client, folderId, 50);

    res.json({
      files: data.files.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        category: getFileCategory(f.name),
        webViewLink: f.webViewLink,
        createdTime: f.createdTime,
      })),
    });
  } catch (error) {
    console.error('External list files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

module.exports = router;
