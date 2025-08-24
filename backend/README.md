# Water Wars Backend

A simple Express.js API for the Water Wars app using Firebase Firestore.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy your Firebase service account JSON to `serviceAccountKey.json`
   - Or set `FIREBASE_SERVICE_ACCOUNT` environment variable

3. Run locally:
```bash
npm run dev
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/today` - Get today's water intake
- `POST /api/water` - Add water entry
- `GET /api/stats` - Get player statistics
- `GET /api/entries` - Get water entries
- `GET /api/winners` - Get daily winners
- `POST /api/calculate-winner` - Calculate daily winner

## Environment Variables

- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (optional if using file)
- `PORT` - Server port (default: 8080)
