import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Plus, Trophy, Calendar, Droplets } from 'lucide-react';
import axios from 'axios';
import WaterJug from './WaterJug';
import AddWaterModal from './AddWaterModal';
import Stats from './Stats';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [todayData, setTodayData] = useState({ safari: 0, brielle: 0 });
  const [stats, setStats] = useState({ safari: { total: 0, wins: 0 }, brielle: { total: 0, wins: 0 } });
  const [showAddModal, setShowAddModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  // API base URL - update this for production
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Fetch today's data from API
  const fetchTodayData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/today`);
      setTodayData(response.data);
    } catch (error) {
      console.error('Error fetching today\'s data:', error);
      // Fallback to mock data if API is not available
      setTodayData({ safari: 32, brielle: 28 });
    }
  };

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to mock data if API is not available
      setStats({
        safari: { total: 1280, wins: 5 },
        brielle: { total: 1152, wins: 3 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Add water via API
  const addWater = async (amount) => {
    try {
      await axios.post(`${API_BASE_URL}/api/water`, {
        player: user.username,
        amount: amount
      });
      
      // Refresh today's data after adding water
      await fetchTodayData();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding water:', error);
      // Fallback to local state update if API fails
      const newAmount = todayData[user.username] + amount;
      setTodayData(prev => ({
        ...prev,
        [user.username]: newAmount
      }));
      setShowAddModal(false);
    }
  };

  // Refresh data periodically
  useEffect(() => {
    fetchTodayData();
    fetchStats();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchTodayData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time until midnight
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine winner
  useEffect(() => {
    if (todayData.safari > todayData.brielle) {
      setWinner('safari');
    } else if (todayData.brielle > todayData.safari) {
      setWinner('brielle');
    } else {
      setWinner(null);
    }
  }, [todayData]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p>Loading Water Wars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="gradient-text">Water</span> Wars
          </h1>
          <p className="dashboard-subtitle">Welcome back, {user.name}! 💧</p>
        </div>
        <button onClick={onLogout} className="logout-button">
          <LogOut className="logout-icon" />
          Logout
        </button>
      </div>

      <div className="timer-section">
        <div className="timer-card">
          <Calendar className="timer-icon" />
          <div className="timer-content">
            <h3>Time Remaining Today</h3>
            <div className="timer-display">{timeLeft}</div>
          </div>
        </div>
      </div>

      <div className="battle-section">
        <div className="battle-header">
          <h2>Today's Battle</h2>
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="add-water-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="button-icon" />
            Add Water
          </motion.button>
        </div>

        <div className="water-jugs-container">
          <div className={`water-jug-wrapper ${winner === 'safari' ? 'winner' : ''}`}>
            <WaterJug 
              amount={todayData.safari} 
              name="Safari" 
              color="#3b82f6"
              isWinner={winner === 'safari'}
            />
          </div>
          
          <div className="vs-divider">
            <div className="vs-circle">VS</div>
          </div>
          
          <div className={`water-jug-wrapper ${winner === 'brielle' ? 'winner' : ''}`}>
            <WaterJug 
              amount={todayData.brielle} 
              name="Brielle" 
              color="#ec4899"
              isWinner={winner === 'brielle'}
            />
          </div>
        </div>

        {winner && (
          <motion.div 
            className="winner-announcement"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Trophy className="trophy-icon" />
            <span>{winner === 'safari' ? 'Safari' : 'Brielle'} is winning! 🏆</span>
          </motion.div>
        )}
      </div>

      <Stats stats={stats} />

      <AddWaterModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addWater}
        user={user}
      />
    </div>
  );
};

export default Dashboard;
