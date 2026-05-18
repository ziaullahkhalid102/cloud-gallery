const express = require('express');
const { createOAuth2Client } = require('../config/google');
const { authenticateToken } = require('../middleware/auth');
const { upload, getFileCategory } = require('../middleware/fileValidation');
const { uploadLimiter } = require('../middleware/rateLimiter');
const driveService = require('../services/driveService');

const router = express.Router();

function getUserOAuth2Client(user) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
    expiry_date: user.tokenExpiry,
  });
  return oauth2Client;
}

// POST /api/drive/upload - Upload file to Google Drive
router.post('/upload', authenticateToken, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const oauth2Client = getUserOAuth2Client(req.user);
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
        ...fileData,
        category: getFileCategory(fileName),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (error.code === 401) {
      return res.status(401).json({ error: 'Google Drive authorization expired. Please re-login.' });
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/drive/files - List files
router.get('/files', authenticateToken, async (req, res) => {
  try {
    const { pageSize = 50, pageToken, search } = req.query;
    const oauth2Client = getUserOAuth2Client(req.user);
    const folderId = await driveService.getOrCreateAppFolder(oauth2Client);

    const data = await driveService.listFiles(oauth2Client, folderId, parseInt(pageSize), pageToken);

    let files = data.files.map((file) => ({
      ...file,
      category: getFileCategory(file.name),
    }));

    if (search) {
      const term = search.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(term));
    }

    res.json({
      files,
      nextPageToken: data.nextPageToken || null,
      totalFiles: files.length,
    });
  } catch (error) {
    console.error('List files error:', error);
    if (error.code === 401) {
      return res.status(401).json({ error: 'Google Drive authorization expired. Please re-login.' });
    }
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// GET /api/drive/files/:fileId - Get single file
router.get('/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const oauth2Client = getUserOAuth2Client(req.user);
    const file = await driveService.getFile(oauth2Client, req.params.fileId);
    res.json({
      file: {
        ...file,
        category: getFileCategory(file.name),
      },
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// DELETE /api/drive/files/:fileId - Delete file
router.delete('/files/:fileId', authenticateToken, async (req, res) => {
  try {
    const oauth2Client = getUserOAuth2Client(req.user);
    await driveService.deleteFile(oauth2Client, req.params.fileId);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// PATCH /api/drive/files/:fileId/rename - Rename file
router.patch('/files/:fileId/rename', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'New file name is required' });
    }

    const oauth2Client = getUserOAuth2Client(req.user);
    const file = await driveService.renameFile(oauth2Client, req.params.fileId, name);
    res.json({
      success: true,
      file: {
        ...file,
        category: getFileCategory(file.name),
      },
    });
  } catch (error) {
    console.error('Rename file error:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

// GET /api/drive/storage - Get storage usage
router.get('/storage', authenticateToken, async (req, res) => {
  try {
    const oauth2Client = getUserOAuth2Client(req.user);
    const storage = await driveService.getStorageUsage(oauth2Client);
    res.json({ storage });
  } catch (error) {
    console.error('Storage usage error:', error);
    res.status(500).json({ error: 'Failed to get storage info' });
  }
});

module.exports = router;
