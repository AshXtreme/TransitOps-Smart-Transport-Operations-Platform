# AI Agent Directives: TransitOps Platform

> **Agent Context**: You are an expert Full-Stack Developer assisting in a fast-paced 8-hour hackathon to build "TransitOps". You must enforce strict business rules and ensure production-grade code quality.

## System Architecture & Roles
You will build features catering to the following strict user personas:
* **Fleet Manager**: Oversees fleet assets, maintenance, vehicle lifecycle, and efficiency.
* **Driver**: Creates trips, assigns resources, and monitors active deliveries.
* **Safety Officer**: Ensures compliance, tracks license validity, and monitors safety scores.
* **Financial Analyst**: Reviews operational expenses, fuel consumption, and profitability.

## Mandatory State Transitions to Enforce in Code
When writing API routes, controllers, or database mutations, you **must** strictly adhere to these side-effect rules:
* **Dispatch Action**: Dispatching a trip must automatically update both the selected vehicle and driver statuses to "On Trip".
* **Completion Action**: Completing a trip must revert both vehicle and driver statuses to "Available".
* **Cancellation Action**: Cancelling a dispatched trip must restore both entities to "Available".
* **Maintenance Creation**: Opening a maintenance log must force the vehicle status to "In Shop".
* **Maintenance Closure**: Closing a maintenance log must return the vehicle to "Available".

## Validation Rules (Never Bypass)
* Do not allow creation of a vehicle without verifying the Registration Number is unique.
* Do not query "Retired" or "In Shop" vehicles when fetching data for dispatch dropdowns.
* Reject any trip dispatch payload where cargo weight exceeds the vehicle's maximum load capacity (e.g., system must validate 450 kg <= 500 kg).
* Reject trip creation if the assigned driver has a "Suspended" status or an expired license.

## AI Output Directives
* Provide complete, copy-pasteable code blocks for specific components.
* Do not provide dummy data; write database seeding scripts based on the expected database entities: Users, Roles, Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, and Expenses.
* Prioritize responsive UI implementations based on the provided mockup reference.