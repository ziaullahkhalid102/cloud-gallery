const crypto = require('crypto');

function generateApiKey() {
  return `cg_${crypto.randomBytes(32).toString('hex')}`;
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

module.exports = { generateApiKey, generateUserId, formatFileSize, sanitizeFileName };
