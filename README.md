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

## Deployment

The app is deployed to **Amazon S3** with [`@jefiozie/ngx-aws-deploy`](https://github.com/Jefiozie/ngx-aws-deploy),
fronted by **CloudFront** with Origin Access Control so the bucket stays private.

### Configuration

Deployment settings are read from environment variables, never from `angular.json`. Put them in a
`.env` file at the repo root (it is gitignored):

```bash
NG_DEPLOY_AWS_ACCESS_KEY_ID=<access key id>
NG_DEPLOY_AWS_SECRET_ACCESS_KEY=<secret access key>
NG_DEPLOY_AWS_BUCKET=<bucket name>
NG_DEPLOY_AWS_REGION=<region>

# Optional
NG_DEPLOY_AWS_SUB_FOLDER=<prefix inside the bucket>
NG_DEPLOY_AWS_CF_DISTRIBUTION_ID=<CloudFront distribution id>
NG_DEPLOY_AWS_OAC_ID=<CloudFront origin access control id>
```

`npm run deploy` loads `.env` via `node --env-file-if-exists=.env`, so a variable exported in your
shell still takes precedence and the script works without a `.env` file.

### Deploy

```bash
npm run deploy              # build + upload + CloudFront invalidation
npm run deploy -- --no-build   # upload the existing dist/ without rebuilding
```

This builds the app, uploads `dist/tickets-event-frontend/browser` to the bucket, and invalidates
`/*` on the CloudFront distribution when `NG_DEPLOY_AWS_CF_DISTRIBUTION_ID` is set.

### CloudFront setup

`tools/aws-deploy/setup-cloudfront.js` creates the origin access control, the distribution
(default root object `index.html`, 403/404 → `/es/index.html` with a 200, HTTPS redirect) and the
bucket policy scoped to that distribution. It is idempotent, so it is safe to re-run.

```bash
# Show the plan without touching AWS
node --env-file-if-exists=.env tools/aws-deploy/setup-cloudfront.js --dry-run

# Create or update the distribution and bucket policy
node --env-file-if-exists=.env tools/aws-deploy/setup-cloudfront.js
```

It prints the distribution id to add to `.env` as `NG_DEPLOY_AWS_CF_DISTRIBUTION_ID`.

### Required IAM permissions

The deploying user needs:

| Action                                                                  | Purpose                          |
| ----------------------------------------------------------------------- | -------------------------------- |
| `s3:ListBucket`                                                         | Verify the bucket exists         |
| `s3:PutObject`, `s3:DeleteObject`                                       | Upload and replace objects       |
| `s3:GetBucketPolicy`, `s3:PutBucketPolicy`                              | Apply the CloudFront bucket policy |
| `cloudfront:CreateDistribution`, `cloudfront:GetDistribution`, `cloudfront:ListDistributions` | Create and inspect the distribution |
| `cloudfront:UpdateDistribution`                                         | Attach the router function       |
| `cloudfront:CreateInvalidation`                                         | Invalidate the cache on deploy   |
| `cloudfront:CreateOriginAccessControl`                                  | Create the OAC                   |
| `cloudfront:CreateFunction`, `cloudfront:PublishFunction`, `cloudfront:GetFunction`, `cloudfront:ListFunctions` | SPA/locale router function |

Without `cloudfront:CreateInvalidation` the upload still succeeds but the deploy exits non-zero at
the invalidation step.

### How the deploy builder works

`angular.json` points the `deploy` target at `@local/aws-deploy:deploy`, a thin wrapper in
`tools/aws-deploy` registered as a `file:` devDependency. It exists because ngx-aws-deploy's own
builder reads `buildResult.outputPath`, which Angular 21's `@build:application` no longer returns —
without the wrapper it would glob the whole project root instead of `dist`. The wrapper resolves the
browser output path, then delegates all S3 and CloudFront work to ngx-aws-deploy's `Uploader` and
`CloudFront` classes.

Two behaviours worth knowing:

- **Root redirect.** The localized build emits only `<locale>/index.html`, so the wrapper writes a
  root `index.html` that redirects to `/es/`.
- **Locale directory indexes.** Each locale index is also uploaded under a trailing-slash key
  (`es/`, `en/`), because CloudFront's `DefaultRootObject` only applies to `/`.

The uploader never deletes superseded files, so old hashed bundles accumulate in the bucket.

## License

MIT
