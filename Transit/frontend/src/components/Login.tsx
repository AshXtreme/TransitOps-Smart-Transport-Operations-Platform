import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SEED_USERS } from '../../../backend/db/seeds';
import { Key, Mail, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const success = login(email, password);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    }
  };

  const handleQuickSelect = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      padding: '2rem',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1) 0%, transparent 60%)'
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            background: 'transparent',
            width: '52px',
            height: '52px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            boxShadow: 'var(--glow-shadow)',
            padding: 0
          }}>
            <img 
              src="/logo-dark.png" 
              alt="Logo" 
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)'
              }}
            />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>TransitOps</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Smart Transport Operations Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="card-glass" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>Sign In</h2>
          
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--accent-red)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label" htmlFor="email-input">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email-input"
                  type="email"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="name@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={16} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <label className="input-label" htmlFor="password-input">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password-input"
                  type="password"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Key size={16} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Access Platform
            </button>
          </form>
        </div>

        {/* Demo Credentials Quick-Select panel */}
        <div className="card-glass" style={{
          padding: '1.25rem',
          background: 'rgba(15, 21, 39, 0.6)',
          borderColor: 'rgba(30, 41, 75, 0.5)'
        }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 700 }}>
            Demo Accounts (Single-Click Login)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {SEED_USERS.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickSelect(user.email, user.password || '')}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.825rem',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-solid)';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{user.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user.email}</div>
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--primary-solid)',
                  background: 'rgba(99, 102, 241, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
