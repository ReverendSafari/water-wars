import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Droplets, Star } from 'lucide-react';
import './Stats.css';

const Stats = ({ stats }) => {
  const safariGallons = (stats.safari.total / 128).toFixed(1);
  const brielleGallons = (stats.brielle.total / 128).toFixed(1);

  return (
    <div className="stats-section">
      <div className="stats-header">
        <h2>Battle Statistics</h2>
        <Trophy className="stats-icon" />
      </div>

      <div className="stats-grid">
        <motion.div 
          className="stat-card safari-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="stat-header">
            <div className="player-avatar safari-avatar">
              <Droplets className="avatar-icon" />
            </div>
            <h3>Safari</h3>
          </div>

          <div className="stat-content">
            <div className="stat-item">
              <div className="stat-label">Total Water</div>
              <div className="stat-value">
                <span className="amount-oz">{stats.safari.total} oz</span>
                <span className="amount-gallons">({safariGallons} gal)</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Days Won</div>
              <div className="stat-value wins">
                <Star className="star-icon" />
                <span>{stats.safari.wins}</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Average/Day</div>
              <div className="stat-value">
                {stats.safari.wins > 0 ? Math.round(stats.safari.total / stats.safari.wins) : 0} oz
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card brielle-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <div className="stat-header">
            <div className="player-avatar brielle-avatar">
              <Droplets className="avatar-icon" />
            </div>
            <h3>Brielle</h3>
          </div>

          <div className="stat-content">
            <div className="stat-item">
              <div className="stat-label">Total Water</div>
              <div className="stat-value">
                <span className="amount-oz">{stats.brielle.total} oz</span>
                <span className="amount-gallons">({brielleGallons} gal)</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Days Won</div>
              <div className="stat-value wins">
                <Star className="star-icon" />
                <span>{stats.brielle.wins}</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Average/Day</div>
              <div className="stat-value">
                {stats.brielle.wins > 0 ? Math.round(stats.brielle.total / stats.brielle.wins) : 0} oz
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card overall-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="stat-header">
            <h3>Overall</h3>
          </div>

          <div className="stat-content">
            <div className="stat-item">
              <div className="stat-label">Total Combined</div>
              <div className="stat-value">
                <span className="amount-oz">{stats.safari.total + stats.brielle.total} oz</span>
                <span className="amount-gallons">({((stats.safari.total + stats.brielle.total) / 128).toFixed(1)} gal)</span>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Total Days</div>
              <div className="stat-value">
                {stats.safari.wins + stats.brielle.wins} days
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Leader</div>
              <div className="stat-value leader">
                {stats.safari.wins > stats.brielle.wins ? (
                  <span className="safari-leader">Safari 🏆</span>
                ) : stats.brielle.wins > stats.safari.wins ? (
                  <span className="brielle-leader">Brielle 🏆</span>
                ) : (
                  <span className="tie">Tied 🤝</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="stats-footer">
        <div className="motivation-text">
          💧 Keep hydrating! Every drop counts in the Water Wars! 💧
        </div>
      </div>
    </div>
  );
};

export default Stats;
