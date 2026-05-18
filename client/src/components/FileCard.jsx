import { useState } from 'react';
import {
  Image, Film, Music, FileText, File, MoreVertical,
  Trash2, Edit3, ExternalLink, Eye,
} from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/fileUtils';

const iconMap = {
  image: Image,
  video: Film,
  audio: Music,
  pdf: FileText,
  doc: FileText,
  sheet: FileText,
  presentation: FileText,
  file: File,
};

export default function FileCard({ file, onDelete, onRename, onPreview }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);

  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const Icon = iconMap[file.category] || File;

  function handleRename(e) {
    e.preventDefault();
    if (newName.trim() && newName !== file.name) {
      onRename(file.id, newName.trim());
    }
    setRenaming(false);
    setMenuOpen(false);
  }

  return (
    <div className="file-card">
      <div className="file-preview" onClick={() => onPreview(file)}>
        {isImage && file.thumbnailLink ? (
          <img src={file.thumbnailLink.replace('=s220', '=s400')} alt={file.name} />
        ) : isVideo ? (
          <div className="file-icon video-icon">
            <Film size={48} />
            <span className="file-type-badge">VIDEO</span>
          </div>
        ) : (
          <div className="file-icon">
            <Icon size={48} />
          </div>
        )}
      </div>

      <div className="file-info">
        {renaming ? (
          <form onSubmit={handleRename} className="rename-form">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onBlur={handleRename}
            />
          </form>
        ) : (
          <span className="file-name" title={file.name}>{file.name}</span>
        )}
        <div className="file-meta">
          <span>{formatFileSize(file.size)}</span>
          <span>{formatDate(file.createdTime)}</span>
        </div>
      </div>

      <div className="file-actions">
        <button className="icon-btn-sm" onClick={() => setMenuOpen(!menuOpen)}>
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <>
            <div className="dropdown-overlay" onClick={() => setMenuOpen(false)} />
            <div className="file-dropdown">
              <button onClick={() => { onPreview(file); setMenuOpen(false); }}>
                <Eye size={14} /> Preview
              </button>
              <button onClick={() => { setRenaming(true); setMenuOpen(false); }}>
                <Edit3 size={14} /> Rename
              </button>
              {file.webViewLink && (
                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
                  <ExternalLink size={14} /> Open in Drive
                </a>
              )}
              <button className="danger" onClick={() => { onDelete(file.id); setMenuOpen(false); }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
