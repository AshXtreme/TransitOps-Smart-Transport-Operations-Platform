import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  dbGetTrips, 
  dbGetVehicles, 
  dbGetDrivers, 
  dbCreateTrip, 
  dbUpdateTripStatus 
} from '../../../backend/db/db';
import type { Trip, Vehicle, Driver, TripStatus } from '../../../backend/db/types';
import { Modal } from './Modal';
import { 
  Plus, 
  Search, 
  MapPin, 
  Truck, 
  User, 
  Scale, 
  Gauge, 
  CheckCircle, 
  Play, 
  AlertTriangle,
  Layers,
  ArrowRight
} from 'lucide-react';

export const TripsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');

  // Simulated current date
  const SIMULATED_TODAY = '2026-07-12';

  const loadData = () => {
    setTrips(dbGetTrips());
    setVehicles(dbGetVehicles());
    setDrivers(dbGetDrivers());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // RBAC Checks
  const canManage = user.role === 'Fleet Manager' || user.role === 'Driver';

  // Compute metrics
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;
  const completedTripsCount = trips.filter(t => t.status === 'Completed').length;
  
  const totalVehiclesCount = vehicles.length;
  const busyVehiclesCount = vehicles.filter(v => v.status === 'On Trip').length;
  const utilizationRate = totalVehiclesCount > 0 
    ? Math.round((busyVehiclesCount / totalVehiclesCount) * 100) 
    : 0;

  // Filter lists for CREATE dispatch dropdowns (Constraints 2 & 3)
  // Constraint 2: Only show Available vehicles (hide In Shop, Retired, On Trip)
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  
  // Constraint 3: Only show Available drivers (hide Suspended, Off Duty, On Trip) AND ensure license is not expired
  const availableDrivers = drivers.filter(d => 
    d.status === 'Available' && 
    d.expiryDate >= SIMULATED_TODAY
  );

  // Filter trips for search query
  const filteredTrips = trips.filter(t => {
    const vName = vehicles.find(v => v.id === t.vehicleId)?.name || '';
    const dName = drivers.find(d => d.id === t.driverId)?.name || '';
    return t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
           t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           dName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Open Create Dispatch Modal
  const handleOpenCreate = () => {
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Save new trip
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!source.trim() || !destination.trim() || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    const weightNum = Number(cargoWeight);
    const distNum = Number(plannedDistance);

    if (weightNum <= 0 || distNum <= 0) {
      setErrorMsg('Weight and Distance must be positive numeric values.');
      return;
    }

    try {
      // Create trip in Draft state (dbCreateTrip performs load checks & double-booking validations internally)
      dbCreateTrip({
        source: source.trim(),
        destination: destination.trim(),
        vehicleId,
        driverId,
        cargoWeight: weightNum,
        plannedDistance: distNum
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // State mutation handler (Dispatch, Complete, Cancel)
  const handleStatusTransition = (tripId: string, nextStatus: TripStatus) => {
    try {
      dbUpdateTripStatus(tripId, nextStatus);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Render columns helper
  const renderColumn = (colStatus: TripStatus, title: string, themeColor: string) => {
    const columnTrips = filteredTrips.filter(t => t.status === colStatus);

    return (
      <div 
        className="kanban-column"
        style={{
          flex: 1,
          minWidth: '270px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Column Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `2px solid ${themeColor}`,
          paddingBottom: '0.75rem',
          marginBottom: '0.25rem'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: themeColor, display: 'inline-block' }}></span>
            {title}
          </h3>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-secondary)',
            padding: '0.2rem 0.6rem',
            borderRadius: '20px'
          }}>
            {columnTrips.length}
          </span>
        </div>

        {/* Column Scrollable Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto',
          maxHeight: '62vh',
          minHeight: '200px',
          padding: '0.1rem'
        }}>
          {columnTrips.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}>
              No trips in {title.toLowerCase()}
            </div>
          ) : (
            columnTrips.map(trip => {
              const vehicle = vehicles.find(v => v.id === trip.vehicleId);
              const driver = drivers.find(d => d.id === trip.driverId);
              
              // Compute cargo load capacity bar percentage
              const loadPercent = vehicle 
                ? Math.min(Math.round((trip.cargoWeight / vehicle.maxLoadCapacity) * 100), 100)
                : 0;

              // Color load bar amber/orange if high load utilization
              const barColor = loadPercent >= 90 
                ? 'var(--accent-amber)' 
                : 'var(--primary-solid)';

              return (
                <div key={trip.id} className="card-glass" style={{
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  {/* Route block */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary-solid)', fontWeight: 700, fontFamily: 'monospace' }}>
                        {trip.id.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Gauge size={12} /> {trip.plannedDistance} km
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <MapPin size={14} style={{ color: 'var(--text-secondary)' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trip.source}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.4rem', margin: '0.15rem 0' }}>
                      <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} style={{ color: 'var(--primary-solid)' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {trip.destination}
                      </div>
                    </div>
                  </div>

                  {/* Vehicle & Driver block */}
                  <div style={{
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                      <Truck size={12} style={{ color: 'var(--primary-solid)' }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {vehicle?.name} ({vehicle?.registrationNumber})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                      <User size={12} style={{ color: 'var(--accent-blue)' }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {driver?.name} (Safety: {driver?.safetyScore})
                      </span>
                    </div>
                  </div>

                  {/* Load Progress bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Scale size={12} /> Load utilization:
                      </span>
                      <strong>{loadPercent}% ({trip.cargoWeight} kg)</strong>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'var(--bg-base)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${loadPercent}%`, height: '100%', background: barColor }}></div>
                    </div>
                  </div>

                  {/* Transition actions */}
                  {canManage && (
                    <div style={{
                      display: 'flex',
                      gap: '0.4rem',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.75rem',
                      marginTop: '0.25rem'
                    }}>
                      {colStatus === 'Draft' && (
                        <>
                          <button
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}
                            onClick={() => handleStatusTransition(trip.id, 'Dispatched')}
                          >
                            <Play size={10} />
                            <span>Dispatch</span>
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}
                            onClick={() => handleStatusTransition(trip.id, 'Cancelled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {colStatus === 'Dispatched' && (
                        <>
                          <button
                            className="btn-primary"
                            style={{ 
                              padding: '0.4rem 0.6rem', 
                              fontSize: '0.75rem', 
                              flex: 1, 
                              justifyContent: 'center',
                              background: 'var(--accent-green)',
                              boxShadow: 'none'
                            }}
                            onClick={() => handleStatusTransition(trip.id, 'Completed')}
                          >
                            <CheckCircle size={10} />
                            <span>Deliver</span>
                          </button>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-red)', borderColor: 'rgba(239,68,68,0.2)' }}
                            onClick={() => handleStatusTransition(trip.id, 'Cancelled')}
                          >
                            Abort
                          </button>
                        </>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Play size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeTripsCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>On Route (Dispatched)</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingTripsCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending (Drafts)</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{completedTripsCount}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed Trips</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-solid)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{utilizationRate}%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Fleet Utilization</div>
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
        <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
          <input
            type="text"
            placeholder="Search by city, model, or driver..."
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

        {/* Create Dispatch Trigger */}
        {canManage && (
          <button className="btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Create Dispatch</span>
          </button>
        )}
      </div>

      {/* Kanban Board columns wrapper */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        overflowX: 'auto',
        paddingBottom: '1rem',
        alignItems: 'flex-start'
      }}>
        {renderColumn('Draft', 'Draft Board', 'var(--text-secondary)')}
        {renderColumn('Dispatched', 'On Route', 'var(--accent-blue)')}
        {renderColumn('Completed', 'Delivered', 'var(--accent-green)')}
        {renderColumn('Cancelled', 'Aborted / Cancelled', 'var(--accent-red)')}
      </div>

      {/* Create Trip Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Dispatch Order">
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="source-input">Source Location</label>
              <input
                id="source-input"
                type="text"
                className="input-field"
                placeholder="e.g. Austin Hub"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="destination-input">Destination Location</label>
              <input
                id="destination-input"
                type="text"
                className="input-field"
                placeholder="e.g. Dallas Center"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="vehicle-select">Select Available Vehicle (Status: Available)</label>
            <select
              id="vehicle-select"
              className="input-field"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">-- Choose Available Asset --</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.registrationNumber}) - Cap: {v.maxLoadCapacity} kg
                </option>
              ))}
            </select>
            {availableVehicles.length === 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                ⚠️ No vehicles currently Available. Free up assets first.
              </span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="driver-select">Select Available Driver (Status: Available & Active CDL)</label>
            <select
              id="driver-select"
              className="input-field"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">-- Choose Available Driver CDL --</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (CDL: {d.licenseCategory}, Score: {d.safetyScore})
                </option>
              ))}
            </select>
            {availableDrivers.length === 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', marginTop: '0.2rem' }}>
                ⚠️ No drivers currently Available with active licenses.
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="cargo-input">Cargo Weight (kg)</label>
              <input
                id="cargo-input"
                type="number"
                className="input-field"
                placeholder="e.g. 5000"
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="distance-input">Planned Distance (km)</label>
              <input
                id="distance-input"
                type="number"
                className="input-field"
                placeholder="e.g. 350"
                value={plannedDistance}
                onChange={(e) => setPlannedDistance(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={availableVehicles.length === 0 || availableDrivers.length === 0}>
              Create Draft
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
