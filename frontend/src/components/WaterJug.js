import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import './WaterJug.css';

const WaterJug = ({ amount, name, color, isWinner }) => {
  // Calculate fill percentage (assuming 128 oz is full - 1 gallon)
  const maxCapacity = 128; // oz
  const fillPercentage = Math.min((amount / maxCapacity) * 100, 100);
  
  // Convert to gallons for display
  const gallons = (amount / 128).toFixed(2);

  return (
    <motion.div 
      className="water-jug"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="jug-container">
        {/* Water jug outline */}
        <svg 
          className="jug-svg" 
          viewBox="0 0 200 300" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Jug outline */}
          <path
            d="M 50 50 L 50 250 Q 50 280 80 280 L 120 280 Q 150 280 150 250 L 150 50 Q 150 20 120 20 L 80 20 Q 50 20 50 50 Z"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3"
            className="jug-outline"
          />
          
          {/* Water fill */}
          <defs>
            <linearGradient id={`waterGradient-${name}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          
          <motion.path
            d={`M 50 250 Q 50 280 80 280 L 120 280 Q 150 280 150 250 L 150 ${250 - (fillPercentage * 2)} Q 150 ${220 - (fillPercentage * 2)} 120 ${220 - (fillPercentage * 2)} L 80 ${220 - (fillPercentage * 2)} Q 50 ${220 - (fillPercentage * 2)} 50 ${250 - (fillPercentage * 2)} Z`}
            fill={`url(#waterGradient-${name})`}
            className="water-fill"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          {/* Water surface with ripple effect */}
          {fillPercentage > 0 && (
            <motion.circle
              cx="100"
              cy={250 - (fillPercentage * 2)}
              r="35"
              fill={color}
              opacity="0.3"
              className="water-surface"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          )}
        </svg>
        
        {/* Jug handle */}
        <div className="jug-handle">
          <div className="handle-top"></div>
          <div className="handle-side"></div>
        </div>
      </div>
      
      {/* Player info */}
      <div className="player-info">
        <div className="player-name">
          {name}
          {isWinner && (
            <motion.div
              className="winner-star"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Star className="star-icon" />
            </motion.div>
          )}
        </div>
        
        <div className="water-amount">
          <div className="amount-oz">{amount} oz</div>
          <div className="amount-gallons">({gallons} gal)</div>
        </div>
        
        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${fillPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="progress-text">{fillPercentage.toFixed(1)}%</div>
        </div>
      </div>
      
      {/* Bubbles animation */}
      {fillPercentage > 0 && (
        <div className="bubbles">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="bubble"
              style={{ backgroundColor: color }}
              initial={{ 
                y: 250, 
                x: 60 + (i * 10), 
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                y: -50, 
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default WaterJug;
