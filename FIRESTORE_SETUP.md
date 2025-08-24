# Firestore Migration Guide

## Overview
This guide will help you migrate your Water Wars app from PostgreSQL to Google Cloud Firestore for free tier hosting.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it something like "water-wars-app"
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location close to your users
5. Click "Done"

## Step 3: Create Service Account

1. In Firebase Console, go to Project Settings (gear icon)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. **Keep this file secure** - it contains your database credentials

## Step 4: Set Up Environment Variables

### Option A: Local Development
1. Copy the downloaded service account JSON to `backend/serviceAccountKey.json`
2. Create `.env` file in the backend directory:

```bash
FIREBASE_PROJECT_ID=your-firebase-project-id
PORT=3001
NODE_ENV=development
```

### Option B: Production (Google Cloud)
1. In Google Cloud Console, go to your project
2. Set these environment variables:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_SERVICE_ACCOUNT`: The entire JSON content of your service account file

## Step 5: Install Dependencies

```bash
cd water-wars/backend
npm install
```

## Step 6: Test Locally

```bash
npm run dev
```

Test the endpoints:
- `GET http://localhost:3001/api/health`
- `GET http://localhost:3001/api/today`
- `POST http://localhost:3001/api/water` (with body: `{"player": "safari", "amount": 16}`)

## Step 7: Deploy to Google Cloud

### Option A: App Engine (Recommended for free tier)

1. Create `app.yaml` in the backend directory:

```yaml
runtime: nodejs18
env: standard

env_variables:
  FIREBASE_PROJECT_ID: your-firebase-project-id
  NODE_ENV: production

automatic_scaling:
  target_cpu_utilization: 0.6
  min_instances: 0
  max_instances: 1
```

2. Deploy:
```bash
gcloud app deploy
```

### Option B: Cloud Run (Even better for free tier)

1. Create `Dockerfile` in the backend directory:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

2. Deploy:
```bash
gcloud run deploy water-wars-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_PROJECT_ID=your-project-id
```

## Step 8: Update Frontend

Update your frontend's API base URL to point to your new deployment:

```javascript
// In your frontend components, update the API URL
const API_BASE_URL = 'https://your-app-id.appspot.com'; // App Engine
// or
const API_BASE_URL = 'https://water-wars-api-xxxxx-uc.a.run.app'; // Cloud Run
```

## Step 9: Security Rules (Optional but Recommended)

In Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to water_entries and daily_winners
    match /water_entries/{document} {
      allow read, write: if true; // For now, allow all access
    }
    match /daily_winners/{document} {
      allow read, write: if true; // For now, allow all access
    }
  }
}
```

## Data Migration (If you have existing data)

If you have existing PostgreSQL data, you can create a migration script:

```javascript
// migration.js
const admin = require('firebase-admin');
const { Pool } = require('pg');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
  projectId: 'your-project-id'
});

const db = admin.firestore();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrateData() {
  // Migrate water entries
  const { rows: entries } = await pool.query('SELECT * FROM water_entries');
  for (const entry of entries) {
    await db.collection('water_entries').add({
      player: entry.player,
      amount: entry.amount,
      date: entry.date,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // Migrate daily winners
  const { rows: winners } = await pool.query('SELECT * FROM daily_winners');
  for (const winner of winners) {
    await db.collection('daily_winners').add({
      player: winner.player,
      date: winner.date,
      total_amount: winner.total_amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrateData().catch(console.error);
```

## Cost Estimation

With 2 users, you'll likely stay within free tier limits:
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **App Engine**: 28 instance hours/day
- **Cloud Run**: 2M requests/month

Estimated monthly cost: **$0-5** (vs $25+ on Render)

## Troubleshooting

### Common Issues:

1. **"No service account found"**: Make sure `serviceAccountKey.json` exists or `FIREBASE_SERVICE_ACCOUNT` env var is set
2. **"Permission denied"**: Check that your service account has Firestore permissions
3. **"Project not found"**: Verify `FIREBASE_PROJECT_ID` is correct

### Testing:

```bash
# Test health endpoint
curl https://your-app-url/api/health

# Test adding water
curl -X POST https://your-app-url/api/water \
  -H "Content-Type: application/json" \
  -d '{"player": "safari", "amount": 16}'

# Test getting today's data
curl https://your-app-url/api/today
```

## Next Steps

1. Deploy your backend
2. Update frontend API URLs
3. Test all functionality
4. Set up monitoring in Google Cloud Console
5. Consider adding authentication later

Your app should now be running on Google Cloud's free tier! 🎉
