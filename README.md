# SiteLedger Construction CRM & Operations Dashboard

SiteLedger is a frontend-only proof of concept for a construction business that wants a unified view of sales, customers, delivery, finance and customer communications. It uses fictional, interconnected records and local browser storage; it does not connect to a backend or external services.

## Features

- Executive dashboard with calculated KPIs, project health, pipeline, invoice ageing and attention panels.
- Lead and customer directories with search, filters, record drawers, create/edit actions and local lead-to-project conversion.
- Project register and project workspaces with schedule, financial, commercial, communication, document metadata and activity tabs.
- Task and milestone agenda/week view with local status updates.
- Quote and variation management, including recalculation of revised project contract values when approvals change.
- Sample invoice and supplier bill register with local payment simulation and ageing.
- Outlook-style local inbox, calendar agenda, read/flag/follow-up controls and an unsent local draft editor.
- Business reports with filters, data-driven charts and browser CSV downloads.
- Buildxact, Xero and Outlook integration cards with transparent simulated sync history.
- Workspace settings, configurable currency and a demo-data reset.

## Technology

- React 18 and JavaScript
- Vite
- React Router
- Lucide React
- Recharts
- Responsive custom CSS

## Requirements and commands

Install Node.js 18 or later, then run:

```sh
npm install
npm run dev
```

Vite prints the local development URL when it starts. Create a production build with:

```sh
npm run build
```

Preview the production build with `npm run preview`.

## Application routes

- `/dashboard`
- `/leads`
- `/customers`
- `/projects` and `/projects/:id`
- `/schedule`
- `/quotes`
- `/finance`
- `/communications`
- `/reports`
- `/integrations`
- `/settings`

The root path redirects to `/dashboard`.

## Mock data and persistence

`src/data/mockData.js` provides the initial fictional seed records. IDs connect customers, projects, tasks, quotes, variations, invoices, email conversations, calendar events and activity. Shared business calculations live in `src/utils/calculations.js`. The app stores demo records and preferences in `localStorage` under `siteledger-demo-v1`, and initializes seed data on first use. The reset action restores seed records while preserving the current company, user, currency and preference settings. If saved data cannot be parsed, the app starts with fresh seed data.

## Demo-only integration limitations

The Buildxact, Xero and Outlook cards always remain **DEMO MODE — NOT CONNECTED**. Simulated sync actions only record local timestamps/history and never call external services. Finance values are sample data, draft messages are not sent, and documents are metadata only; no file upload, backend, database, OAuth, authentication provider or live API integration is included.

## Future recommendations

Before using real business data, add a secured backend and database, define authorization and audit requirements, and validate the relevant vendor APIs and synchronization rules. Implement accounting and construction data reconciliation, conflict handling, idempotency, privacy controls, and observability before enabling any live integration.
