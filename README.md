# Tickets & Events — Frontend

A single-page web app for browsing events and managing tickets, built with **Angular 21**
(standalone components), **Angular Material**, and **Tailwind CSS**. It is the frontend for the
companion Kotlin/Ktor backend (`tickets-event-backend`).

## Tech stack

- **Angular 21** — standalone components, signals, new control-flow syntax (`@if` / `@for`), no NgModules
- **Angular Material 21** — Material 3 theme (azure-blue) with toolbar, cards, table, dialog, chips, snackbar
- **Tailwind CSS 3** — utility classes for layout (grid, flex, spacing, colors)
- **Prettier** — code formatting with `prettier-plugin-tailwindcss` for class sorting
- **TypeScript** with the Angular CLI (`@angular/build`)

## Features

| Route            | Page              | Description                                                     |
| ---------------- | ----------------- | --------------------------------------------------------------- |
| `/` → `/events`  | —                 | Redirects to the events list                                    |
| `/events`        | Events list       | Responsive grid of event cards (Material Card + Tailwind grid)   |
| `/events/:id`    | Event detail      | Full event info + **Buy Ticket** flow (Material dialog + form)   |
| `/tickets`       | My Tickets        | Material table of tickets with a **Cancel** action              |

- Loading spinners, empty states, and error states with retry on every data-driven page.
- Buy-ticket dialog collects buyer name/email (reactive form with validation) and calls the API.
- Snackbar notifications for purchase/cancel results.

## Project structure

```
src/app/
├── app.ts / app.config.ts / app.routes.ts   # root component, providers, routes
├── layout/
│   └── navbar/navbar.component.ts            # Material toolbar with routerLinks
├── features/
│   ├── events/
│   │   ├── events-list/events-list.component.ts
│   │   ├── event-detail/event-detail.component.ts
│   │   ├── event-detail/buy-ticket-dialog.component.ts
│   │   └── event-card/event-card.component.ts
│   └── tickets/
│       └── tickets-list/tickets-list.component.ts
└── shared/
    ├── models/event.model.ts                # Event / EventRequest interfaces
    ├── models/ticket.model.ts               # Ticket / TicketRequest interfaces
    ├── services/event.service.ts            # HttpClient wrapper for /api/events
    └── services/ticket.service.ts           # HttpClient wrapper for /api/tickets
```

## Getting started

Requires **Node.js 20+** and npm.

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:4200)
npm start        # alias for `ng serve`

# Production build (output in dist/)
npm run build
```

### Backend API

The app talks to the backend at the URL configured in `src/environments/environment.ts`
(`apiBaseUrl`, defaults to `http://localhost:8080`). Run the `tickets-event-backend` locally
and the events/tickets pages will populate. When the backend is unreachable, each page shows a
friendly error with a **Retry** button.

## Tailwind CSS

Tailwind is wired in through PostCSS:

- `tailwind.config.js` — scans `./src/**/*.{html,ts}` for classes.
- `postcss.config.js` — registers the `tailwindcss` and `autoprefixer` plugins.
- `src/styles.scss` — includes the `@tailwind base/components/utilities` directives.
  (The Angular Material `@use '@angular/material'` import is kept **above** the Tailwind
  directives because Sass requires all `@use` rules to come first.)

Use Tailwind utility classes directly in component templates alongside Angular Material components.

## Prettier

Formatting is configured via `.prettierrc` (single quotes, 100 char width, 2-space indent, etc.)
with `prettier-plugin-tailwindcss` to auto-sort Tailwind classes. `.prettierignore` excludes build
artifacts and lockfiles.

```bash
# Format all source files
npm run format

# Check formatting without writing changes
npm run format:check
```

## License

MIT
