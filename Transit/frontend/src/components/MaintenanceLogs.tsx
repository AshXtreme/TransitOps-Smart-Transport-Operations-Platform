import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  dbGetMaintenanceLogs, 
  dbCreateMaintenanceLog, 
  dbCloseMaintenanceLog, 
  dbGetVehicles 
} from '../../../backend/db/db';
import type { MaintenanceLog, Vehicle } from '../../../backend/db/types';
import { Modal } from './Modal';
import { 
  Plus, 
  Search, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity
} from 'lucide-react';

export const MaintenanceLogs: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states (Log Maintenance)
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');

  // Form states (Resolve Workorder)
  const [resolvingLogId, setResolvingLogId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');

  const loadData = () => {
    setLogs(dbGetMaintenanceLogs());
    setVehicles(dbGetVehicles());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // RBAC Checks
  const canWrite = user.role === 'Fleet Manager' || user.role === 'Safety Officer';

  // Metrics calculations
  const totalSpend = logs.reduce((sum, log) => sum + log.cost, 0);
  const openCount = logs.filter(l => l.status === 'Open').length;
  const closedCount = logs.filter(l => l.status === 'Closed').length;

  // Filter vehicles available for maintenance (ignore Retired)
  const maintainableVehicles = vehicles.filter(v => v.status !== 'Retired');

  // Filtered logs
  const filteredLogs = logs.filter(l => {
    const vehicle = vehicles.find(v => v.id === l.vehicleId);
    const vName = vehicle?.name || '';
    const vReg = vehicle?.registrationNumber || '';
    
    const matchesSearch = l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vReg.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Open Log Modal
  const handleOpenLog = () => {
    setVehicleId('');
    setDescription('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setErrorMsg(null);
    setIsLogModalOpen(true);
  };

  // Open Resolve Modal
  const handleOpenResolve = (log: MaintenanceLog) => {
    setResolvingLogId(log.id);
    setEndDate(new Date().toISOString().split('T')[0]);
    setCost('250');
    setErrorMsg(null);
    setIsResolveModalOpen(true);
  };

  // Submit Log Maintenance
  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleId || !description.trim() || !startDate) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    try {
      dbCreateMaintenanceLog({
        vehicleId,
        description: description.trim(),
        startDate,
        endDate: null,
        cost: 0
      });
      setIsLogModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Submit Resolve Ticket
  const handleSaveResolve = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resolvingLogId || !endDate || !cost) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    const costNum = Number(cost);
    if (costNum < 0) {
      setErrorMsg('Cost must be a positive number.');
      return;
    }

    // Check if end date is before start date
    const log = logs.find(l => l.id === resolvingLogId);
    if (log && endDate < log.startDate) {
      setErrorMsg(`End Date cannot be before the Start Date (${log.startDate}).`);
      return;
    }

    try {
      dbCloseMaintenanceLog(resolvingLogId, endDate, costNum);
      setIsResolveModalOpen(false);
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
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalSpend.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Maintenance Spend</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Activity size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{openCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Open Workorders (In Shop)</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{closedCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Resolved Tickets</div>
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
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
            <input
              type="text"
              placeholder="Search by description or vehicle..."
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
              <option value="All">All Tickets</option>
              <option value="Open">Open Workorders</option>
              <option value="Closed">Resolved Tickets</option>
            </select>
          </div>
        </div>

        {/* Trigger Button */}
        {canWrite && (
          <button className="btn-primary" onClick={handleOpenLog}>
            <Plus size={16} />
            <span>Log Maintenance</span>
          </button>
        )}
      </div>

      {/* Maintenance Table Grid */}
      <div className="card-glass" style={{ padding: 0 }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
            No maintenance records registered.
          </div>
        ) : (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Work Description</th>
                  <th>Start Date</th>
                  <th>Resolution Date</th>
                  <th>Cost</th>
                  <th>Status</th>
                  {canWrite && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => {
                  const vehicle = vehicles.find(v => v.id === log.vehicleId);
                  const isClosed = log.status === 'Closed';
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ color: 'var(--text-primary)' }}>{vehicle?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary-solid)', fontFamily: 'monospace' }}>
                          {vehicle?.registrationNumber || 'N/A'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{log.description}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{log.startDate}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{log.endDate || '—'}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {isClosed ? `$${log.cost.toLocaleString()}` : '—'}
                      </td>
                      <td>
                        <span className={`badge ${isClosed ? 'badge-available' : 'badge-inshop'}`}>
                          <span className="badge-dot"></span>
                          {log.status === 'Closed' ? 'Resolved' : 'In Shop'}
                        </span>
                      </td>
                      {canWrite && (
                        <td style={{ textAlign: 'right' }}>
                          {!isClosed ? (
                            <button
                              className="btn-primary"
                              style={{
                                padding: '0.4rem 0.75rem',
                                fontSize: '0.75rem',
                                background: 'var(--accent-amber)',
                                boxShadow: 'none'
                              }}
                              onClick={() => handleOpenResolve(log)}
                            >
                              Resolve Ticket
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit Complete</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Maintenance Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Maintenance Workorder">
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

        <form onSubmit={handleSaveLog}>
          <div className="input-group">
            <label className="input-label" htmlFor="maintenance-vehicle-select">Select Active Fleet Asset</label>
            <select
              id="maintenance-vehicle-select"
              className="input-field"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">-- Select Vehicle --</option>
              {maintainableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registrationNumber}) - Status: {v.status}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="maintenance-desc-input">Work Description / Faults</label>
            <textarea
              id="maintenance-desc-input"
              className="input-field"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="Detail inspection checks, squeaky brakes, regular servicing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="maintenance-start-date-input">Shop Entry Date</label>
            <input
              id="maintenance-start-date-input"
              type="date"
              className="input-field"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Send to Shop
            </button>
          </div>
        </form>
      </Modal>

      {/* Resolve Ticket Modal */}
      <Modal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} title="Close Maintenance Ticket">
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

        <form onSubmit={handleSaveResolve}>
          <div className="input-group">
            <label className="input-label" htmlFor="maintenance-end-date-input">Shop Release Date</label>
            <input
              id="maintenance-end-date-input"
              type="date"
              className="input-field"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="maintenance-cost-input">Total Servicing Cost ($)</label>
            <input
              id="maintenance-cost-input"
              type="number"
              className="input-field"
              placeholder="e.g. 500"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: 'var(--accent-green)' }}>
              Release Asset
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
