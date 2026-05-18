import { useState, useEffect, useCallback } from 'react';
import { Upload, Search, Grid, List, Filter, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import FileCard from '../components/FileCard';
import UploadModal from '../components/UploadModal';
import PreviewModal from '../components/PreviewModal';

export default function Gallery() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/drive/files');
      setFiles(data.files || []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  async function handleDelete(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await api.delete(`/drive/files/${fileId}`);
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  async function handleRename(fileId, newName) {
    try {
      const { data } = await api.patch(`/drive/files/${fileId}/rename`, { name: newName });
      setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, ...data.file } : f)));
    } catch (err) {
      console.error('Rename failed:', err);
    }
  }

  const filtered = files.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'all') return true;
    return f.category === filter;
  });

  return (
    <div className="gallery-page">
      <div className="page-header">
        <div>
          <h1>Gallery</h1>
          <p className="text-muted">{files.length} files in your CloudGallery folder</p>
        </div>
        <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
          <Upload size={18} /> Upload
        </button>
      </div>

      <div className="gallery-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-right">
          <div className="filter-group">
            <Filter size={16} />
            {['all', 'image', 'video', 'audio', 'document'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="view-toggle">
            <button
              className={`icon-btn-sm ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button
              className={`icon-btn-sm ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>

          <button className="icon-btn-sm" onClick={fetchFiles} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your files...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Upload size={64} />
          <h3>{files.length === 0 ? 'No files yet' : 'No matching files'}</h3>
          <p>
            {files.length === 0
              ? 'Upload your first file to get started'
              : 'Try adjusting your search or filter'}
          </p>
          {files.length === 0 && (
            <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>
              <Upload size={18} /> Upload Files
            </button>
          )}
        </div>
      ) : (
        <div className={`files-${viewMode}`}>
          {filtered.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={handleDelete}
              onRename={handleRename}
              onPreview={setPreviewFile}
            />
          ))}
        </div>
      )}

      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={fetchFiles}
      />

      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
