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

module.exports = router;
