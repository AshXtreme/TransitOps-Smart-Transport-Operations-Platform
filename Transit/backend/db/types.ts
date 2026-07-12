export type UserRole = 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Used for secure auth verification
  role: UserRole;
}

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export interface Vehicle {
  id: string;
  registrationNumber: string; // Must be unique
  name: string;
  type: string; // e.g., 'Heavy Duty Truck', 'Light Van', etc.
  maxLoadCapacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number;
  status: VehicleStatus;
  documents?: any[]; // Holds uploaded documents
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string; // e.g., 'Class A CDL', 'Class B'
  expiryDate: string; // YYYY-MM-DD
  contact: string;
  safetyScore: number; // 0 - 100
  status: DriverStatus;
}

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  status: TripStatus;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD, null if Open
  cost: number;
  status: 'Open' | 'Closed';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string; // YYYY-MM-DD
}

export interface Expense {
  id: string;
  vehicleId: string;
  category: 'Toll' | 'Permit' | 'Other';
  cost: number;
  date: string; // YYYY-MM-DD
  description: string;
}
