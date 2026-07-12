# TransitOps - Smart Transport Operations Platform

**Hackathon Duration**: 8 Hours
**Objective**: Build an end-to-end transport operations platform digitizing vehicle, driver, dispatch, maintenance, and expense management.

---

## Phase 1: Environment Setup & Authentication (Hour 1)
* **Goal**: Initialize the repository and establish secure access.
* **Action**: Set up a responsive web interface framework.
* **Database Setup**: Create schemas for Users, Roles, Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, and Expenses.
* **Authentication**: Implement secure login via email and password.
* **Authorization**: Apply Role-Based Access Control (RBAC) to ensure only authenticated users have access.

## Phase 2: Core Entity Registries (Hour 2-3)
* **Goal**: Implement CRUD operations for Vehicles and Drivers.
* **Vehicle Registry**: Create a master list including unique Registration Number, Name/Model, Type, Max Load Capacity, Odometer, Acquisition Cost, and Status.
* **Vehicle Statuses**: Restrict status values to Available, On Trip, In Shop, or Retired.
* **Driver Management**: Create profiles storing Name, License Number, License Category, Expiry Date, Contact, Safety Score, and Status.
* **Driver Statuses**: Restrict status values to Available, On Trip, Off Duty, or Suspended.

## Phase 3: Trip Management & Business Logic (Hour 4-5)
* **Goal**: Build the core dispatching engine with mandatory rule validations.
* **Trip Creation**: Allow users to select a source, destination, available vehicle, available driver, cargo weight, and planned distance.
* **Constraint 1 (Weight)**: Cargo weight must not exceed the selected vehicle's maximum load capacity.
* **Constraint 2 (Availability)**: Retired or In Shop vehicles, and drivers with expired licenses or suspended status, cannot be dispatched.
* **Constraint 3 (Double Booking)**: Drivers or vehicles already marked "On Trip" cannot be assigned to new trips.
* **Lifecycle Engine**: Implement trip state transitions: Draft -> Dispatched -> Completed -> Cancelled.

## Phase 4: Maintenance & Expense Tracking (Hour 6)
* **Goal**: Automate maintenance logic and financial tracking.
* **Maintenance Workflows**: Creating an active maintenance record automatically changes the vehicle status to "In Shop" and hides it from dispatch.
* **Maintenance Resolution**: Closing a maintenance record restores the vehicle to "Available" unless it is retired.
* **Expenses**: Record fuel logs (liters, cost, date) alongside other expenses like tolls.
* **Cost Computation**: Automatically calculate total operational cost by summing Fuel and Maintenance per vehicle.

## Phase 5: Dashboards & Analytics (Hour 7)
* **Goal**: Deliver operational insights tailored to specific user roles.
* **KPI Implementation**: Display Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, and Fleet Utilization.
* **Analytics Formula**: Calculate and display Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost.
* **Filtering**: Provide dashboard filters by vehicle type, status, and region.
* **Export**: Build a CSV export function for reports.

## Phase 6: Bonus Features & Polish (Hour 8)
* **Goal**: Elevate the platform to production grade.
* **Visuals**: Implement charts, visual analytics, and a dark mode toggle.
* **Notifications**: Set up automated email reminders for expiring driver licenses.
* **Usability**: Ensure comprehensive search, sorting, and document management features are active.