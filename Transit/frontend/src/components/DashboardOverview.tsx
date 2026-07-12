import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  dbGetVehicles, 
  dbGetDrivers, 
  dbGetTrips, 
  dbGetMaintenanceLogs, 
  dbGetFuelLogs 
} from '../../../backend/db/db';
import type { Vehicle, Driver, Trip, MaintenanceLog, FuelLog } from '../../../backend/db/types';
import { 
  TrendingUp, 
  Truck, 
  Users, 
  Compass, 
  Wrench, 
  DollarSign, 
  Download, 
  Filter, 
  Award, 
  AlertTriangle,
  Calendar,
  Layers,
  UserCheck
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  
  // Database states
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

  // Filter states
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  // Simulated current date
  const SIMULATED_TODAY = '2026-07-12';

  const loadData = () => {
    setVehicles(dbGetVehicles());
    setDrivers(dbGetDrivers());
    setTrips(dbGetTrips());
    setMaintenance(dbGetMaintenanceLogs());
    setFuelLogs(dbGetFuelLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // Deducible Region mapping based on registration prefix
  const getRegion = (reg: string): string => {
    const prefix = reg.substring(0, 2).toUpperCase();
    if (prefix === 'TX') return 'Texas';
    if (prefix === 'CA') return 'California';
    if (prefix === 'NY') return 'New York';
    if (prefix === 'FL') return 'Florida';
    return 'Other';
  };

  // Math: Calculate Trip Revenue
  const calculateTripRevenue = (trip: Trip): number => {
    return trip.plannedDistance * 2.50 + trip.cargoWeight * 0.10;
  };

  // Filtered vehicle collection
  const filteredVehicles = vehicles.filter(v => {
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesRegion = regionFilter === 'All' || v.registrationNumber.toUpperCase().startsWith(regionFilter);
    return matchesType && matchesStatus && matchesRegion;
  });

  // ROI Calculations for each vehicle
  const vehicleAnalyticList = filteredVehicles.map(v => {
    const vFuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((sum, f) => sum + f.cost, 0);
    const vMnt = maintenance.filter(m => m.vehicleId === v.id && m.status === 'Closed').reduce((sum, m) => sum + m.cost, 0);
    
    // Sum of completed trips revenue
    const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
    const vRevenue = vTrips.reduce((sum, t) => sum + calculateTripRevenue(t), 0);
    
    // ROI = (Revenue - (Mnt + Fuel)) / Acquisition Cost
    const netProfit = vRevenue - (vFuel + vMnt);
    const roi = v.acquisitionCost > 0 
      ? Number(((netProfit / v.acquisitionCost) * 100).toFixed(3)) 
      : 0;

    return {
      vehicle: v,
      fuel: vFuel,
      maintenance: vMnt,
      revenue: vRevenue,
      netProfit,
      roi,
      tripsCount: vTrips.length,
      region: getRegion(v.registrationNumber)
    };
  });

  // Spends calculations
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalMaintenanceCost = maintenance.filter(m => m.status === 'Closed').reduce((sum, m) => sum + m.cost, 0);
  const totalSpend = totalFuelCost + totalMaintenanceCost;

  // KPI Calculations
  const activeVehiclesCount = vehicles.filter(v => v.status === 'On Trip').length;
  const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;
  const inShopVehiclesCount = vehicles.filter(v => v.status === 'In Shop').length;
  
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;
  
  // Drivers On Duty = Available or On Trip
  const driversOnDutyCount = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;
  
  // Fleet Utilization (%) = (Active Vehicles / Total Vehicles) * 100
  const totalVehiclesCount = vehicles.length;
  const utilizationRate = totalVehiclesCount > 0 
    ? Math.round((activeVehiclesCount / totalVehiclesCount) * 100) 
    : 0;

  // Compliance Alerts for Safety Officer
  const expiredDrivers = drivers.filter(d => d.expiryDate < SIMULATED_TODAY);
  const expiringSoonDrivers = drivers.filter(d => {
    const todayMs = new Date(SIMULATED_TODAY).getTime();
    const expiryMs = new Date(d.expiryDate).getTime();
    const diffDays = Math.ceil((expiryMs - todayMs) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  });
  const avgSafetyScore = drivers.length > 0 
    ? Math.round(drivers.reduce((sum, d) => sum + d.safetyScore, 0) / drivers.length)
    : 0;

  // CSV Exporter handler
  const handleExportCSV = () => {
    const headers = 'Vehicle,Registration,Region,Type,Maintenance Spend ($),Fuel Spend ($),Completed Trips,Total Revenue ($),Net Profit ($),ROI (%)\n';
    const rows = vehicleAnalyticList.map(item => {
      return `"${item.vehicle.name}","${item.vehicle.registrationNumber}","${item.region}","${item.vehicle.type}",${item.maintenance},${item.fuel},${item.tripsCount},${item.revenue},${item.netProfit},${item.roi}`;
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `transitops_fleet_analytics_${SIMULATED_TODAY}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Dynamic Filtering Header */}
      <div className="card-glass" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1.25rem 1.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-solid)', fontWeight: 700 }}>
          <Filter size={16} />
          <span>Analytics Filters:</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type:</span>
            <select
              className="input-field"
              style={{ padding: '0.4rem 1.75rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Heavy Duty Truck">Heavy Duty Truck</option>
              <option value="Medium Cargo Van">Medium Cargo Van</option>
              <option value="Light Delivery Van">Light Delivery Van</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
            <select
              className="input-field"
              style={{ padding: '0.4rem 1.75rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
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

          {/* Region Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Region:</span>
            <select
              className="input-field"
              style={{ padding: '0.4rem 1.75rem 0.4rem 0.75rem', fontSize: '0.85rem' }}
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="All">All Regions</option>
              <option value="TX">Texas (TX)</option>
              <option value="CA">California (CA)</option>
              <option value="NY">New York (NY)</option>
              <option value="FL">Florida (FL)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. FLEET MANAGER DASHBOARD VIEW */}
      {user.role === 'Fleet Manager' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* KPI Dashboard Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {/* Fleet Utilization */}
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-solid)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <Truck size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{utilizationRate}%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Fleet Utilization</div>
              </div>
            </div>
            
            {/* Active Trips */}
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent-blue)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <Compass size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeTripsCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Active Trips</div>
              </div>
            </div>

            {/* Pending Trips */}
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <Layers size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{pendingTripsCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pending (Drafts)</div>
              </div>
            </div>

            {/* Active Vehicles */}
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent-blue)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <Truck size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activeVehiclesCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Active Vehicles</div>
              </div>
            </div>

            {/* Available Vehicles */}
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <UserCheck size={16} style={{ color: 'var(--accent-green)' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{availableVehiclesCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Available Vehicles</div>
              </div>
            </div>

            {/* Vehicles in Maintenance */}
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <Wrench size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{inShopVehiclesCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>In Maintenance</div>
              </div>
            </div>

            {/* Drivers On Duty */}
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <Users size={16} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{driversOnDutyCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Drivers On Duty</div>
              </div>
            </div>
          </div>

          {/* Custom SVG Charts Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            {/* SVG Bar Chart: ROI per Vehicle */}
            <div className="card-glass">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Fleet ROI Analytics (%)</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '180px', paddingTop: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                {vehicleAnalyticList.slice(0, 5).map(item => {
                  const maxROI = 1.5; // Scale height to max ROI percentage
                  const barHeight = Math.max(Math.min((item.roi / maxROI) * 140, 140), 15); // limit min/max height
                  return (
                    <div key={item.vehicle.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{item.roi}%</span>
                      <div style={{
                        width: '24px',
                        height: `${barHeight}px`,
                        background: 'var(--primary-gradient)',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: 'var(--glow-shadow)',
                        transition: 'height 0.3s ease'
                      }}></div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {item.vehicle.registrationNumber}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SVG Donut Chart: Status distribution */}
            <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Fleet Status Ratios</h3>
              <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <svg width="140" height="140" viewBox="0 0 42 42">
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg-base)" strokeWidth="4"></circle>
                  
                  {/* Proportional strokes: Available (Green), On Trip (Blue), In Shop (Amber) */}
                  {/* Let's compute stroke values */}
                  {(() => {
                    const total = availableVehiclesCount + activeVehiclesCount + inShopVehiclesCount || 1;
                    const pAvail = Math.round((availableVehiclesCount / total) * 100);
                    const pTrip = Math.round((activeVehiclesCount / total) * 100);
                    const pShop = Math.round((inShopVehiclesCount / total) * 100);

                    const strokeDash1 = `${pAvail} ${100 - pAvail}`;
                    const strokeDash2 = `${pTrip} ${100 - pTrip}`;
                    const strokeDash3 = `${pShop} ${100 - pShop}`;

                    const offset1 = 25;
                    const offset2 = 25 - pAvail;
                    const offset3 = 25 - pAvail - pTrip;

                    return (
                      <>
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent-green)" strokeWidth="4.5" strokeDasharray={strokeDash1} strokeDashoffset={offset1}></circle>
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent-blue)" strokeWidth="4.5" strokeDasharray={strokeDash2} strokeDashoffset={offset2}></circle>
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent-amber)" strokeWidth="4.5" strokeDasharray={strokeDash3} strokeDashoffset={offset3}></circle>
                      </>
                    );
                  })()}
                </svg>
                {/* Center text */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{vehicles.filter(v => v.status !== 'Retired').length}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Assets</div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Available: {availableVehiclesCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>On Trip: {activeVehiclesCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-amber)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>In Maintenance: {inShopVehiclesCount}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. SAFETY OFFICER DASHBOARD VIEW */}
      {user.role === 'Safety Officer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Safety KPI counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <Award size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{avgSafetyScore} / 100</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Safety Score</div>
              </div>
            </div>

            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{expiredDrivers.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expired Driver CDLs</div>
              </div>
            </div>

            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{expiringSoonDrivers.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CDLs Expiring (30 Days)</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            {/* Expiration Warnings lists */}
            <div className="card-glass">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} />
                Critical Licensing Warnings
              </h3>
              
              {expiredDrivers.length === 0 && expiringSoonDrivers.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No active licensing warnings. All drivers are compliant.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Expired list */}
                  {expiredDrivers.map(d => (
                    <div key={d.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>DL: {d.licenseNumber}</div>
                      </div>
                      <span className="badge badge-suspended" style={{ fontSize: '0.65rem' }}>Expired ({d.expiryDate})</span>
                    </div>
                  ))}
                  
                  {/* Expiring soon list */}
                  {expiringSoonDrivers.map(d => (
                    <div key={d.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>DL: {d.licenseNumber}</div>
                      </div>
                      <span className="badge badge-inshop" style={{ fontSize: '0.65rem' }}>Expiring ({d.expiryDate})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drivers safety leader board */}
            <div className="card-glass">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Safety Leaderboard</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {drivers.sort((a,b) => b.safetyScore - a.safetyScore).map((d, index) => {
                  const barColor = d.safetyScore >= 90 ? 'var(--accent-green)' : d.safetyScore >= 70 ? 'var(--accent-amber)' : 'var(--accent-red)';
                  return (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '15px' }}>{index + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 500 }}>{d.name}</span>
                          <strong style={{ color: barColor }}>{d.safetyScore}%</strong>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--bg-surface-elevated)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${d.safetyScore}%`, height: '100%', background: barColor }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. FINANCIAL ANALYST DASHBOARD VIEW */}
      {user.role === 'Financial Analyst' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Financial metrics bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-solid)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalSpend.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fleet Total Spend</div>
              </div>
            </div>

            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  ${vehicleAnalyticList.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fleet Total Revenue</div>
              </div>
            </div>

            <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                  {vehicleAnalyticList.length > 0 
                    ? (vehicleAnalyticList.reduce((sum, item) => sum + item.roi, 0) / vehicleAnalyticList.length).toFixed(3)
                    : 0}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avg Fleet ROI (%)</div>
              </div>
            </div>
          </div>

          {/* Export card header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Export Fleet Report (CSV)</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. DRIVER DASHBOARD VIEW */}
      {user.role === 'Driver' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card-glass" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%)',
            borderColor: 'rgba(99,102,241,0.2)'
          }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Active Driver Duties</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Confirm your route schedules and delivery checkpoints. Complete trips immediately upon cargo discharge.
            </p>
          </div>

          {/* Personalized assigned trips lists */}
          <div className="card-glass">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Assigned Dispatch Schedules</h3>
            
            {trips.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No dispatch trips currently scheduled.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {trips.filter(t => t.status === 'Dispatched').map(trip => {
                  const v = vehicles.find(v => v.id === trip.vehicleId);
                  return (
                    <div key={trip.id} style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      padding: '1rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
                        <span>TRIP: {trip.id.toUpperCase()}</span>
                        <span className="badge badge-ontrip">Dispatched</span>
                      </div>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div><strong>From:</strong> {trip.source}</div>
                        <div><strong>To:</strong> {trip.destination}</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Asset Assigned: {v?.name} ({v?.registrationNumber})
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SYSTEM-WIDE ROI ANALYTICS DATA TABLE (visible to Fleet Managers and Financial Analysts) */}
      {(user.role === 'Fleet Manager' || user.role === 'Financial Analyst') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vehicle Operational ROI Summary</h3>
            {user.role === 'Fleet Manager' && (
              <button className="btn-secondary" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }} onClick={handleExportCSV}>
                <Download size={12} />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          <div className="card-glass" style={{ padding: 0 }}>
            {vehicleAnalyticList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
                No vehicle analytics recorded. Adjust filters above.
              </div>
            ) : (
              <div className="table-container">
                <table className="table-custom">
                  <thead>
                    <tr>
                      <th>Vehicle Spec</th>
                      <th>Region</th>
                      <th>Acquisition Cost</th>
                      <th>Maintenance Spend</th>
                      <th>Fuel Spend</th>
                      <th>Trips (Delivered)</th>
                      <th>Calculated Revenue</th>
                      <th>Net Earnings</th>
                      <th>Vehicle ROI (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleAnalyticList.map(item => {
                      const isPositive = item.netProfit >= 0;
                      return (
                        <tr key={item.vehicle.id}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ color: 'var(--text-primary)' }}>{item.vehicle.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.vehicle.type}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary-solid)', fontFamily: 'monospace' }}>
                              {item.vehicle.registrationNumber}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              {item.region}
                            </span>
                          </td>
                          <td>${item.vehicle.acquisitionCost.toLocaleString()}</td>
                          <td>${item.maintenance.toLocaleString()}</td>
                          <td>${item.fuel.toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>{item.tripsCount}</td>
                          <td style={{ fontWeight: 600 }}>${item.revenue.toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {isPositive ? '' : '-'}${Math.abs(item.netProfit).toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 800, color: item.roi >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {item.roi}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
