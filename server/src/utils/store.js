// In-memory store fallback when Firebase is not configured
const inMemoryStore = {
  users: new Map(),
  files: new Map(),
};

module.exports = { inMemoryStore };
