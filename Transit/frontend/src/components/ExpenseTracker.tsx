import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  dbGetFuelLogs, 
  dbAddFuelLog, 
  dbGetExpenses, 
  dbAddExpense, 
  dbGetVehicles, 
  dbGetMaintenanceLogs 
} from '../../../backend/db/db';
import type { FuelLog, Expense, Vehicle, MaintenanceLog } from '../../../backend/db/types';
import { Modal } from './Modal';
import { 
  Plus, 
  Fuel, 
  Receipt, 
  TrendingUp, 
  AlertTriangle,
  Layers,
  Calendar
} from 'lucide-react';

export const ExpenseTracker: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  
  const [subTab, setSubTab] = useState<'summary' | 'fuel' | 'expenses'>('summary');
  const [vehicleFilter, setVehicleFilter] = useState('All');

  // Modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states (Fuel)
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  // Form states (Expenses)
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expCategory, setExpCategory] = useState<'Toll' | 'Permit' | 'Other'>('Toll');
  const [expCost, setExpCost] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const loadData = () => {
    setVehicles(dbGetVehicles());
    setFuelLogs(dbGetFuelLogs());
    setExpenses(dbGetExpenses());
    setMaintenance(dbGetMaintenanceLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  // RBAC Checks (Safety Officer is view-only, others can log fuel/expenses)
  const canLog = user.role !== 'Safety Officer';

  // Compute metrics
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalOtherExpenses = expenses.reduce((sum, e) => sum + e.cost, 0);
  const totalMaintenanceCost = maintenance.filter(m => m.status === 'Closed').reduce((sum, m) => sum + m.cost, 0);
  const totalSpend = totalFuelCost + totalOtherExpenses + totalMaintenanceCost;

  // Calculations per Vehicle (Constraint 4)
  const vehicleCostSummary = vehicles.map(v => {
    const vFuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((sum, f) => sum + f.cost, 0);
    const vMnt = maintenance.filter(m => m.vehicleId === v.id && m.status === 'Closed').reduce((sum, m) => sum + m.cost, 0);
    const vExp = expenses.filter(e => e.vehicleId === v.id).reduce((sum, e) => sum + e.cost, 0);
    const vTotal = vFuel + vMnt + vExp;

    return {
      vehicle: v,
      fuel: vFuel,
      maintenance: vMnt,
      expenses: vExp,
      total: vTotal
    };
  });

  // Filter logs for tables
  const filteredFuelLogs = fuelLogs.filter(f => vehicleFilter === 'All' || f.vehicleId === vehicleFilter);
  const filteredExpenses = expenses.filter(e => vehicleFilter === 'All' || e.vehicleId === vehicleFilter);

  // Open fuel log
  const handleOpenFuel = () => {
    setFuelVehicleId('');
    setLiters('40');
    setFuelCost('60');
    setFuelDate(new Date().toISOString().split('T')[0]);
    setErrorMsg(null);
    setIsFuelModalOpen(true);
  };

  // Open expense log
  const handleOpenExpense = () => {
    setExpVehicleId('');
    setExpCategory('Toll');
    setExpCost('25');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpDesc('');
    setErrorMsg(null);
    setIsExpenseModalOpen(true);
  };

  // Save fuel
  const handleSaveFuel = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fuelVehicleId || !liters || !fuelCost || !fuelDate) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    const litersNum = Number(liters);
    const costNum = Number(fuelCost);

    if (litersNum <= 0 || costNum <= 0) {
      setErrorMsg('Values must be positive numbers.');
      return;
    }

    try {
      dbAddFuelLog({
        vehicleId: fuelVehicleId,
        liters: litersNum,
        cost: costNum,
        date: fuelDate
      });
      setIsFuelModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Save expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!expVehicleId || !expCost || !expDate || !expDesc.trim()) {
      setErrorMsg('Please populate all required fields.');
      return;
    }

    const costNum = Number(expCost);

    if (costNum <= 0) {
      setErrorMsg('Cost must be a positive number.');
      return;
    }

    try {
      dbAddExpense({
        vehicleId: expVehicleId,
        category: expCategory,
        cost: costNum,
        date: expDate,
        description: expDesc.trim()
      });
      setIsExpenseModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-solid)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalSpend.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Combined Operational Spend</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--accent-blue)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Fuel size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalFuelCost.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Fuel Expenses</div>
          </div>
        </div>
        <div className="card-glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <Receipt size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalOtherExpenses.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Incidental / Tolls</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Panel */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '0.1rem',
        gap: '1rem'
      }}>
        <button
          className={`nav-item ${subTab === 'summary' ? 'active' : ''}`}
          style={{ padding: '0.6rem 1rem', background: subTab === 'summary' ? 'var(--primary-gradient)' : 'transparent', boxShadow: 'none' }}
          onClick={() => setSubTab('summary')}
        >
          <Layers size={14} />
          <span>Vehicle Cost Summary</span>
        </button>
        <button
          className={`nav-item ${subTab === 'fuel' ? 'active' : ''}`}
          style={{ padding: '0.6rem 1rem', background: subTab === 'fuel' ? 'var(--primary-gradient)' : 'transparent', boxShadow: 'none' }}
          onClick={() => setSubTab('fuel')}
        >
          <Fuel size={14} />
          <span>Fuel Logs</span>
        </button>
        <button
          className={`nav-item ${subTab === 'expenses' ? 'active' : ''}`}
          style={{ padding: '0.6rem 1rem', background: subTab === 'expenses' ? 'var(--primary-gradient)' : 'transparent', boxShadow: 'none' }}
          onClick={() => setSubTab('expenses')}
        >
          <Receipt size={14} />
          <span>Trip Incidental / Tolls</span>
        </button>
      </div>

      {/* Action Filters Panel */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginTop: '-0.5rem'
      }}>
        {/* Vehicle filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label className="input-label" style={{ whiteSpace: 'nowrap' }}>Filter by Vehicle:</label>
          <select
            className="input-field"
            style={{ padding: '0.6rem 2rem 0.6rem 1rem' }}
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
          >
            <option value="All">All Fleet Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
            ))}
          </select>
        </div>

        {/* Create triggers */}
        {canLog && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn-secondary" style={{ padding: '0.6rem 1rem' }} onClick={handleOpenFuel}>
              <Fuel size={14} />
              <span>Log Fuel</span>
            </button>
            <button className="btn-primary" style={{ padding: '0.6rem 1rem' }} onClick={handleOpenExpense}>
              <Plus size={14} />
              <span>Log Incident / Toll</span>
            </button>
          </div>
        )}
      </div>

      {/* Tables based on active subTab */}
      <div className="card-glass" style={{ padding: 0 }}>
        
        {/* SUMMARY SUBTAB */}
        {subTab === 'summary' && (
          <div className="table-container">
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Maintenance Spend (Closed)</th>
                  <th>Fuel Spend</th>
                  <th>Incidental / Tolls</th>
                  <th>Total Calculated Cost</th>
                </tr>
              </thead>
              <tbody>
                {vehicleCostSummary.map(row => (
                  <tr key={row.vehicle.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{row.vehicle.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-solid)', fontFamily: 'monospace' }}>
                        {row.vehicle.registrationNumber}
                      </div>
                    </td>
                    <td>${row.maintenance.toLocaleString()}</td>
                    <td>${row.fuel.toLocaleString()}</td>
                    <td>${row.expenses.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.95rem' }}>
                      ${row.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FUEL SUBTAB */}
        {subTab === 'fuel' && (
          filteredFuelLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
              No fuel logs recorded.
            </div>
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Refueling Liters</th>
                    <th>Refueling Cost</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFuelLogs.map(log => {
                    const vehicle = vehicles.find(v => v.id === log.vehicleId);
                    return (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div>{vehicle?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-solid)', fontFamily: 'monospace' }}>
                            {vehicle?.registrationNumber}
                          </div>
                        </td>
                        <td>{log.liters} L</td>
                        <td style={{ fontWeight: 600 }}>${log.cost.toLocaleString()}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={12} /> {log.date}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* EXPENSES SUBTAB */}
        {subTab === 'expenses' && (
          filteredExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
              No incidental expenses logged.
            </div>
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Receipt Cost</th>
                    <th>Log Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(log => {
                    const vehicle = vehicles.find(v => v.id === log.vehicleId);
                    return (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>
                          <div>{vehicle?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary-solid)', fontFamily: 'monospace' }}>
                            {vehicle?.registrationNumber}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${log.category === 'Toll' ? 'badge-ontrip' : 'badge-inshop'}`}>
                            {log.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>${log.cost.toLocaleString()}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={12} /> {log.date}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{log.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

      </div>

      {/* Log Fuel Modal */}
      <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Log Fuel Receipt">
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

        <form onSubmit={handleSaveFuel}>
          <div className="input-group">
            <label className="input-label" htmlFor="fuel-vehicle-select">Select Vehicle Asset</label>
            <select
              id="fuel-vehicle-select"
              className="input-field"
              value={fuelVehicleId}
              onChange={(e) => setFuelVehicleId(e.target.value)}
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.filter(v => v.status !== 'Retired').map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="fuel-liters-input">Fuel Quantity (Liters)</label>
              <input
                id="fuel-liters-input"
                type="number"
                className="input-field"
                placeholder="e.g. 50"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="fuel-cost-input">Receipt Cost ($)</label>
              <input
                id="fuel-cost-input"
                type="number"
                className="input-field"
                placeholder="e.g. 75"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="fuel-date-input">Log Date</label>
            <input
              id="fuel-date-input"
              type="date"
              className="input-field"
              value={fuelDate}
              onChange={(e) => setFuelDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsFuelModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Log Fuel
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Incidental Expense">
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

        <form onSubmit={handleSaveExpense}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="exp-vehicle-select">Select Vehicle Asset</label>
              <select
                id="exp-vehicle-select"
                className="input-field"
                value={expVehicleId}
                onChange={(e) => setExpVehicleId(e.target.value)}
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.filter(v => v.status !== 'Retired').map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="exp-category-select">Expense Category</label>
              <select
                id="exp-category-select"
                className="input-field"
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as any)}
              >
                <option value="Toll">Toll Expense</option>
                <option value="Permit">Transit Permit</option>
                <option value="Other">Other Incidents</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label" htmlFor="exp-cost-input">Receipt Cost ($)</label>
              <input
                id="exp-cost-input"
                type="number"
                className="input-field"
                placeholder="e.g. 30"
                value={expCost}
                onChange={(e) => setExpCost(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label" htmlFor="exp-date-input">Log Date</label>
              <input
                id="exp-date-input"
                type="date"
                className="input-field"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label" htmlFor="exp-desc-input">Description</label>
            <input
              id="exp-desc-input"
              type="text"
              className="input-field"
              placeholder="e.g. State route tolls, minor puncture repair..."
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Log Expense
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
