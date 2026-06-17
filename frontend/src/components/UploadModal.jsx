import React, { useState } from 'react';
import { X, UploadCloud, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUpload }) => {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !videoUrl) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Initializing secure link upload...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 5;
      if (progress >= 100) {
        progress = 100;
        setUploadProgress(100);
        setUploadStatus('Stream entry verified! Publishing...');
        clearInterval(interval);

        setTimeout(() => {
          const defaultThumb = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop";
          
          onUpload({
            id: Date.now().toString(),
            title,
            videoUrl,
            thumbnailUrl: thumbnailUrl || defaultThumb,
            channelName: "Aditya's Channel",
            channelAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya",
            views: "0",
            timestamp: "Just now",
            duration: "10:00"
          });
          
          setTitle('');
          setVideoUrl('');
          setThumbnailUrl('');
          setIsUploading(false);
          onClose();
        }, 800);
      } else {
        setUploadProgress(progress);
        if (progress < 25) {
          setUploadStatus('Connecting stream provider...');
        } else if (progress < 55) {
          setUploadStatus('Buffering high definition format...');
        } else if (progress < 80) {
          setUploadStatus('Generating adaptive poster frame...');
        } else {
          setUploadStatus('Validating stream keys...');
        }
      }
    }, 250);
  };

  const handleModalClose = () => {
    if (isUploading) return; // Disable close during active uploads
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ overflow: 'hidden' }}>
        {!isUploading && (
          <button className="btn-icon modal-close" onClick={handleModalClose}>
            <X size={24} />
          </button>
        )}
        
        <h2 className="modal-title" style={{ color: 'var(--text-primary)' }}>
          {isUploading ? 'Publishing Stream' : 'Upload Video Link'}
        </h2>
        
        {isUploading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '30px 0',
            textAlign: 'center'
          }}>
            <div style={{ position: 'relative', width: '110px', height: '110px', marginBottom: '24px' }}>
              <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" stroke="var(--border-color)" strokeWidth="6" fill="transparent" />
                <circle cx="50" cy="50" r="42" stroke="var(--accent-color)" strokeWidth="6" fill="transparent"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * uploadProgress) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.2s ease', filter: 'drop-shadow(0 0 4px var(--accent-glow))' }}
                />
              </svg>
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                fontWeight: '700', 
                fontSize: '18px', 
                color: 'var(--text-primary)' 
              }}>
                {uploadProgress}%
              </div>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Uploading to Hub</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', minHeight: '20px' }}>{uploadStatus}</p>
          </div>
        ) : (
          <>
            <div className="upload-placeholder">
              <UploadCloud size={48} className="upload-icon" />
              <p style={{ color: 'var(--text-secondary)' }}>Share your favorite video links</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Video Title *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g., Amazing Nature Documentary" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <LinkIcon size={16}/> Video Link (YouTube Embed URL or MP4) *
                  </div>
                </label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="e.g., https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <ImageIcon size={16}/> Thumbnail Image URL (Optional)
                  </div>
                </label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="e.g., https://example.com/thumbnail.jpg" 
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                Publish Video
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
