const multer = require('multer');
const path = require('path');

const ALLOWED_TYPES = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
  video: ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.mkv'],
  audio: ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'],
};

const ALL_ALLOWED = Object.values(ALLOWED_TYPES).flat();

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALL_ALLOWED.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not allowed. Allowed types: ${ALL_ALLOWED.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

function getFileCategory(filename) {
  const ext = path.extname(filename).toLowerCase();
  for (const [category, extensions] of Object.entries(ALLOWED_TYPES)) {
    if (extensions.includes(ext)) return category;
  }
  return 'unknown';
}

module.exports = { upload, getFileCategory, ALLOWED_TYPES, ALL_ALLOWED, MAX_FILE_SIZE };
