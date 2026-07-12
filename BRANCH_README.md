# Member 2 – Branch: feature/vehicle-driver-registries  (MERGE 2nd, after M1)

Contents: VehiclesRegistry.tsx, DriversRegistry.tsx

Depends on: Modal.tsx, DocumentManager.tsx, AuthContext, db.ts, types.ts (all from M1).
Branch off main AFTER M1 is merged (or off M1's branch directly) so these
dependencies already exist.

Steps:
1. Make sure feature/foundation-auth is merged into main first.
2. git checkout main && git pull && git checkout -b feature/vehicle-driver-registries
3. Copy this zip's Transit/ contents into your repo (adds the two files under
   frontend/src/components/)
4. git add . && git commit -m "Add Vehicles and Drivers registries"
5. Push and merge into main (2nd in sequence).
