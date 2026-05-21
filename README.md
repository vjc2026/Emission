# EmissionSense — Setup Guide

Short guide to install, configure, and run the EmissionSense project locally or for delivery to a client.

## Overview
- Frontend: Next.js app in the project root.
- Backend / API: External Express server (removed from this repository). See the dedicated backend repo: https://github.com/JCV0827/emissionserver

## Prerequisites
- Node.js >= 18
- npm (or yarn)
- MySQL database (or compatible)

## Install
1. Clone the repository and open the project folder.
2. Install root dependencies:

```
npm install
```

3. Backend (separate repository):

- This repository no longer contains a runnable `api/server.js`. The backend is maintained in a separate repository: https://github.com/JCV0827/emissionserver
- To run the backend locally, clone the backend repo and follow its README (install dependencies and set the backend `.env`).

## Environment variables
Create a `.env` in the project root (or supply environment variables via your deployment). Use `.env.example` as a template. Required variables used by the API include:

- `JWT_SECRET` — secret for signing JWT tokens
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` — MySQL connection
- `EMAIL_USER`, `EMAIL_PASS` — SMTP credentials used by Nodemailer
- `ELECTRICITYMAPS_API_KEY` — optional live carbon factor provider
- `NODE_ENV` — `development` or `production`
-- `PORT` — port used by the backend (defaults vary; see the backend README)

See the backend repository for API implementation details and `api/dynamicCarbonProvider.js` in this repo for optional live carbon factor support.

## Running locally


- To run the backend locally, clone and run the external backend repository:

```
git clone https://github.com/JCV0827/emissionserver.git
cd emissionserver
npm install
npm run start
```

Or follow the backend repo's instructions for development and production.

- Start the frontend (Next.js):

```
npm run dev
```

Open the app at http://localhost:3000 (Next.js default). The API will run on the port set in `.env` (default 5000).

## Build & Production

1. Build the frontend:

```
npm run build
```

2. Start Next.js production server:

```
npm start
```

3. Ensure the API is started in production mode (set `NODE_ENV=production` and provide production DB and email credentials). The API serves uploads from `/data/uploads` in production by default.

## Database
This project expects certain tables (users, user_devices, user_history, cpus, gpus, project_members, notifications). Provide a MySQL instance with the expected schema before running the API. If you prefer, deliver a SQL dump to the client with the schema and seed data.

## File locations of interest
- Backend repository: https://github.com/JCV0827/emissionserver
- Dynamic carbon provider (this repo): [api/dynamicCarbonProvider.js](api/dynamicCarbonProvider.js#L1)
- Frontend entry: `src/pages/index.tsx`

## Static uploads
- Uploads are handled by the backend. The original local path was `api/uploads` during development and `/data/uploads` in production; since `api/server.js` is no longer part of this repo, ensure the backend repo you deploy exposes the uploads endpoint and storage location. Update frontend image URLs to point to the backend host.

## Delivering to a client
- Provide the following to the client:
  - Project source (repository zip).
  - `.env.example` with instructions to fill values.
  - MySQL schema SQL dump and migration instructions.
  - Backend repository and deployment instructions: https://github.com/JCV0827/emissionserver
  - Node version recommendation (>=18) and `npm install` / `npm run build` steps.
  - Optionally include a Dockerfile or Docker image for simpler deployment.

## Security notes
- Keep `JWT_SECRET` and email credentials secret — do not commit them.
- Use strong passwords and limit DB access by IP.

## Troubleshooting
- If images fail to upload, check the `uploads` directory permissions and the `NODE_ENV` setting.
- If DB connection fails, verify `DB_*` env vars and that MySQL accepts connections from the server host.

## Contacts & Next steps
If you want, I can also:
- Create a `Dockerfile` and `docker-compose.yml` for production packaging.
- Generate a SQL schema dump template.This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
