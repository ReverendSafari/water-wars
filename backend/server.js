const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');
const moment = require('moment');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // For local development, you can use a service account file
  try {
    serviceAccount = require('./serviceAccountKey.json');
  } catch (error) {
    console.log('No service account file found. Make sure to set FIREBASE_SERVICE_ACCOUNT environment variable.');
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => moment().format('YYYY-MM-DD');

// Helper function to get date range for stats
const getDateRange = (days = 30) => {
  const endDate = moment();
  const startDate = moment().subtract(days, 'days');
  return { startDate: startDate.format('YYYY-MM-DD'), endDate: endDate.format('YYYY-MM-DD') };
};

// API Routes

// Get today's water intake for both players
app.get('/api/today', async (req, res) => {
  const today = getTodayDate();
  try {
    const snapshot = await db.collection('water_entries')
      .where('date', '==', today)
      .get();

    const result = { safari: 0, brielle: 0 };
    
    snapshot.forEach(doc => {
      const data = doc.data();
      result[data.player] += parseInt(data.amount) || 0;
    });

    res.json(result);
  } catch (err) {
    console.error("Error fetching today's data:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add water intake
app.post('/api/water', async (req, res) => {
  const { player, amount } = req.body;
  const today = getTodayDate();
  
  if (!player || !amount || !['safari', 'brielle'].includes(player) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid player or amount' });
  }
  
  try {
    const docRef = await db.collection('water_entries').add({
      player,
      amount: parseInt(amount),
      date: today,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true, 
      id: docRef.id,
      message: `Added ${amount} oz for ${player}` 
    });
  } catch (err) {
    console.error('Error adding water entry:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  const { days = 30 } = req.query;
  const { startDate, endDate } = getDateRange(parseInt(days));
  
  try {
    // Get water entries for date range
    const waterSnapshot = await db.collection('water_entries')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    // Get daily winners for date range
    const winnersSnapshot = await db.collection('daily_winners')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const stats = {
      safari: { total: 0, wins: 0 },
      brielle: { total: 0, wins: 0 }
    };

    // Process water totals
    waterSnapshot.forEach(doc => {
      const data = doc.data();
      stats[data.player].total += parseInt(data.amount) || 0;
    });

    // Process wins
    winnersSnapshot.forEach(doc => {
      const data = doc.data();
      stats[data.player].wins += 1;
    });

    res.json(stats);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get water entries for a specific date range
app.get('/api/entries', async (req, res) => {
  const { start_date, end_date, player } = req.query;
  
  try {
    let query = db.collection('water_entries');
    
    if (start_date) {
      query = query.where('date', '>=', start_date);
    }
    if (end_date) {
      query = query.where('date', '<=', end_date);
    }
    if (player) {
      query = query.where('player', '==', player);
    }

    const snapshot = await query.orderBy('date', 'desc').orderBy('timestamp', 'desc').get();
    
    const entries = [];
    snapshot.forEach(doc => {
      entries.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      });
    });

    res.json(entries);
  } catch (err) {
    console.error('Error fetching entries:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get daily winners
app.get('/api/winners', async (req, res) => {
  const { days = 30 } = req.query;
  const { startDate, endDate } = getDateRange(parseInt(days));
  
  try {
    const snapshot = await db.collection('daily_winners')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get();

    const winners = [];
    snapshot.forEach(doc => {
      winners.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      });
    });

    res.json(winners);
  } catch (err) {
    console.error('Error fetching winners:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Calculate and store daily winner (should be called at midnight)
app.post('/api/calculate-winner', async (req, res) => {
  const today = getTodayDate();
  
  try {
    // Get today's totals
    const snapshot = await db.collection('water_entries')
      .where('date', '==', today)
      .get();

    if (snapshot.empty) {
      return res.json({ message: 'No entries for today' });
    }

    // Calculate totals for each player
    const totals = { safari: 0, brielle: 0 };
    snapshot.forEach(doc => {
      const data = doc.data();
      totals[data.player] += parseInt(data.amount) || 0;
    });

    // Find the winner
    let winner = 'safari';
    if (totals.brielle > totals.safari) {
      winner = 'brielle';
    }

    // Store the winner (upsert)
    const winnerDoc = {
      player: winner,
      date: today,
      total_amount: totals[winner],
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // Check if winner already exists for today
    const existingWinner = await db.collection('daily_winners')
      .where('date', '==', today)
      .limit(1)
      .get();

    if (!existingWinner.empty) {
      // Update existing winner
      const docId = existingWinner.docs[0].id;
      await db.collection('daily_winners').doc(docId).update(winnerDoc);
    } else {
      // Create new winner
      await db.collection('daily_winners').add(winnerDoc);
    }

    res.json({ 
      winner: winner, 
      amount: totals[winner],
      message: `${winner} won today with ${totals[winner]} oz!` 
    });
  } catch (err) {
    console.error('Error calculating winner:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚰 Water Wars API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💧 Today's data: http://localhost:${PORT}/api/today`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Water Wars API...');
  try {
    await admin.app().delete();
    console.log('✅ Firebase app closed');
  } catch (err) {
    console.error('Error closing Firebase app:', err);
  }
  process.exit(0);
});

module.exports = app;
