import type { User, Vehicle, Driver, Trip, TripStatus, MaintenanceLog, FuelLog, Expense } from './types';
import { SEED_USERS, SEED_VEHICLES, SEED_DRIVERS, SEED_TRIPS, SEED_MAINTENANCE_LOGS, SEED_FUEL_LOGS, SEED_EXPENSES } from './seeds';

const KEYS = {
  USERS: 'transitops_users',
  VEHICLES: 'transitops_vehicles',
  DRIVERS: 'transitops_drivers',
  TRIPS: 'transitops_trips',
  MAINTENANCE_LOGS: 'transitops_maintenance_logs',
  FUEL_LOGS: 'transitops_fuel_logs',
  EXPENSES: 'transitops_expenses'
};

// Initialize DB in LocalStorage
export function initDb() {
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(KEYS.VEHICLES)) {
    localStorage.setItem(KEYS.VEHICLES, JSON.stringify(SEED_VEHICLES));
  }
  if (!localStorage.getItem(KEYS.DRIVERS)) {
    localStorage.setItem(KEYS.DRIVERS, JSON.stringify(SEED_DRIVERS));
  }
  if (!localStorage.getItem(KEYS.TRIPS)) {
    localStorage.setItem(KEYS.TRIPS, JSON.stringify(SEED_TRIPS));
  }
  if (!localStorage.getItem(KEYS.MAINTENANCE_LOGS)) {
    localStorage.setItem(KEYS.MAINTENANCE_LOGS, JSON.stringify(SEED_MAINTENANCE_LOGS));
  }
  if (!localStorage.getItem(KEYS.FUEL_LOGS)) {
    localStorage.setItem(KEYS.FUEL_LOGS, JSON.stringify(SEED_FUEL_LOGS));
  }
  if (!localStorage.getItem(KEYS.EXPENSES)) {
    localStorage.setItem(KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
  }
}

// Reset Database helper for developers
export function resetDb() {
  localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
  localStorage.setItem(KEYS.VEHICLES, JSON.stringify(SEED_VEHICLES));
  localStorage.setItem(KEYS.DRIVERS, JSON.stringify(SEED_DRIVERS));
  localStorage.setItem(KEYS.TRIPS, JSON.stringify(SEED_TRIPS));
  localStorage.setItem(KEYS.MAINTENANCE_LOGS, JSON.stringify(SEED_MAINTENANCE_LOGS));
  localStorage.setItem(KEYS.FUEL_LOGS, JSON.stringify(SEED_FUEL_LOGS));
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(SEED_EXPENSES));
}

// Low-Level Getter/Setter APIs
export function getCollection<T>(key: string): T[] {
  initDb();
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function saveCollection<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// User Actions
export const dbGetUsers = () => getCollection<User>(KEYS.USERS);

// Vehicle Actions
export const dbGetVehicles = () => getCollection<Vehicle>(KEYS.VEHICLES);
export function dbAddVehicle(vehicle: Omit<Vehicle, 'id'>): Vehicle {
  const vehicles = dbGetVehicles();
  
  // Rule Check: Registration Number must be unique
  const exists = vehicles.some(v => v.registrationNumber.toUpperCase().trim() === vehicle.registrationNumber.toUpperCase().trim());
  if (exists) {
    throw new Error(`Vehicle with registration number '${vehicle.registrationNumber}' already exists.`);
  }

  const newVehicle: Vehicle = {
    ...vehicle,
    id: 'veh-' + Math.random().toString(36).substr(2, 9),
    registrationNumber: vehicle.registrationNumber.toUpperCase().trim()
  };
  
  vehicles.push(newVehicle);
  saveCollection(KEYS.VEHICLES, vehicles);
  return newVehicle;
}

export function dbUpdateVehicle(id: string, updates: Partial<Vehicle>): Vehicle {
  const vehicles = dbGetVehicles();
  const idx = vehicles.findIndex(v => v.id === id);
  if (idx === -1) throw new Error('Vehicle not found.');

  // If changing registration number, check for uniqueness
  if (updates.registrationNumber) {
    const reg = updates.registrationNumber.toUpperCase().trim();
    const exists = vehicles.some(v => v.id !== id && v.registrationNumber === reg);
    if (exists) {
      throw new Error(`Vehicle with registration number '${reg}' already exists.`);
    }
    updates.registrationNumber = reg;
  }

  vehicles[idx] = { ...vehicles[idx], ...updates };
  saveCollection(KEYS.VEHICLES, vehicles);
  return vehicles[idx];
}

// Driver Actions
export const dbGetDrivers = () => getCollection<Driver>(KEYS.DRIVERS);
export function dbAddDriver(driver: Omit<Driver, 'id'>): Driver {
  const drivers = dbGetDrivers();
  const newDriver: Driver = {
    ...driver,
    id: 'drv-' + Math.random().toString(36).substr(2, 9)
  };
  drivers.push(newDriver);
  saveCollection(KEYS.DRIVERS, drivers);
  return newDriver;
}

export function dbUpdateDriver(id: string, updates: Partial<Driver>): Driver {
  const drivers = dbGetDrivers();
  const idx = drivers.findIndex(d => d.id === id);
  if (idx === -1) throw new Error('Driver not found.');

  drivers[idx] = { ...drivers[idx], ...updates };
  saveCollection(KEYS.DRIVERS, drivers);
  return drivers[idx];
}

// Trip Actions
export const dbGetTrips = () => getCollection<Trip>(KEYS.TRIPS);

export function dbCreateTrip(tripData: Omit<Trip, 'id' | 'status' | 'createdAt'>): Trip {
  const vehicles = dbGetVehicles();
  const drivers = dbGetDrivers();

  const vehicle = vehicles.find(v => v.id === tripData.vehicleId);
  const driver = drivers.find(d => d.id === tripData.driverId);

  if (!vehicle) throw new Error('Selected vehicle not found.');
  if (!driver) throw new Error('Selected driver not found.');

  // Validation Rule: Weight Capacity Check (cargo weight <= maxLoadCapacity)
  if (tripData.cargoWeight > vehicle.maxLoadCapacity) {
    throw new Error(`Cargo weight (${tripData.cargoWeight} kg) exceeds maximum load capacity of vehicle (${vehicle.maxLoadCapacity} kg).`);
  }

  // Validation Rule: Active Status Check for dispatch (Retired or In Shop checks)
  if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
    throw new Error(`Vehicle status is '${vehicle.status}'. It cannot be assigned to a trip.`);
  }

  // Validation Rule: Driver Safety/License status check
  if (driver.status === 'Suspended') {
    throw new Error(`Driver ${driver.name} is Suspended and cannot be assigned to a trip.`);
  }
  
  // Validation Rule: Check expired license
  const currentDate = new Date().toISOString().split('T')[0];
  if (driver.expiryDate < currentDate) {
    throw new Error(`Driver ${driver.name} has an expired license (Expired: ${driver.expiryDate}).`);
  }

  // Validation Rule: Double Booking check
  if (vehicle.status === 'On Trip') {
    throw new Error(`Vehicle '${vehicle.name}' is currently On Trip and cannot be double booked.`);
  }
  if (driver.status === 'On Trip') {
    throw new Error(`Driver '${driver.name}' is currently On Trip and cannot be double booked.`);
  }

  const trips = dbGetTrips();
  const newTrip: Trip = {
    ...tripData,
    id: 'trp-' + Math.random().toString(36).substr(2, 9),
    status: 'Draft',
    createdAt: new Date().toISOString()
  };

  trips.push(newTrip);
  saveCollection(KEYS.TRIPS, trips);
  return newTrip;
}

export function dbUpdateTripStatus(tripId: string, status: TripStatus): Trip {
  const trips = dbGetTrips();
  const idx = trips.findIndex(t => t.id === tripId);
  if (idx === -1) throw new Error('Trip not found.');

  const trip = trips[idx];
  const oldStatus = trip.status;

  if (oldStatus === status) return trip;

  // Apply State Transitions & Side Effects
  // Dispatch Action
  if (status === 'Dispatched') {
    // Confirm entities are available or only allow transition from Draft
    dbUpdateVehicle(trip.vehicleId, { status: 'On Trip' });
    dbUpdateDriver(trip.driverId, { status: 'On Trip' });
  } 
  // Completion Action
  else if (status === 'Completed') {
    dbUpdateVehicle(trip.vehicleId, { status: 'Available' });
    dbUpdateDriver(trip.driverId, { status: 'Available' });
  } 
  // Cancellation Action
  else if (status === 'Cancelled') {
    // Only revert status if it was actively dispatched
    if (oldStatus === 'Dispatched') {
      dbUpdateVehicle(trip.vehicleId, { status: 'Available' });
      dbUpdateDriver(trip.driverId, { status: 'Available' });
    }
  }

  trip.status = status;
  trips[idx] = trip;
  saveCollection(KEYS.TRIPS, trips);
  return trip;
}

// Maintenance Log Actions
export const dbGetMaintenanceLogs = () => getCollection<MaintenanceLog>(KEYS.MAINTENANCE_LOGS);

export function dbCreateMaintenanceLog(log: Omit<MaintenanceLog, 'id' | 'status'>): MaintenanceLog {
  // Check if vehicle exists
  const vehicles = dbGetVehicles();
  const vehicleExists = vehicles.some(v => v.id === log.vehicleId);
  if (!vehicleExists) throw new Error('Vehicle not found.');

  const logs = dbGetMaintenanceLogs();
  const newLog: MaintenanceLog = {
    ...log,
    id: 'mnt-' + Math.random().toString(36).substr(2, 9),
    status: 'Open'
  };

  logs.push(newLog);
  saveCollection(KEYS.MAINTENANCE_LOGS, logs);

  // Side Effect: Maintenance Creation -> Force vehicle status to "In Shop"
  dbUpdateVehicle(log.vehicleId, { status: 'In Shop' });

  return newLog;
}

export function dbCloseMaintenanceLog(id: string, endDate: string, cost: number): MaintenanceLog {
  const logs = dbGetMaintenanceLogs();
  const idx = logs.findIndex(l => l.id === id);
  if (idx === -1) throw new Error('Maintenance log not found.');

  const log = logs[idx];
  log.endDate = endDate;
  log.cost = cost;
  log.status = 'Closed';

  logs[idx] = log;
  saveCollection(KEYS.MAINTENANCE_LOGS, logs);

  // Side Effect: Maintenance Closure -> Returns vehicle to "Available"
  // Keep Retired status if it is Retired, otherwise set Available.
  const vehicle = dbGetVehicles().find(v => v.id === log.vehicleId);
  if (vehicle && vehicle.status !== 'Retired') {
    dbUpdateVehicle(log.vehicleId, { status: 'Available' });
  }

  return log;
}

// Fuel Log Actions
export const dbGetFuelLogs = () => getCollection<FuelLog>(KEYS.FUEL_LOGS);
export function dbAddFuelLog(log: Omit<FuelLog, 'id'>): FuelLog {
  const logs = dbGetFuelLogs();
  const newLog: FuelLog = {
    ...log,
    id: 'fl-' + Math.random().toString(36).substr(2, 9)
  };
  logs.push(newLog);
  saveCollection(KEYS.FUEL_LOGS, logs);
  return newLog;
}

// Expense Actions
export const dbGetExpenses = () => getCollection<Expense>(KEYS.EXPENSES);
export function dbAddExpense(exp: Omit<Expense, 'id'>): Expense {
  const expenses = dbGetExpenses();
  const newExp: Expense = {
    ...exp,
    id: 'exp-' + Math.random().toString(36).substr(2, 9)
  };
  expenses.push(newExp);
  saveCollection(KEYS.EXPENSES, expenses);
  return newExp;
}
