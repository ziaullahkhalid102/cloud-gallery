const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const apiKeyService = require('../services/apiKeyService');

const router = express.Router();

// GET /api/keys - Get API key info
router.get('/', authenticateToken, async (req, res) => {
  try {
    const info = await apiKeyService.getApiKeyInfo(req.user.id);
    res.json(info);
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({ error: 'Failed to get API key info' });
  }
});

// POST /api/keys/generate - Generate a new API key
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const existing = await apiKeyService.getApiKeyInfo(req.user.id);
    if (existing && existing.apiKey) {
      return res.status(400).json({ error: 'API key already exists. Delete the existing key first or use regenerate.' });
    }
    const newKey = await apiKeyService.createApiKey(req.user.id);
    res.json({
      success: true,
      apiKey: newKey,
      message: 'API key generated successfully.',
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
});

// POST /api/keys/regenerate - Regenerate API key
router.post('/regenerate', authenticateToken, async (req, res) => {
  try {
    const newKey = await apiKeyService.regenerateApiKey(req.user.id);
    res.json({
      success: true,
      apiKey: newKey,
      message: 'API key regenerated successfully. Previous key is now invalid.',
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

// DELETE /api/keys - Delete API key
router.delete('/', authenticateToken, async (req, res) => {
  try {
    await apiKeyService.deleteApiKey(req.user.id);
    res.json({
      success: true,
      message: 'API key deleted successfully.',
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// GET /api/keys/embed - Get embed token info
router.get('/embed', authenticateToken, async (req, res) => {
  try {
    const info = await apiKeyService.getEmbedTokenInfo(req.user.id);
    res.json(info);
  } catch (error) {
    console.error('Get embed token error:', error);
    res.status(500).json({ error: 'Failed to get embed token info' });
  }
});

// POST /api/keys/embed/generate - Generate embed token
router.post('/embed/generate', authenticateToken, async (req, res) => {
  try {
    const token = await apiKeyService.createEmbedToken(req.user.id);
    res.json({
      success: true,
      embedToken: token,
      message: 'Embed token generated successfully.',
    });
  } catch (error) {
    console.error('Generate embed token error:', error);
    res.status(500).json({ error: 'Failed to generate embed token' });
  }
});

// DELETE /api/keys/embed - Delete embed token
router.delete('/embed', authenticateToken, async (req, res) => {
  try {
    await apiKeyService.deleteEmbedToken(req.user.id);
    res.json({
      success: true,
      message: 'Embed token deleted successfully.',
    });
  } catch (error) {
    console.error('Delete embed token error:', error);
    res.status(500).json({ error: 'Failed to delete embed token' });
  }
});

module.exports = router;
