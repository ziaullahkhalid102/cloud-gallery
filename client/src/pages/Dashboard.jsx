import { useState, useEffect } from 'react';
import {
  Key, RefreshCw, Copy, Check, BarChart3,
  HardDrive, Activity, Eye, EyeOff,
} from 'lucide-react';
import { api } from '../services/api';
import { formatFileSize } from '../utils/fileUtils';

export default function Dashboard() {
  const [apiKeyInfo, setApiKeyInfo] = useState(null);
  const [storage, setStorage] = useState(null);
  const [files, setFiles] = useState([]);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [keyRes, storageRes, filesRes] = await Promise.all([
        api.get('/keys'),
        api.get('/drive/storage').catch(() => ({ data: null })),
        api.get('/drive/files'),
      ]);
      setApiKeyInfo(keyRes.data);
      setStorage(storageRes.data?.storage || null);
      setFiles(filesRes.data?.files || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
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

  function copyKey() {
    if (apiKeyInfo?.apiKey) {
      navigator.clipboard.writeText(apiKeyInfo.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <p className="text-muted">Manage your API key and view statistics</p>
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
        <div className="card">
          <div className="card-header">
            <h3><Key size={18} /> API Key</h3>
          </div>
          <div className="card-body">
            {apiKeyInfo?.apiKey ? (
              <>
                <div className="api-key-display">
                  <code className="api-key-value">
                    {showKey ? apiKeyInfo.apiKey : '••••••••••••••••••••••••••••••••'}
                  </code>
                  <div className="api-key-actions">
                    <button className="icon-btn-sm" onClick={() => setShowKey(!showKey)} title={showKey ? 'Hide' : 'Show'}>
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button className="icon-btn-sm" onClick={copyKey} title="Copy">
                      {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  <RefreshCw size={14} className={regenerating ? 'spinning' : ''} />
                  {regenerating ? 'Regenerating...' : 'Regenerate Key'}
                </button>
              </>
            ) : (
              <p className="text-muted">No API key generated yet.</p>
            )}
          </div>
        </div>

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
                      width: `${(parseInt(storage.usage) / parseInt(storage.limit)) * 100}%`,
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
