import type { User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense } from './types';

export const SEED_USERS: User[] = [
  { id: 'u1', name: 'Frank Miller', email: 'manager@transitops.com', password: 'manager123', role: 'Fleet Manager' },
  { id: 'u2', name: 'Dave Miller', email: 'driver@transitops.com', password: 'driver123', role: 'Driver' },
  { id: 'u3', name: 'Sarah Connor', email: 'safety@transitops.com', password: 'safety123', role: 'Safety Officer' },
  { id: 'u4', name: 'Fiona Gallagher', email: 'finance@transitops.com', password: 'finance123', role: 'Financial Analyst' }
];

export const SEED_VEHICLES: Vehicle[] = [
  { id: 'v1', registrationNumber: 'TX-789-A', name: 'Peterbilt 579 Heavy Duty', type: 'Heavy Duty Truck', maxLoadCapacity: 18000, odometer: 124500, acquisitionCost: 145000, status: 'Available' },
  { id: 'v2', registrationNumber: 'CA-456-B', name: 'Ford Transit Cargo 350', type: 'Medium Cargo Van', maxLoadCapacity: 3500, odometer: 48200, acquisitionCost: 45000, status: 'On Trip' },
  { id: 'v3', registrationNumber: 'NY-123-C', name: 'Mercedes-Benz Sprinter', type: 'Light Delivery Van', maxLoadCapacity: 2000, odometer: 85900, acquisitionCost: 52000, status: 'In Shop' },
  { id: 'v4', registrationNumber: 'FL-901-D', name: 'Kenworth T680 Fleet', type: 'Heavy Duty Truck', maxLoadCapacity: 22000, odometer: 350000, acquisitionCost: 160000, status: 'Retired' }
];

// Current date is simulated around July 12, 2026
export const SEED_DRIVERS: Driver[] = [
  { id: 'd1', name: 'John Doe', licenseNumber: 'DL-99210-TX', licenseCategory: 'Class A CDL', expiryDate: '2028-12-15', contact: '+1 (555) 123-4567', safetyScore: 95, status: 'Available' },
  { id: 'd2', name: 'Jane Smith', licenseNumber: 'DL-88301-CA', licenseCategory: 'Class A CDL', expiryDate: '2027-09-20', contact: '+1 (555) 987-6543', safetyScore: 98, status: 'On Trip' },
  { id: 'd3', name: 'Robert Johnson', licenseNumber: 'DL-77492-NY', licenseCategory: 'Class B CDL', expiryDate: '2026-03-10', contact: '+1 (555) 456-7890', safetyScore: 58, status: 'Suspended' }, // Expired & Suspended
  { id: 'd4', name: 'Alice Williams', licenseNumber: 'DL-66583-FL', licenseCategory: 'Class B CDL', expiryDate: '2026-07-28', contact: '+1 (555) 321-0987', safetyScore: 88, status: 'Off Duty' } // Expiring soon
];

export const SEED_TRIPS: Trip[] = [
  { id: 't1', source: 'Austin Warehouse', destination: 'Dallas Distribution Center', vehicleId: 'v1', driverId: 'd1', cargoWeight: 12000, plannedDistance: 320, status: 'Completed', createdAt: '2026-07-05T08:30:00Z' },
  { id: 't2', source: 'Los Angeles Port', destination: 'Las Vegas Depot', vehicleId: 'v2', driverId: 'd2', cargoWeight: 2800, plannedDistance: 430, status: 'Dispatched', createdAt: '2026-07-11T14:15:00Z' },
  { id: 't3', source: 'Miami Sorting Facility', destination: 'Orlando Hub', vehicleId: 'v1', driverId: 'd1', cargoWeight: 5000, plannedDistance: 380, status: 'Draft', createdAt: '2026-07-12T07:00:00Z' }
];

export const SEED_MAINTENANCE_LOGS: MaintenanceLog[] = [
  { id: 'm1', vehicleId: 'v1', description: 'Brake pad replacement and alignment check', startDate: '2026-06-10', endDate: '2026-06-12', cost: 850, status: 'Closed' },
  { id: 'm2', vehicleId: 'v3', description: 'Transmission transmission service and engine diagnostic', startDate: '2026-07-10', endDate: null, cost: 0, status: 'Open' }
];

export const SEED_FUEL_LOGS: FuelLog[] = [
  { id: 'f1', vehicleId: 'v1', liters: 150, cost: 225, date: '2026-07-06' },
  { id: 'f2', vehicleId: 'v2', liters: 75, cost: 112.5, date: '2026-07-11' }
];

export const SEED_EXPENSES: Expense[] = [
  { id: 'e1', vehicleId: 'v1', category: 'Toll', cost: 45, date: '2026-07-05', description: 'I-35 Highway Tolls' },
  { id: 'e2', vehicleId: 'v2', category: 'Permit', cost: 120, date: '2026-07-11', description: 'State Boundary Transit Permit' }
];
