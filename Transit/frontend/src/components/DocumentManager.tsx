import React, { useRef, useState } from 'react';
import { Upload, FileText, Download, Trash2, CheckCircle2 } from 'lucide-react';

export interface VehicleDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  date: string;
}

interface DocumentManagerProps {
  documents: VehicleDocument[];
  onChange: (docs: VehicleDocument[]) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // File size formatter helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileAdd = (files: FileList) => {
    const newDocs: VehicleDocument[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const doc: VehicleDocument = {
        id: 'doc-' + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatBytes(file.size),
        type: file.type || 'application/pdf',
        date: '2026-07-12' // Simulated upload date
      };
      newDocs.push(doc);
    }

    onChange([...documents, ...newDocs]);
    
    // Trigger brief success check animation
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileAdd(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileAdd(e.target.files);
    }
  };

  const handleDelete = (id: string) => {
    const updated = documents.filter(doc => doc.id !== id);
    onChange(updated);
  };

  // Simulates document downloading in browser
  const handleDownload = (doc: VehicleDocument) => {
    const dummyContent = `TransitOps Document Vault - Simulated Download\nFile: ${doc.name}\nSize: ${doc.size}\nType: ${doc.type}\nUploaded On: ${doc.date}`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = doc.name.endsWith('.pdf') || doc.name.endsWith('.png') || doc.name.endsWith('.jpg') ? doc.name : doc.name + '.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <label className="input-label">Vehicle Document Vault (PDF / Insurance / Registration)</label>
      
      {/* Drag & Drop uploader area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragOver ? '2px dashed var(--primary-solid)' : '2px dashed var(--border-color)',
          background: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-surface-elevated)',
          padding: '1.5rem',
          borderRadius: 'var(--radius-sm)',
          textAlign: 'center',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'all 0.2s ease',
          boxShadow: isDragOver ? 'var(--glow-shadow)' : 'none'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          onChange={handleInputChange}
        />
        {uploadSuccess ? (
          <>
            <CheckCircle2 size={24} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-green)' }}>
              Document Vault Updated Successfully!
            </span>
          </>
        ) : (
          <>
            <Upload size={24} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
              Drag & Drop registration/insurance PDFs here or click to browse
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Files are saved locally inside your vehicle asset registry
            </span>
          </>
        )}
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '150px',
          overflowY: 'auto',
          padding: '0.1rem'
        }}>
          {documents.map(doc => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <FileText size={16} style={{ color: 'var(--primary-solid)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: 'var(--text-primary)'
                  }} title={doc.name}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Size: {doc.size} &bull; Uploaded: {doc.date}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-blue)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                  title="Download File"
                >
                  <Download size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-red)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                  title="Delete File"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
