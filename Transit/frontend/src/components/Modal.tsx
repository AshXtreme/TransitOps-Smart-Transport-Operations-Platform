import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Support Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Lock background scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 22, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1.5rem',
      animation: 'fadeIn 0.25s ease-out'
    }} onClick={onClose}>
      
      {/* Modal Container */}
      <div className="card-glass" style={{
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), var(--glow-shadow)',
        transform: 'scale(1)',
        animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflowY: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="theme-toggle"
            style={{ width: '32px', height: '32px', border: '1px solid var(--border-color)' }}
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>

      {/* Styled Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
