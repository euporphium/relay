# Architecture

This document explains how the system fits together and why. It is intentionally small and does not restate domain rules covered in:
- `docs/routing.md`
- `docs/auth.md`
- `docs/database.md`
- `docs/testing.md`
- `docs/styling.md`

## System Overview

Relay is a full-stack web app built around a single vertical slice: authenticated task management with scheduling and resolution logic. The codebase is organized to keep domain logic isolated, server access centralized, and client UI thin and declarative. The system favors explicit boundaries and predictable data flow over implicit global state.

## System Boundaries

- **Client UI**: Renders routes, forms, and views. The client does not access the database directly and does not own auth state; it consumes session context and server outputs.
- **Server Functions**: The only path to persistent data. Server functions validate inputs, enforce auth, and execute domain-aware database operations.
- **Domain Modules**: Pure, framework-agnostic logic (calendar, task rules). These functions are shared across client and server to keep rules consistent.
- **Shared Contracts**: DTO types and validation schemas shared by client and server. This layer depends on domain types but never on server or database modules.
- **Database**: Persistent storage accessed only through the server layer.

## Client vs Server Responsibilities

**Client**
- Presents routes and forms.
- Triggers server functions for reads and mutations.
- Uses shared schemas for validation to match server expectations.
- Handles user-local concerns (e.g., presentation and client-derived defaults).

**Server**
- Owns all data access and mutations.
- Enforces authentication and user scoping for all app data.
- Applies domain logic when changing state (e.g., task resolution that may create follow-up tasks).

## How the Pieces Interact

- **Routing + Auth**: The router provides the session context used by client routes. Auth gating occurs at route boundaries, while server functions rely on auth middleware for enforcement. This creates a layered defense: UI protects navigation and server protects data.
- **Routing + Data**: Route loaders call server functions for data. Mutations use server functions and then refresh route data via navigation or invalidation.
- **Domain + Server**: Server functions are the integration point where domain rules meet persistence. This keeps business logic in pure modules and persistence logic in one place.
- **Domain + Client**: Shared schemas are used to validate user input and ensure client expectations match server validation.
- **Styling + UI**: Styling is applied at the component boundary and should not leak into domain or server layers.
- **Testing + Domain**: Tests focus on domain logic and validation, which are the most stable and reusable parts of the system.

## Dominant Architectural Patterns

- **Server Function Boundary**: All side-effects and persistence are behind server functions. This is the primary architectural seam.
- **Shared Validation/Domain Rules**: The same schemas and domain helpers are used across client and server to avoid drift.
- **Route-Centric UI**: Screens are composed via routes and loaders, with data flow tied to navigation and search state.
- **Auth-Centric Data Ownership**: User identity is the root of data access; all queries and mutations are scoped to the authenticated user.

## Core Architectural Decisions

- **Single-source domain logic**: Domain rules live in dedicated modules and are reused across layers.
- **Server-only persistence**: Database access is restricted to server functions.
- **Layered auth enforcement**: Routes guard navigation; server middleware enforces access at the data boundary.
- **Route-driven data flow**: Data is fetched and refreshed via route loaders and router invalidation/navigations.

## Invariants

These must always hold:
- Client code never accesses the database directly.
- Every data mutation goes through a server function.
- Auth is enforced in server functions for any user-scoped data.
- Domain rules and validation are shared, not reimplemented per layer.
- Route data depends only on validated inputs and server responses.

## Explicit Domain Boundaries

- **Routing**: Owns navigation structure and loader orchestration.
- **Auth**: Owns session resolution and authorization checks.
- **Database**: Owns schema definitions and persistence details.
- **Testing**: Owns how correctness is validated.
- **Styling**: Owns UI presentation and theming.

## Not Covered

- Framework how-tos or API usage.
- Detailed auth, routing, database, testing, or styling rules (see their domain docs).
- Deployment, CI/CD, or infrastructure.
- Product requirements or UX guidelines.
