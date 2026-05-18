import { X, Download, ExternalLink } from 'lucide-react';

export default function PreviewModal({ file, onClose }) {
  if (!file) return null;

  const isImage = file.mimeType?.startsWith('image/');
  const isVideo = file.mimeType?.startsWith('video/');
  const isAudio = file.mimeType?.startsWith('audio/');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 title={file.name}>{file.name}</h2>
          <div className="preview-actions">
            {file.webContentLink && (
              <a href={file.webContentLink} className="icon-btn" title="Download" target="_blank" rel="noopener noreferrer">
                <Download size={18} />
              </a>
            )}
            {file.webViewLink && (
              <a href={file.webViewLink} className="icon-btn" title="Open in Drive" target="_blank" rel="noopener noreferrer">
                <ExternalLink size={18} />
              </a>
            )}
            <button className="icon-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="preview-content">
          {isImage && (
            <img
              src={file.thumbnailLink ? file.thumbnailLink.replace('=s220', '=s1600') : file.webContentLink}
              alt={file.name}
              className="preview-image"
            />
          )}
          {isVideo && (
            <video controls className="preview-video" autoPlay={false}>
              <source src={file.webContentLink} type={file.mimeType} />
              Your browser does not support video playback.
            </video>
          )}
          {isAudio && (
            <div className="preview-audio">
              <audio controls>
                <source src={file.webContentLink} type={file.mimeType} />
              </audio>
            </div>
          )}
          {!isImage && !isVideo && !isAudio && (
            <div className="preview-unsupported">
              <p>Preview not available for this file type.</p>
              {file.webViewLink && (
                <a href={file.webViewLink} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  Open in Google Drive
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
