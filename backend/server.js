const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const moment = require('moment');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize database tables
const initDatabase = async () => {
  try {
    // Water entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS water_entries (
        id SERIAL PRIMARY KEY,
        player TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    // Daily winners table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_winners (
        id SERIAL PRIMARY KEY,
        player TEXT NOT NULL,
        date TEXT NOT NULL UNIQUE,
        total_amount INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Initialize database on startup
initDatabase();

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
    const { rows } = await pool.query(`
      SELECT player, SUM(amount) as total
      FROM water_entries 
      WHERE date = $1
      GROUP BY player
    `, [today]);
    const result = { safari: 0, brielle: 0 };
    rows.forEach(row => {
      result[row.player] = parseInt(row.total) || 0;
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
    const result = await pool.query(`
      INSERT INTO water_entries (player, amount, date)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [player, amount, today]);
    res.json({ 
      success: true, 
      id: result.rows[0].id,
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
    // Get total water intake and wins for each player
    const { rows: waterRows } = await pool.query(`
      SELECT 
        player,
        SUM(amount) as total_water,
        COUNT(DISTINCT date) as total_days
      FROM water_entries 
      WHERE date BETWEEN $1 AND $2
      GROUP BY player
    `, [startDate, endDate]);
    // Get daily wins
    const { rows: winRows } = await pool.query(`
      SELECT player, COUNT(*) as wins
      FROM daily_winners 
      WHERE date BETWEEN $1 AND $2
      GROUP BY player
    `, [startDate, endDate]);
    const stats = {
      safari: { total: 0, wins: 0 },
      brielle: { total: 0, wins: 0 }
    };
    // Process water totals
    waterRows.forEach(row => {
      stats[row.player].total = parseInt(row.total_water) || 0;
    });
    // Process wins
    winRows.forEach(row => {
      stats[row.player].wins = parseInt(row.wins) || 0;
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
  let query = 'SELECT * FROM water_entries WHERE 1=1';
  let params = [];
  let idx = 1;
  if (start_date) {
    query += ` AND date >= $${idx++}`;
    params.push(start_date);
  }
  if (end_date) {
    query += ` AND date <= $${idx++}`;
    params.push(end_date);
  }
  if (player) {
    query += ` AND player = $${idx++}`;
    params.push(player);
  }
  query += ' ORDER BY date DESC, created_at DESC';
  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
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
    const { rows } = await pool.query(`
      SELECT * FROM daily_winners 
      WHERE date BETWEEN $1 AND $2
      ORDER BY date DESC
    `, [startDate, endDate]);
    res.json(rows);
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
    const { rows } = await pool.query(`
      SELECT player, SUM(amount) as total
      FROM water_entries 
      WHERE date = $1
      GROUP BY player
    `, [today]);
    if (rows.length === 0) {
      return res.json({ message: 'No entries for today' });
    }
    // Find the winner
    let winner = rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (parseInt(rows[i].total) > parseInt(winner.total)) {
        winner = rows[i];
      }
    }
    // Store the winner
    await pool.query(`
      INSERT INTO daily_winners (player, date, total_amount)
      VALUES ($1, $2, $3)
      ON CONFLICT (date) DO UPDATE SET player = EXCLUDED.player, total_amount = EXCLUDED.total_amount
    `, [winner.player, today, winner.total]);
    res.json({ 
      winner: winner.player, 
      amount: winner.total,
      message: `${winner.player} won today with ${winner.total} oz!` 
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
    await pool.end();
    console.log('✅ PostgreSQL pool closed');
  } catch (err) {
    console.error('Error closing PostgreSQL pool:', err);
  }
  process.exit(0);
});

module.exports = app;
