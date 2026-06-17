import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function DocumentUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      const doc = await uploadDocument(file);
      onUploadSuccess(doc);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="uploader-wrapper">
      <div 
        className={`upload-zone ${isDragging ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleChange} 
          style={{ display: 'none' }} 
          accept=".pdf,.docx,.txt"
        />
        {uploading ? (
          <>
            <div className="typing-indicator" style={{ marginBottom: '10px' }}>
              <span></span><span></span><span></span>
            </div>
            <p style={{ color: '#fff', fontWeight: '500' }}>Vectorizing Document...</p>
            <span>Running text extraction pipeline</span>
          </>
        ) : (
          <>
            <UploadCloud size={28} color="var(--accent-primary)" style={{ marginBottom: '0.25rem' }} />
            <p style={{ color: '#fff', fontWeight: '500' }}>Drop a document here</p>
            <span>Supported: PDF, DOCX, TXT</span>
          </>
        )}
      </div>
    </div>
  );
}
