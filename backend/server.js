const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();
const moment = require('moment');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./water_wars.db');

// Initialize database tables
const initDatabase = () => {
  db.serialize(() => {
    // Water entries table
    db.run(`
      CREATE TABLE IF NOT EXISTS water_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player TEXT NOT NULL,
        amount INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Daily winners table
    db.run(`
      CREATE TABLE IF NOT EXISTS daily_winners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player TEXT NOT NULL,
        date TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date)
      )
    `);

    console.log('Database initialized successfully');
  });
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
app.get('/api/today', (req, res) => {
  const today = getTodayDate();
  
  db.all(`
    SELECT player, SUM(amount) as total
    FROM water_entries 
    WHERE date = ?
    GROUP BY player
  `, [today], (err, rows) => {
    if (err) {
      console.error('Error fetching today\'s data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const result = { safari: 0, brielle: 0 };
    rows.forEach(row => {
      result[row.player] = row.total || 0;
    });

    res.json(result);
  });
});

// Add water intake
app.post('/api/water', (req, res) => {
  const { player, amount } = req.body;
  const today = getTodayDate();

  if (!player || !amount || !['safari', 'brielle'].includes(player) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid player or amount' });
  }

  db.run(`
    INSERT INTO water_entries (player, amount, date)
    VALUES (?, ?, ?)
  `, [player, amount, today], function(err) {
    if (err) {
      console.error('Error adding water entry:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      success: true, 
      id: this.lastID,
      message: `Added ${amount} oz for ${player}` 
    });
  });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const { days = 30 } = req.query;
  const { startDate, endDate } = getDateRange(parseInt(days));

  // Get total water intake and wins for each player
  db.all(`
    SELECT 
      player,
      SUM(amount) as total_water,
      COUNT(DISTINCT date) as total_days
    FROM water_entries 
    WHERE date BETWEEN ? AND ?
    GROUP BY player
  `, [startDate, endDate], (err, waterRows) => {
    if (err) {
      console.error('Error fetching water stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Get daily wins
    db.all(`
      SELECT player, COUNT(*) as wins
      FROM daily_winners 
      WHERE date BETWEEN ? AND ?
      GROUP BY player
    `, [startDate, endDate], (err, winRows) => {
      if (err) {
        console.error('Error fetching win stats:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const stats = {
        safari: { total: 0, wins: 0 },
        brielle: { total: 0, wins: 0 }
      };

      // Process water totals
      waterRows.forEach(row => {
        stats[row.player].total = row.total_water || 0;
      });

      // Process wins
      winRows.forEach(row => {
        stats[row.player].wins = row.wins || 0;
      });

      res.json(stats);
    });
  });
});

// Get water entries for a specific date range
app.get('/api/entries', (req, res) => {
  const { start_date, end_date, player } = req.query;
  let query = 'SELECT * FROM water_entries WHERE 1=1';
  let params = [];

  if (start_date) {
    query += ' AND date >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND date <= ?';
    params.push(end_date);
  }

  if (player) {
    query += ' AND player = ?';
    params.push(player);
  }

  query += ' ORDER BY date DESC, created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching entries:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(rows);
  });
});

// Get daily winners
app.get('/api/winners', (req, res) => {
  const { days = 30 } = req.query;
  const { startDate, endDate } = getDateRange(parseInt(days));

  db.all(`
    SELECT * FROM daily_winners 
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC
  `, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error('Error fetching winners:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(rows);
  });
});

// Calculate and store daily winner (should be called at midnight)
app.post('/api/calculate-winner', (req, res) => {
  const today = getTodayDate();

  // Get today's totals
  db.all(`
    SELECT player, SUM(amount) as total
    FROM water_entries 
    WHERE date = ?
    GROUP BY player
  `, [today], (err, rows) => {
    if (err) {
      console.error('Error calculating winner:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (rows.length === 0) {
      return res.json({ message: 'No entries for today' });
    }

    // Find the winner
    let winner = rows[0];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].total > winner.total) {
        winner = rows[i];
      }
    }

    // Store the winner
    db.run(`
      INSERT OR REPLACE INTO daily_winners (player, date, total_amount)
      VALUES (?, ?, ?)
    `, [winner.player, today, winner.total], function(err) {
      if (err) {
        console.error('Error storing winner:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ 
        winner: winner.player, 
        amount: winner.total,
        message: `${winner.player} won today with ${winner.total} oz!` 
      });
    });
  });
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
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Water Wars API...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = app;
