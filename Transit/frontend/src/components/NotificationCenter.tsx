import React, { useState, useEffect, useRef } from 'react';
import { 
  getEmailLogs, 
  markAllEmailsAsRead, 
  clearEmailLogs
} from '../../../backend/services/notificationService';
import type { EmailLog } from '../../../backend/services/notificationService';
import { Bell, Mail, Trash2, MailCheck } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadLogs = () => {
    setLogs(getEmailLogs());
  };

  useEffect(() => {
    loadLogs();
    
    // Refresh notifications count periodically
    const timer = setInterval(loadLogs, 3000);
    return () => clearInterval(timer);
  }, []);

  // Close popover if clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const unreadCount = logs.filter(l => !l.isRead).length;

  const handleMarkAllRead = () => {
    markAllEmailsAsRead();
    loadLogs();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all email history?')) {
      clearEmailLogs();
      loadLogs();
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle"
        style={{
          border: '1px solid var(--border-color)',
          width: '36px',
          height: '36px',
          position: 'relative'
        }}
        title="Email Notifications Log"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'var(--accent-red)',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px var(--accent-red)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover list */}
      {isOpen && (
        <div className="card-glass" style={{
          position: 'absolute',
          top: '2.75rem',
          right: 0,
          width: '350px',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          padding: '1.25rem',
          background: 'var(--bg-surface-elevated)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), var(--glow-shadow)',
          animation: 'slideDown 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-solid)', letterSpacing: '0.05em' }}>
              Email Outbox Logs
            </h4>
            
            {logs.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={handleMarkAllRead} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  title="Mark all as read"
                >
                  <MailCheck size={14} />
                </button>
                <button 
                  onClick={handleClearAll} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}
                  title="Clear outbox logs"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* List items */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {logs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.8rem'
              }}>
                No compliance emails sent yet.
              </div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{
                  background: log.isRead ? 'rgba(255,255,255,0.01)' : 'rgba(99, 102, 241, 0.04)',
                  border: log.isRead ? '1px solid var(--border-color)' : '1px solid rgba(99, 102, 241, 0.2)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Mail size={10} /> To: {log.sentTo}
                    </span>
                    <span>{log.sentDate}</span>
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: log.isRead ? 'var(--text-primary)' : '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {log.subject}
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.4,
                    marginTop: '0.25rem',
                    maxHeight: '60px',
                    overflowY: 'auto'
                  }}>
                    {log.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Popover entry animations */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-5px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
