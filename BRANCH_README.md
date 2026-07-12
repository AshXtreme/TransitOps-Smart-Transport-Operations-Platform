# Member 3 – Branch: feature/trips-maintenance-expenses  (MERGE 3rd, after M1 & M2)

Contents: TripsDashboard.tsx, MaintenanceLogs.tsx, ExpenseTracker.tsx

Depends only on M1 (Modal.tsx, AuthContext, db.ts, types.ts). Does not touch
any file owned by M2 or M4, so it can technically be branched right after M1,
but merge it 3rd to keep the sequence simple and match the app's tab order.

Steps:
1. Make sure feature/foundation-auth is merged into main first.
2. git checkout main && git pull && git checkout -b feature/trips-maintenance-expenses
3. Copy this zip's Transit/ contents into your repo (adds three files under
   frontend/src/components/)
4. git add . && git commit -m "Add Trip dispatch engine, Maintenance logs, Expense tracker"
5. Push and merge into main (3rd in sequence).
