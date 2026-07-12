import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbGetVehicles, dbAddVehicle, dbUpdateVehicle } from '../../../backend/db/db';
import type { Vehicle, VehicleStatus } from '../../../backend/db/types';
import { Modal } from './Modal';
import { DocumentManager } from './DocumentManager';
import type { VehicleDocument } from './DocumentManager';
import { 
  Truck, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  Wrench, 
  AlertTriangle,
  Scale,
  Gauge,
  DollarSign
} from 'lucide-react';

export const VehiclesRegistry: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Register New Vehicle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Form fields
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [type, setType] = useState('Heavy Duty Truck');
  const [maxLoad, setMaxLoad] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('Available');

  // Load vehicles
  const loadData = () => {
    setVehicles(dbGetVehicles());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // RBAC Checks
  const isManager = user.role === 'Fleet Manager';
  const isFinance = user.role === 'Financial Analyst';
  const canEdit = isManager || isFinance;
  const canAdd = isManager;

  // Counters for Metrics Bar
  const totalFleet = vehicles.length;
  const activeTrips = vehicles.filter(v => v.status === 'On Trip').length;
  const inShop = vehicles.filter(v => v.status === 'In Shop').length;
  const retired = vehicles.filter(v => v.status === 'Retired').length;

  // Filtered & Sorted list
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'odometer-asc') return a.odometer - b.odometer;
    if (sortBy === 'odometer-desc') return b.odometer - a.odometer;
    if (sortBy === 'cost-asc') return a.acquisitionCost - b.acquisitionCost;
    if (sortBy === 'cost-desc') return b.acquisitionCost - a.acquisitionCost;
    if (sortBy === 'capacity-desc') return b.maxLoadCapacity - a.maxLoadCapacity;
    return 0;
  });

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingVehicleId(null);
    setModalTitle('Register New Vehicle');
    setName('');
    setRegNumber('');
    setType('Heavy Duty Truck');
    setMaxLoad('10000');
    setOdometer('50000');
    setCost('95000');
    setStatus('Available');
    setDocuments([]);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setModalTitle(`Edit Asset: ${vehicle.name}`);
    setName(vehicle.name);
    setRegNumber(vehicle.registrationNumber);
    setType(vehicle.type);
    setMaxLoad(vehicle.maxLoadCapacity.toString());
    setOdometer(vehicle.odometer.toString());
    setCost(vehicle.acquisitionCost.toString());
    setStatus(vehicle.status);
    setDocuments(vehicle.documents || []);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Decommission quick handler
  const handleQuickDecommission = (id: string) => {
    if (window.confirm('Are you sure you want to decommission/retire this vehicle? This will mark it as retired.')) {
      try {
        dbUpdateVehicle(id, { status: 'Retired' });
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

    if (!name.trim() || !regNumber.trim() || !maxLoad || !odometer || !cost) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    const payload = {
      name: name.trim(),
      registrationNumber: regNumber.toUpperCase().trim(),
      type,
      maxLoadCapacity: Number(maxLoad),
      odometer: Number(odometer),
      acquisitionCost: Number(cost),
      status,
      documents: documents
    };

    try {
      if (editingVehicleId) {
        dbUpdateVehicle(editingVehicleId, payload);
      } else {
        dbAddVehicle(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Fleet Metrics Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-solid)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalFleet}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Fleet Assets</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeTrips}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active (On Trip)</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Wrench size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{inShop}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>In Shop (Maintenance)</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{retired}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Decommissioned (Retired)</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '300px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
            <input
              type="text"
              placeholder="Search by reg number or model..."
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
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
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
              <option value="odometer-asc">Odometer (Lowest)</option>
              <option value="odometer-desc">Odometer (Highest)</option>
              <option value="cost-asc">Cost (Lowest)</option>
              <option value="cost-desc">Cost (Highest)</option>
              <option value="capacity-desc">Load Capacity (Highest)</option>
            </select>
          </div>
        </div>

        {/* Add Asset Trigger */}
        {canAdd && (
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Register Vehicle</span>
          </button>
        )}
      </div>

      {/* Grid List */}
      {filteredVehicles.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
          No vehicles found matching the filters.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredVehicles.map(vehicle => {
            const statusKey = vehicle.status.toLowerCase().replace(' ', '') as 'available' | 'ontrip' | 'inshop' | 'retired';
            return (
              <div key={vehicle.id} className="card-glass" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem'
              }}>
                {/* Upper block */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'rgba(255,255,255,0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      color: 'var(--text-muted)'
                    }}>
                      {vehicle.type}
                    </div>
                    <span className={`badge badge-${statusKey}`}>
                      <span className="badge-dot"></span>
                      {vehicle.status}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.25rem' }}>{vehicle.name}</h3>
                  <div style={{ fontFamily: 'monospace', color: 'var(--primary-solid)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '1rem' }}>
                    {vehicle.registrationNumber}
                  </div>

                  {/* Core specifications */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Scale size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>Cargo Capacity: </span>
                      <strong style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>
                        {vehicle.maxLoadCapacity.toLocaleString()} kg
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Gauge size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>Odometer: </span>
                      <strong style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>
                        {vehicle.odometer.toLocaleString()} km
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <DollarSign size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>Acquisition Cost: </span>
                      <strong style={{ color: 'var(--text-primary)', marginLeft: 'auto' }}>
                        ${vehicle.acquisitionCost.toLocaleString()}
                      </strong>
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
                      onClick={() => handleOpenEdit(vehicle)}
                    >
                      <Edit2 size={12} />
                      <span>{isFinance ? 'Edit Cost' : 'Edit Asset'}</span>
                    </button>
                    {isManager && vehicle.status !== 'Retired' && (
                      <button
                        className="btn-secondary"
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.8rem',
                          color: 'var(--accent-red)',
                          borderColor: 'rgba(239,68,68,0.2)',
                          justifyContent: 'center'
                        }}
                        onClick={() => handleQuickDecommission(vehicle.id)}
                        title="Decommission Asset"
                      >
                        <Trash2 size={12} />
                        <span>Retire</span>
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
          {/* Read Only/Editable fields depending on role checks */}
          <div className="input-group">
            <label className="input-label" htmlFor="model-name-input">Vehicle Model / Name</label>
            <input
              id="model-name-input"
              type="text"
              className="input-field"
              placeholder="e.g. Peterbilt 579 Heavy Duty"
              disabled={isFinance} // Finance can't edit specs
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-number-input">Registration Number (Unique)</label>
            <input
              id="reg-number-input"
              type="text"
              className="input-field"
              placeholder="e.g. TX-789-A"
              disabled={isFinance || editingVehicleId !== null} // Cannot edit reg number once registered
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="vehicle-type-select">Type</label>
              <select
                id="vehicle-type-select"
                className="input-field"
                disabled={isFinance}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Heavy Duty Truck">Heavy Duty Truck</option>
                <option value="Medium Cargo Van">Medium Cargo Van</option>
                <option value="Light Delivery Van">Light Delivery Van</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="max-load-input">Max Load Capacity (kg)</label>
              <input
                id="max-load-input"
                type="number"
                className="input-field"
                disabled={isFinance}
                value={maxLoad}
                onChange={(e) => setMaxLoad(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="odometer-input">Odometer (km)</label>
              <input
                id="odometer-input"
                type="number"
                className="input-field"
                disabled={isFinance} // Financial analyst reviews odometer but shouldn't modify directly in registry
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="cost-input">Acquisition Cost ($)</label>
              <input
                id="cost-input"
                type="number"
                className="input-field"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label" htmlFor="vehicle-status-select">Operational Status</label>
            <select
              id="vehicle-status-select"
              className="input-field"
              disabled={isFinance}
              value={status}
              onChange={(e) => setStatus(e.target.value as VehicleStatus)}
            >
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          {editingVehicleId && (
            <div style={{ marginBottom: '2rem' }}>
              <DocumentManager documents={documents} onChange={setDocuments} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Vehicle
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
