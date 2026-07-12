import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../../../backend/db/types';
import { ShieldAlert, Users } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, setOverrideRole } = useAuth();

  if (!user) return null;

  const roles: UserRole[] = ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'];

  return (
    <div className="dev-switcher">
      <div className="dev-switcher-title">
        <Users size={14} />
        <span>Dev Persona Switcher</span>
      </div>
      <p style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: 1.3 }}>
        Toggle roles instantly to test Role-Based Access Control (RBAC) views and restrictions.
      </p>
      <div className="dev-switcher-grid">
        {roles.map((r) => {
          const isActive = user.role === r;
          return (
            <button
              key={r}
              className={`dev-switcher-btn ${isActive ? 'active' : ''}`}
              onClick={() => setOverrideRole(r)}
            >
              {r}
            </button>
          );
        })}
      </div>
      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.625rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '0.4rem'
      }}>
        <ShieldAlert size={10} style={{ color: 'var(--primary-solid)' }} />
        <span>Simulating Active RBAC Guard</span>
      </div>
    </div>
  );
};
