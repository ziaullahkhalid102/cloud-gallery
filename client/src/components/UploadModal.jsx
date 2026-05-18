import { useState, useRef } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function UploadModal({ isOpen, onClose, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStates, setUploadStates] = useState({});
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  if (!isOpen) return null;

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }

  function handleFileSelect(e) {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStates((prev) => ({ ...prev, [i]: { progress: 0, status: 'uploading' } }));

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);

        await api.upload('/drive/upload', formData, (progress) => {
          setUploadStates((prev) => ({ ...prev, [i]: { progress, status: 'uploading' } }));
        });

        setUploadStates((prev) => ({ ...prev, [i]: { progress: 100, status: 'success' } }));
      } catch {
        setUploadStates((prev) => ({ ...prev, [i]: { progress: 0, status: 'error' } }));
      }
    }

    setUploading(false);
    onUploadComplete();
  }

  function handleClose() {
    if (!uploading) {
      setFiles([]);
      setUploadStates({});
      onClose();
    }
  }

  const allDone = files.length > 0 && Object.keys(uploadStates).length === files.length &&
    Object.values(uploadStates).every((s) => s.status === 'success' || s.status === 'error');

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Files</h2>
          <button className="icon-btn" onClick={handleClose} disabled={uploading}>
            <X size={20} />
          </button>
        </div>

        <div
          ref={dropRef}
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} className="drop-icon" />
          <p>Drag & drop files here or click to browse</p>
          <span className="drop-hint">Supports images, videos, audio, and documents up to 100MB</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((file, i) => (
              <div key={i} className="file-list-item">
                <File size={16} />
                <span className="file-list-name">{file.name}</span>
                <span className="file-list-size">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>

                {uploadStates[i] && (
                  <div className="upload-status">
                    {uploadStates[i].status === 'uploading' && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${uploadStates[i].progress}%` }}
                        />
                      </div>
                    )}
                    {uploadStates[i].status === 'success' && (
                      <CheckCircle size={16} className="text-success" />
                    )}
                    {uploadStates[i].status === 'error' && (
                      <AlertCircle size={16} className="text-error" />
                    )}
                  </div>
                )}

                {!uploading && !uploadStates[i] && (
                  <button className="icon-btn-sm" onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          {allDone ? (
            <button className="btn btn-primary" onClick={handleClose}>Done</button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
