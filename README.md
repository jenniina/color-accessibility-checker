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

## Deploy (Google Cloud Run)

This project deploys cleanly to **Cloud Run** and runs the Express SSR server.

### Prereqs

- Google Cloud project
- `gcloud` installed + authenticated (`gcloud auth login`)
- APIs enabled:

```sh
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

### Option A: Deploy from source (no Docker)

Cloud Run can build a container for you using Google buildpacks.

From the `accessible-colors/` folder:

PowerShell example:

```powershell
# Set these
$PROJECT_ID = "YOUR_PROJECT_ID"
$REGION = "europe-north1"
$SERVICE = "accessible-colors"

gcloud run deploy $SERVICE `
  --project $PROJECT_ID `
  --region $REGION `
  --source . `
  --allow-unauthenticated `
  --set-env-vars NODE_ENV=production
```

Notes:

- Cloud Run provides `PORT` (typically `8080`). The server reads `process.env.PORT`.
- The build will run `npm install` and (if present) `npm run build`, then start via `npm start`.

### Option B: Build + deploy with a Dockerfile

From the `accessible-colors/` folder (Docker build context):

PowerShell example:

```powershell
# Set these
$PROJECT_ID = "YOUR_PROJECT_ID"
$REGION = "europe-north1"   # Finland
$SERVICE = "accessible-colors"

# Create an Artifact Registry repo once (pick a name you like)
gcloud artifacts repositories create webapp --repository-format=docker --location=$REGION --project=$PROJECT_ID

# Build and push the container
gcloud builds submit --project=$PROJECT_ID --region=$REGION --tag "$REGION-docker.pkg.dev/$PROJECT_ID/webapp/$SERVICE:latest"

# Deploy to Cloud Run
gcloud run deploy $SERVICE `
  --project $PROJECT_ID `
  --region $REGION `
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/webapp/$SERVICE:latest" `
  --allow-unauthenticated `
  --set-env-vars NODE_ENV=production
```

### Secrets / config

Set sensitive values using Secret Manager. A clean approach is to use a dedicated service account.

PowerShell example (create SA + secret + grant access + bind to Cloud Run):

```powershell
$SA = "accessible-colors-runner"

gcloud iam service-accounts create $SA --project $PROJECT_ID

"YOUR_VALUE" | gcloud secrets create JWT_SECRET --project $PROJECT_ID --data-file=-

gcloud secrets add-iam-policy-binding JWT_SECRET `
  --project $PROJECT_ID `
  --member "serviceAccount:$SA@$PROJECT_ID.iam.gserviceaccount.com" `
  --role "roles/secretmanager.secretAccessor"

gcloud run services update $SERVICE `
  --project $PROJECT_ID `
  --region $REGION `
  --service-account "$SA@$PROJECT_ID.iam.gserviceaccount.com" `
  --set-secrets JWT_SECRET=JWT_SECRET:latest
```

Do the same for `MONGODB_URI`, `NODEMAILER_PASSWORD`, etc. Non-sensitive values can be set with `--set-env-vars`.

### MongoDB Atlas (network access)

MongoDB Atlas uses an **IP access list**. Cloud Run egress IPs are **not stable** by default, so Atlas connections can fail unless you:

Option 1 (recommended): give Cloud Run a **static egress IP** (VPC Connector + Cloud NAT) and allowlist that IP in Atlas.

PowerShell example:

```powershell
# One-time networking setup (creates a static egress IP)
$VPC = "cr-vpc"
$CONNECTOR = "cr-connector"
$ROUTER = "cr-router"
$NAT = "cr-nat"
$NAT_IP = "cr-nat-ip"

gcloud compute networks create $VPC --project $PROJECT_ID --subnet-mode=custom

gcloud compute routers create $ROUTER `
  --project $PROJECT_ID `
  --region $REGION `
  --network $VPC

gcloud compute addresses create $NAT_IP `
  --project $PROJECT_ID `
  --region $REGION

gcloud compute routers nats create $NAT `
  --project $PROJECT_ID `
  --router $ROUTER `
  --region $REGION `
  --nat-external-ip-pool $NAT_IP `
  --nat-all-subnet-ip-ranges

gcloud compute networks vpc-access connectors create $CONNECTOR `
  --project $PROJECT_ID `
  --region $REGION `
  --network $VPC `
  --range "10.8.0.0/28"

# Attach Cloud Run to the connector and route egress through it
gcloud run services update $SERVICE `
  --project $PROJECT_ID `
  --region $REGION `
  --vpc-connector $CONNECTOR `
  --vpc-egress all-traffic

# Get the static egress IP and add it to Atlas IP access list
$EGRESS_IP = (gcloud compute addresses describe $NAT_IP --project $PROJECT_ID --region $REGION --format="value(address)")
Write-Host "Allowlist this IP in Atlas: $EGRESS_IP"
```

Then in Atlas: **Security → Network Access → IP Access List → Add IP Address** and add the printed `$EGRESS_IP`.

Option 2 (not recommended): allowlist `0.0.0.0/0` in Atlas (works, but exposes your DB to the internet).

### Custom domain (colors.jenniina.fi)

To use `https://colors.jenniina.fi` with Cloud Run, map a **custom domain** and update your DNS.

1. In Google Cloud Console: Cloud Run → your service → **Custom domains** → Add mapping
   - Domain: `colors.jenniina.fi`
   - Region: `$REGION`
2. Follow the verification step (Google will ask for a TXT record if your domain isn’t verified).
3. Add the DNS records it shows at your DNS provider.
   - For a subdomain like `colors.jenniina.fi`, it is typically a **CNAME**:
     - Name/Host: `colors`
     - Target: `ghs.googlehosted.com.`
4. Wait for DNS + certificate provisioning (can take minutes to a couple hours).

After the domain is live, set these Cloud Run env vars (recommended):

- `CORS_ORIGIN=https://colors.jenniina.fi`
- `SITE_URL=https://colors.jenniina.fi`
- `BASE_URI=https://colors.jenniina.fi`

## License

This project is proprietary. See [LICENSE](LICENSE).
