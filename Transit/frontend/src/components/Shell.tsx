import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../../../backend/db/types';
import { VehiclesRegistry } from './VehiclesRegistry';
import { DriversRegistry } from './DriversRegistry';
import { TripsDashboard } from './TripsDashboard';
import { MaintenanceLogs } from './MaintenanceLogs';
import { ExpenseTracker } from './ExpenseTracker';
import { DashboardOverview } from './DashboardOverview';
import { NotificationCenter } from './NotificationCenter';
import { checkAndSendLicenseReminders } from '../../../backend/services/notificationService';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Compass, 
  Wrench, 
  DollarSign, 
  LogOut, 
  Sun, 
  Moon, 
  Clock, 
  Lock, 
  AlertCircle
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  roles: UserRole[];
  icon: React.ComponentType<{ size: number }>;
}

const TABS: Tab[] = [
  { id: 'dashboard', label: 'Dashboard Overview', roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'], icon: LayoutDashboard },
  { id: 'vehicles', label: 'Vehicles Registry', roles: ['Fleet Manager', 'Financial Analyst'], icon: Truck },
  { id: 'drivers', label: 'Drivers Registry', roles: ['Fleet Manager', 'Safety Officer'], icon: Users },
  { id: 'trips', label: 'Trip Dispatch Engine', roles: ['Fleet Manager', 'Driver'], icon: Compass },
  { id: 'maintenance', label: 'Maintenance Logs', roles: ['Fleet Manager', 'Safety Officer'], icon: Wrench },
  { id: 'expenses', label: 'Expense & Fuel Tracking', roles: ['Fleet Manager', 'Driver', 'Financial Analyst'], icon: DollarSign },
];

export const Shell: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Run CDL compliance checks on startup
  useEffect(() => {
    checkAndSendLicenseReminders();
  }, []);


  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
    }
  }, [isDarkMode]);

  if (!user) return null;

  // Filter tabs by active user's role (RBAC Rule)
  const allowedTabs = TABS.filter(tab => tab.roles.includes(user.role));

  // If active tab becomes restricted due to dev switcher role change, fall back to dashboard
  const isTabAllowed = allowedTabs.some(t => t.id === activeTab);
  const currentTab = isTabAllowed ? activeTab : 'dashboard';

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-container">
          <div className="brand-logo" style={{ background: 'transparent', padding: 0 }}>
            <img 
              src={isDarkMode ? "/logo-dark.png" : "/logo-light.png"} 
              alt="Logo" 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>
          <span className="brand-name">TransitOps</span>
        </div>

        <nav className="nav-links">
          {allowedTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <a
                key={tab.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </a>
            );
          })}
        </nav>

        {/* User Info & Profile at Sidebar Bottom */}
        <div className="user-profile">
          <div className="user-avatar">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="user-details">
            <div className="user-name">{user.name}</div>
            <div className="user-role-badge">{user.role}</div>
          </div>
          <button onClick={logout} className="theme-toggle" title="Log Out" style={{ color: 'var(--accent-red)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {/* Navigation / Header Bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {TABS.find(t => t.id === currentTab)?.label}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Authorized Section &bull; TransitOps Operations Console
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Live Clock display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              <Clock size={14} />
              <span>
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Notification Bell */}
            <NotificationCenter />

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="theme-toggle"
              style={{ border: '1px solid var(--border-color)', width: '36px', height: '36px' }}
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>


        {/* Render Tab Screens with Detailed RBAC Guard Message */}
        <section>
          {currentTab === 'dashboard' && <DashboardOverview />}

          {/* Vehicles Panel */}
          {currentTab === 'vehicles' && <VehiclesRegistry />}

          {/* Drivers Panel */}
          {currentTab === 'drivers' && <DriversRegistry />}

          {/* Trips Panel */}
          {currentTab === 'trips' && <TripsDashboard />}

          {/* Maintenance Panel */}
          {currentTab === 'maintenance' && <MaintenanceLogs />}

          {/* Expenses Panel */}
          {currentTab === 'expenses' && <ExpenseTracker />}

          {/* Fallback mock display screens for remaining tabs */}
          {currentTab !== 'dashboard' && currentTab !== 'vehicles' && currentTab !== 'drivers' && currentTab !== 'trips' && currentTab !== 'maintenance' && currentTab !== 'expenses' && (
            <div className="card-glass" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                color: 'var(--primary-solid)',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <Lock size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>RBAC Scaffolding Active</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                The <strong>{TABS.find(t => t.id === currentTab)?.label}</strong> module is fully configured with access permissions for 
                {' '}{TABS.find(t => t.id === currentTab)?.roles.join(', ')} users.
                Its data model, schemas, and seeds have been initialized. Detailed operations will be fully unlocked in Phase 5.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={14} />
                <span>Authorized for: {user.role}</span>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
