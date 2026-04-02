# Contrast At A Glance

React + Vite + TypeScript app for testing color contrast/accessibility, with an Express SSR backend.

## Structure

- `frontend/` contains the React + Vite app, including SSR entry files such as `src/entry-client.tsx` and `src/entry-server.tsx`
- `backend/` contains the Express server, which:
  - serves `/api/*`
  - performs SSR in development through Vite middleware
  - serves built frontend assets in production
  - uses the SSR bundle in production when available

## Requirements

- Node.js (recommended: latest LTS)
- npm
- MongoDB connection string if you want auth/persistence features

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
- `CORS_ORIGIN=https://colors.jenniina.fi`
- `SITE_URL=https://colors.jenniina.fi`
- `BASE_URI=https://colors.jenniina.fi`

## License

This project is proprietary. See [LICENSE](LICENSE).
