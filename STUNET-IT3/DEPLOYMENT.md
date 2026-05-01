# STUNET IT3 Deployment

This branch prepares `STUNET-IT3` so the frontend and backend can run together from one Node/Express deployment.

## What changed

- Backend entry point: `STUNET-IT3/backend/server.js`
- Backend package config: `STUNET-IT3/backend/package.json`
- Static frontend serving: Express serves files from `STUNET-IT3`
- Frontend API base patch: `STUNET-IT3/backend/scripts/patch-frontend-api.js` changes API calls from localhost to `/api` during `npm start`
- Added missing routes:
  - `backend/route/community.js`
  - `backend/route/competitions.js`
- Added correctly named model:
  - `backend/models/Competition.js`

## Local run

```bash
cd STUNET-IT3/backend
npm install
npm run dev
```

Open:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

## Required environment variables

Set these on your hosting platform:

```text
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<long random secret>
NODE_ENV=production
CLIENT_URL=*
```

Email OTP is already coded through Nodemailer. For real OTP email delivery, also add the email provider variables used by `utils/sendEmail.js`.

## Render deployment

Use this setup:

```text
Root Directory: STUNET-IT3/backend
Build Command: npm install
Start Command: npm start
Health Check Path: /health
```

Then add the environment variables listed above in the Render dashboard.

## Important note

The deployment branch is `deploy-stunet-it3`. Merge this branch into `Frontend-STUNET` or `main` after testing.
