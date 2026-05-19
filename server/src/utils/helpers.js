const crypto = require('crypto');

function generateApiKey() {
  const prefix = 'cg_live';
  const seg1 = crypto.randomBytes(4).toString('hex');
  const seg2 = crypto.randomBytes(16).toString('base64url');
  const seg3 = crypto.randomBytes(12).toString('base64url');
  const seg4 = crypto.randomBytes(8).toString('base64url');
  return `${prefix}_${seg1}_${seg2}${seg3}${seg4}`;
}

function generateEmbedToken() {
  const prefix = 'cg_embed';
  const seg1 = crypto.randomBytes(4).toString('hex');
  const seg2 = crypto.randomBytes(20).toString('base64url');
  return `${prefix}_${seg1}_${seg2}`;
}

function generateUserId() {
  return crypto.randomBytes(16).toString('hex');
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

module.exports = { generateApiKey, generateEmbedToken, generateUserId, formatFileSize, sanitizeFileName };
