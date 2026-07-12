# TransitOps: Smart Transport Operations Platform

TransitOps is a role-tailored, enterprise-grade fleet management console designed to orchestrate vehicle registries, driver compliance, trip schedules, maintenance shop tickets, and financial ROI tracking. 

Built from scratch using a modern glassmorphic theme and powered by a client-side database engine, TransitOps eliminates manual dispatcher scheduling mistakes while providing safety audits and operational metrics in a single interface.

---

## 🛠️ The Tech Stack

* **Vite + React (TypeScript)**: Fast dev builds and type-safe components.
* **Vanilla CSS**: Designed custom tokens for themes (Dark Obsidian default / Light Slate), glassmorphic backdrops, glowing shadows, and animations.
* **Lucide React**: Modern, clean iconography.
* **HTML5 LocalStorage DB Engine**: A custom local storage database layer (`src/db/db.ts`) simulating transactions, record insertions, and relationship queries.

---

## 🚀 Key Platform Features

### 1. Persona Switcher & Role-Based UI (RBAC)
The interface adapts dynamically based on the logged-in persona:
* **Fleet Managers**: Master control over vehicles, drivers, dispatches, shop logs, and expense audits.
* **Safety Officers**: Specialized compliance dashboards detailing license warnings, safety rankings, and open maintenance tickets.
* **Financial Analysts**: Read-only access to operations but full visibility into fuel audits, operational costs, and the Vehicle ROI table.
* **Drivers**: Compact, single-column dashboard tracking assigned active dispatches and logs for fuel and tolls.

### 2. Strict Constraint Validation Engine
The dispatch engine acts as a safety gatekeeper, programmatically enforcing operational constraints:
* **Cargo Weight Safeguards**: Automatically blocks trip dispatches if the cargo weight exceeds the assigned vehicle's maximum load capacity.
* **Asset Query Filters**: Excludes retired vehicles, suspended drivers, expired CDLs, and vehicles in the shop from dispatch options.
* **Double-Booking Prevention**: Dispatched assets are marked as `On Trip` and hidden from the registry. Statuses automatically revert back to `Available` once the driver completes or aborts the dispatch order.

### 3. Maintenance Ticket Lifecycle (Forced State Transitions)
* Creating an active maintenance workorder automatically changes the vehicle's status to `In Shop` and blocks it from trip dispatches.
* Resolving and closing a maintenance log (recording resolution cost and end dates) automatically restores the vehicle to `Available` (unless previously Retired).

### 4. Vehicle Operational Cost Summary
Automated financial tracking aggregates fuel costs, tolls, and maintenance spends:
* **Total Operational Cost** = Maintenance Cost + Fuel Cost + Incidental Tolls.
* Operational costs are displayed next to acquisition values.

### 5. Mathematical ROI Engine
Calculates vehicle profit margins using the formula:
$$\text{ROI} = \frac{\text{Revenue} - (\text{Maintenance} + \text{Fuel})}{\text{Acquisition Cost}}$$
* **Trip Revenue** is calculated dynamically: $\text{Planned Distance} \times \$2.50 + \text{Cargo Weight} \times \$0.10$.
* The **Vehicle ROI Summary** lists total completed trips, calculated revenues, net earnings, and the final ROI percentage.

### 6. Driver Compliance Notification Center
An on-startup background service evaluates driver CDL dates. If a license is expired or expiring within 30 days, the service dispatches a warning log to `safety@transitops.com`. An alert bell in the header displays warning counts and reveals a popover log list.

### 7. Vehicle Document Vault
An interactive file vault inside the Vehicle Edit Modal lets dispatchers drag-and-drop registration certificates or insurance policies, persisting file metadata and allowing document downloads.

### 8. Advanced Sorting, Filters, & CSV Downloads
* **Registries Sorting**: Sort vehicles by Odometer, Max Load, Name, or Cost, and drivers by safety scores or CDL urgency.
* **Regional Filters**: Deduces regions (Texas, California, etc.) by parsing license plate prefixes (TX, CA, NY, FL).
* **One-Click Export**: Downloads full analytics reports as a CSV spreadsheet.

---

## 🏃 Local Development Setup

To run TransitOps locally, follow these steps:

### 1. Install Dependencies
Clone the repository, navigate to the directory, and install npm modules:
```bash
npm install
```

### 2. Start the Development Server
Launch the local Vite server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Verify Production Compilation
Run the TypeScript compiler and Vite bundler to test compilation:
```bash
npm run build
```
This builds the static files inside the `dist/` folder.
