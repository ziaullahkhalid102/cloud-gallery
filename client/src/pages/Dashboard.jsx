import { useState, useEffect } from 'react';
import {
  Key, RefreshCw, Copy, Check, BarChart3,
  HardDrive, Activity, Eye, EyeOff, Trash2,
  Plus, Code, AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';
import { formatFileSize } from '../utils/fileUtils';

export default function Dashboard() {
  const [apiKeyInfo, setApiKeyInfo] = useState(null);
  const [embedInfo, setEmbedInfo] = useState(null);
  const [storage, setStorage] = useState(null);
  const [files, setFiles] = useState([]);
  const [showKey, setShowKey] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingEmbed, setGeneratingEmbed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [keyRes, embedRes, storageRes, filesRes] = await Promise.all([
        api.get('/keys'),
        api.get('/keys/embed'),
        api.get('/drive/storage').catch(() => ({ data: null })),
        api.get('/drive/files'),
      ]);
      setApiKeyInfo(keyRes.data);
      setEmbedInfo(embedRes.data);
      setStorage(storageRes.data?.storage || null);
      setFiles(filesRes.data?.files || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const { data } = await api.post('/keys/generate');
      setApiKeyInfo((prev) => ({ ...prev, apiKey: data.apiKey, usageCount: 0 }));
      setShowKey(true);
    } catch (err) {
      console.error('Generate failed:', err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!confirm('Regenerate your API key? The previous key will stop working immediately.')) return;
    setRegenerating(true);
    try {
      const { data } = await api.post('/keys/regenerate');
      setApiKeyInfo((prev) => ({ ...prev, apiKey: data.apiKey, usageCount: 0 }));
      setShowKey(true);
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete your API key? Any integrations using this key will stop working.')) return;
    try {
      await api.delete('/keys');
      setApiKeyInfo((prev) => ({ ...prev, apiKey: null, usageCount: 0 }));
      setShowKey(false);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function handleGenerateEmbed() {
    setGeneratingEmbed(true);
    try {
      const { data } = await api.post('/keys/embed/generate');
      setEmbedInfo({ embedToken: data.embedToken, createdAt: new Date().toISOString() });
      setShowEmbed(true);
    } catch (err) {
      console.error('Generate embed failed:', err);
    } finally {
      setGeneratingEmbed(false);
    }
  }

  async function handleDeleteEmbed() {
    if (!confirm('Delete your embed token? Any embedded widgets using this token will stop working.')) return;
    try {
      await api.delete('/keys/embed');
      setEmbedInfo({ embedToken: null });
      setShowEmbed(false);
    } catch (err) {
      console.error('Delete embed failed:', err);
    }
  }

  function copyText(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function maskKey(key) {
    if (!key) return '';
    if (key.length <= 16) return key.slice(0, 8) + '••••••••';
    return key.slice(0, 12) + '••••••••••••••••••••••••••••' + key.slice(-6);
  }

  function getBaseUrl() {
    return window.location.origin;
  }

  function getEmbedSnippet() {
    if (!embedInfo?.embedToken) return '';
    const baseUrl = getBaseUrl();
    return `<!-- CloudGallery Upload Widget -->\n<script\n  src="${baseUrl}/sdk/cloudgallery.js"\n  data-token="${embedInfo.embedToken}"\n  data-mode="widget">\n</script>`;
  }

  function getEmbedCodeProgrammatic() {
    if (!embedInfo?.embedToken) return '';
    const baseUrl = getBaseUrl();
    return `<script src="${baseUrl}/sdk/cloudgallery.js"></script>\n<script>\n  const gallery = new CloudGallery({\n    token: '${embedInfo.embedToken}'\n  });\n\n  // Upload a file\n  const fileInput = document.querySelector('#myFileInput');\n  fileInput.addEventListener('change', async (e) => {\n    const result = await gallery.upload(e.target.files[0]);\n    console.log('Uploaded:', result);\n  });\n\n  // List all files\n  const files = await gallery.listFiles();\n  console.log('Files:', files);\n</script>`;
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const filesByCategory = files.reduce((acc, f) => {
    const cat = f.category || 'other';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const totalSize = files.reduce((sum, f) => sum + (parseInt(f.size) || 0), 0);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Developer Dashboard</h1>
          <p className="text-muted">Manage your API keys, embed tokens, and view statistics</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><BarChart3 size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{files.length}</span>
            <span className="stat-label">Total Files</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><HardDrive size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{formatFileSize(totalSize)}</span>
            <span className="stat-label">Storage Used</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Activity size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{apiKeyInfo?.usageCount || 0}</span>
            <span className="stat-label">API Calls</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Key size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{apiKeyInfo?.apiKey ? 'Active' : 'None'}</span>
            <span className="stat-label">API Key Status</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* API Key Management Card */}
        <div className="card">
          <div className="card-header">
            <h3><Key size={18} /> API Key</h3>
          </div>
          <div className="card-body">
            {apiKeyInfo?.apiKey ? (
              <>
                <div className="api-key-display">
                  <code className="api-key-value">
                    {showKey ? apiKeyInfo.apiKey : maskKey(apiKeyInfo.apiKey)}
                  </code>
                  <div className="api-key-actions">
                    <button className="icon-btn-sm" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button className="icon-btn-sm" onClick={() => copyText(apiKeyInfo.apiKey, 'apikey')} title="Copy">
                      {copied === 'apikey' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                {apiKeyInfo.createdAt && (
                  <p className="text-muted text-sm" style={{ margin: '8px 0' }}>
                    Created: {new Date(apiKeyInfo.createdAt).toLocaleDateString()}
                    {apiKeyInfo.lastUsage && ` • Last used: ${new Date(apiKeyInfo.lastUsage).toLocaleDateString()}`}
                  </p>
                )}
                <div className="api-key-btn-group">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    <RefreshCw size={14} className={regenerating ? 'spinning' : ''} />
                    {regenerating ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} />
                    Delete Key
                  </button>
                </div>
              </>
            ) : (
              <div className="no-key-state">
                <p className="text-muted">No API key generated yet.</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleGenerate}
                  disabled={generating}
                >
                  <Plus size={14} />
                  {generating ? 'Generating...' : 'Generate API Key'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Embed Token Card */}
        <div className="card">
          <div className="card-header">
            <h3><Code size={18} /> Embed Token</h3>
          </div>
          <div className="card-body">
            {embedInfo?.embedToken ? (
              <>
                <div className="api-key-display">
                  <code className="api-key-value">
                    {showEmbed ? embedInfo.embedToken : maskKey(embedInfo.embedToken)}
                  </code>
                  <div className="api-key-actions">
                    <button className="icon-btn-sm" onClick={() => setShowEmbed(!showEmbed)} title={showEmbed ? 'Hide' : 'Show'}>
                      {showEmbed ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button className="icon-btn-sm" onClick={() => copyText(embedInfo.embedToken, 'embed')} title="Copy">
                      {copied === 'embed' ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="embed-snippet-section">
                  <h4>Widget Embed Code</h4>
                  <p className="text-muted text-sm">Paste this into any HTML page to add a file upload widget:</p>
                  <div className="code-block-wrap">
                    <button
                      className="copy-btn"
                      onClick={() => copyText(getEmbedSnippet(), 'snippet')}
                    >
                      {copied === 'snippet' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre className="code-block">{getEmbedSnippet()}</pre>
                  </div>
                </div>

                <div className="api-key-btn-group">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleGenerateEmbed}
                    disabled={generatingEmbed}
                  >
                    <RefreshCw size={14} className={generatingEmbed ? 'spinning' : ''} />
                    {generatingEmbed ? 'Regenerating...' : 'Regenerate Token'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteEmbed}
                  >
                    <Trash2 size={14} />
                    Delete Token
                  </button>
                </div>
              </>
            ) : (
              <div className="no-key-state">
                <p className="text-muted">No embed token generated yet. Embed tokens let you add file upload widgets to any website without exposing your API key.</p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleGenerateEmbed}
                  disabled={generatingEmbed}
                >
                  <Plus size={14} />
                  {generatingEmbed ? 'Generating...' : 'Generate Embed Token'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* File Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3><BarChart3 size={18} /> File Breakdown</h3>
          </div>
          <div className="card-body">
            {Object.keys(filesByCategory).length > 0 ? (
              <div className="category-list">
                {Object.entries(filesByCategory).map(([cat, count]) => (
                  <div key={cat} className="category-row">
                    <span className="category-name">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    <div className="category-bar-wrap">
                      <div
                        className="category-bar"
                        style={{ width: `${(count / files.length) * 100}%` }}
                      />
                    </div>
                    <span className="category-count">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No files uploaded yet</p>
            )}
          </div>
        </div>

        {storage && (
          <div className="card">
            <div className="card-header">
              <h3><HardDrive size={18} /> Google Drive Storage</h3>
            </div>
            <div className="card-body">
              <div className="storage-info">
                <div className="storage-bar-wrap">
                  <div
                    className="storage-bar"
                    style={{
                      width: `${storage.limit ? (parseInt(storage.usage) / parseInt(storage.limit)) * 100 : 0}%`,
                    }}
                  />
                </div>
                <div className="storage-text">
                  <span>{formatFileSize(storage.usage)} used</span>
                  <span>{formatFileSize(storage.limit)} total</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
