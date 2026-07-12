import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbGetDrivers, dbAddDriver, dbUpdateDriver } from '../../../backend/db/db';
import type { Driver, DriverStatus } from '../../../backend/db/types';
import { Modal } from './Modal';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  ShieldAlert, 
  Phone, 
  Award, 
  Calendar,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export const DriversRegistry: React.FC = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Register Driver');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Class A CDL');
  const [expiryDate, setExpiryDate] = useState('');
  const [contact, setContact] = useState('');
  const [safetyScore, setSafetyScore] = useState('');
  const [status, setStatus] = useState<DriverStatus>('Available');

  // Simulated current date
  const SIMULATED_TODAY = '2026-07-12';

  const loadData = () => {
    setDrivers(dbGetDrivers());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // RBAC Checks
  const isManager = user.role === 'Fleet Manager';
  const isSafety = user.role === 'Safety Officer';
  const canEdit = isManager || isSafety;
  const canAdd = isManager || isSafety;

  // Counters for Metrics Bar
  const totalDrivers = drivers.length;
  const onTrip = drivers.filter(d => d.status === 'On Trip').length;
  const offDuty = drivers.filter(d => d.status === 'Off Duty').length;
  const suspended = drivers.filter(d => d.status === 'Suspended').length;

  // Filtered & Sorted List
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'score-desc') return b.safetyScore - a.safetyScore;
    if (sortBy === 'score-asc') return a.safetyScore - b.safetyScore;
    if (sortBy === 'expiry-asc') return a.expiryDate.localeCompare(b.expiryDate);
    return 0;
  });

  const getLicenseStatus = (expiry: string) => {
    if (expiry < SIMULATED_TODAY) {
      return { label: 'Expired', color: 'var(--accent-red)', isWarning: true };
    }
    
    // Check if expiring within 30 days (simulate by parsing date or checking milliseconds)
    const todayMs = new Date(SIMULATED_TODAY).getTime();
    const expiryMs = new Date(expiry).getTime();
    const diffDays = Math.ceil((expiryMs - todayMs) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30 && diffDays >= 0) {
      return { label: 'Expiring Soon', color: 'var(--accent-amber)', isWarning: true };
    }

    return { label: 'Active', color: 'var(--accent-green)', isWarning: false };
  };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'var(--accent-green)';
    if (score >= 70) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingDriverId(null);
    setModalTitle('Register Driver Profile');
    setName('');
    setLicenseNumber('');
    setLicenseCategory('Class A CDL');
    setExpiryDate('2028-01-01');
    setContact('');
    setSafetyScore('90');
    setStatus('Available');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (driver: Driver) => {
    setEditingDriverId(driver.id);
    setModalTitle(`Edit Driver Profile: ${driver.name}`);
    setName(driver.name);
    setLicenseNumber(driver.licenseNumber);
    setLicenseCategory(driver.licenseCategory);
    setExpiryDate(driver.expiryDate);
    setContact(driver.contact);
    setSafetyScore(driver.safetyScore.toString());
    setStatus(driver.status);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Suspend quick handler
  const handleQuickSuspend = (id: string) => {
    if (window.confirm('Are you sure you want to suspend this driver? This will update their status to Suspended.')) {
      try {
        dbUpdateDriver(id, { status: 'Suspended' });
        loadData();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !licenseNumber.trim() || !expiryDate || !contact.trim() || !safetyScore) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    const scoreNum = Number(safetyScore);
    if (scoreNum < 0 || scoreNum > 100) {
      setErrorMsg('Safety Score must be between 0 and 100.');
      return;
    }

    const payload = {
      name: name.trim(),
      licenseNumber: licenseNumber.toUpperCase().trim(),
      licenseCategory,
      expiryDate,
      contact: contact.trim(),
      safetyScore: scoreNum,
      status
    };

    try {
      if (editingDriverId) {
        dbUpdateDriver(editingDriverId, payload);
      } else {
        dbAddDriver(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-solid)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalDrivers}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Drivers</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{onTrip}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>On Trip (Active)</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(148,163,184,0.15)', color: 'var(--text-muted)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{offDuty}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Off Duty</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{suspended}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Suspended / Expired</div>
          </div>
        </div>
      </div>

      {/* Action Filters Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Search & filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
            <input
              type="text"
              placeholder="Search by driver name or DL number..."
              className="input-field"
              style={{ width: '100%', paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="input-label" style={{ whiteSpace: 'nowrap' }}>Status:</label>
            <select
              className="input-field"
              style={{ padding: '0.6rem 2rem 0.6rem 1rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="input-label" style={{ whiteSpace: 'nowrap' }}>Sort:</label>
            <select
              className="input-field"
              style={{ padding: '0.6rem 2rem 0.6rem 1rem' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="score-desc">Safety Score (Highest)</option>
              <option value="score-asc">Safety Score (Lowest)</option>
              <option value="expiry-asc">License Expiry (Urgent)</option>
            </select>
          </div>
        </div>

        {/* Trigger Registration Modal */}
        {canAdd && (
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Register Driver</span>
          </button>
        )}
      </div>

      {/* Driver Grid Cards */}
      {filteredDrivers.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
          No drivers registered matching the filters.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredDrivers.map(driver => {
            const statusKey = driver.status.toLowerCase().replace(' ', '') as 'available' | 'ontrip' | 'offduty' | 'suspended';
            const licenseInfo = getLicenseStatus(driver.expiryDate);
            const safetyColor = getSafetyColor(driver.safetyScore);

            return (
              <div key={driver.id} className="card-glass" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                border: licenseInfo.isWarning ? `1px solid ${licenseInfo.color}` : '1px solid var(--border-color)'
              }}>
                {/* Upper block */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    {/* User profile layout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        color: 'var(--primary-solid)',
                        fontSize: '1rem'
                      }}>
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{driver.name}</h3>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{driver.licenseCategory}</div>
                      </div>
                    </div>

                    <span className={`badge badge-${statusKey}`}>
                      <span className="badge-dot"></span>
                      {driver.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>DL Number:</span>
                      <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{driver.licenseNumber}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} /> Expiry Date:
                      </span>
                      <span style={{ fontWeight: 600, color: licenseInfo.color, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {driver.expiryDate}
                        {licenseInfo.isWarning && <AlertTriangle size={12} />}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={12} /> Contact:
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{driver.contact}</span>
                    </div>

                    {/* Safety Score gauge */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Award size={12} /> Safety Score:
                        </span>
                        <strong style={{ color: safetyColor }}>{driver.safetyScore} / 100</strong>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--bg-surface-elevated)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${driver.safetyScore}%`, height: '100%', background: safetyColor }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lower Action buttons */}
                {canEdit && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.75rem',
                    marginTop: '0.5rem'
                  }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', flex: 1, justifyContent: 'center' }}
                      onClick={() => handleOpenEdit(driver)}
                    >
                      <Edit2 size={12} />
                      <span>{isSafety ? 'Update safety' : 'Edit Profile'}</span>
                    </button>
                    {driver.status !== 'Suspended' && (
                      <button
                        className="btn-secondary"
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.8rem',
                          color: 'var(--accent-red)',
                          borderColor: 'rgba(239,68,68,0.2)',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleQuickSuspend(driver.id)}
                        title="Suspend Driver"
                      >
                        <ShieldAlert size={12} />
                        <span>Suspend</span>
                      </button>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {errorMsg && (
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
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="input-group">
            <label className="input-label" htmlFor="driver-name-input">Full Name</label>
            <input
              id="driver-name-input"
              type="text"
              className="input-field"
              placeholder="e.g. Robert Johnson"
              disabled={isSafety && editingDriverId !== null} // Safety can audit scores, but manager handles profiles
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="driver-license-input">License Number</label>
              <input
                id="driver-license-input"
                type="text"
                className="input-field"
                placeholder="e.g. DL-77492-NY"
                disabled={isSafety && editingDriverId !== null}
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="driver-category-select">License Category</label>
              <select
                id="driver-category-select"
                className="input-field"
                disabled={isSafety && editingDriverId !== null}
                value={licenseCategory}
                onChange={(e) => setLicenseCategory(e.target.value)}
              >
                <option value="Class A CDL">Class A CDL</option>
                <option value="Class B CDL">Class B CDL</option>
                <option value="Class C Standard">Class C Standard</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="driver-expiry-input">License Expiry Date</label>
              <input
                id="driver-expiry-input"
                type="date"
                className="input-field"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="driver-contact-input">Contact Phone</label>
              <input
                id="driver-contact-input"
                type="text"
                className="input-field"
                placeholder="e.g. +1 (555) 456-7890"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="driver-score-input">Safety Score (0 - 100)</label>
              <input
                id="driver-score-input"
                type="number"
                min="0"
                max="100"
                className="input-field"
                value={safetyScore}
                onChange={(e) => setSafetyScore(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="driver-status-select">Driver Status</label>
              <select
                id="driver-status-select"
                className="input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value as DriverStatus)}
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Driver
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
