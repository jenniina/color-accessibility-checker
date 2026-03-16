# Accessible Colors

React + Vite + TypeScript app for testing color contrast/accessibility, with an Express SSR backend.

## Structure

- `frontend/` — React/Vite client + SSR entry (`src/entry-client.tsx`, `src/entry-server.tsx`)
- `backend/` — Express server that:
  - serves `/api/*`
  - does SSR in dev via Vite middleware
  - serves built assets + SSR bundle in production (`backend/dist/frontend`, `backend/dist/ssr`)

## Requirements

- Node.js (recommended: latest LTS)
- npm
- (Optional) MongoDB connection string if you want auth/persistence features

## Install

From the `accessible-colors/` folder:

```sh
npm install
```

This repo uses **npm workspaces** (`frontend` + `backend`), so dependencies are installed once at the root and hoisted into a single `accessible-colors/node_modules`.

## Development

### 1) SSR app (recommended)

Run the backend dev server (it will use Vite middleware for the frontend):

```sh
npm run dev
```

- SSR server: `http://localhost:5179` (or `PORT`)
- API base: `http://localhost:5179/api`

### 2) Frontend-only (no SSR)

```sh
npm -w frontend run dev
```

- Vite dev server: `http://localhost:5173` (or whatever Vite chooses)
- This mode does **not** provide SSR HTML.

## Production build

Build everything from the project root (writes output into `backend/dist/...`):

```sh
npm run build
```

Equivalent manual steps (frontend first, then backend):

```sh
npm -w frontend run build
npm -w backend run build
```

Run the server:

```sh
npm run start
```

## Environment variables

Backend reads these from environment (e.g. a `backend/.env` file):

- `PORT` — server port (default: `5179`)
- `NODE_ENV` — set to `production` for production behavior
- `CORS_ORIGIN` — allowed origin for API requests
- `MONGODB_URI` — Mongo connection string (if unset, `/api` will respond with 503 for DB-backed features)
- `JWT_SECRET` — required in production (dev has an insecure fallback)
- `BASE_URI` — used to generate verification/reset links in emails (typically your backend base URL)
- `SITE_URL` — used in email templates for links back to the site
- `NODEMAILER_HOST`, `NODEMAILER_PORT`, `NODEMAILER_USER`, `NODEMAILER_PASSWORD` — email transport settings

## License

This project is proprietary. See [LICENSE](LICENSE).
