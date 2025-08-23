import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Plus, Minus } from 'lucide-react';
import './AddWaterModal.css';

const AddWaterModal = ({ isOpen, onClose, onAdd, user }) => {
  const [amount, setAmount] = useState(8);
  const [customAmount, setCustomAmount] = useState('');

  const presetAmounts = [4, 8, 12, 16, 20];

  const handleAdd = () => {
    const finalAmount = customAmount ? parseInt(customAmount) : amount;
    if (finalAmount > 0) {
      onAdd(finalAmount);
      setAmount(8);
      setCustomAmount('');
    }
  };

  const handlePresetClick = (presetAmount) => {
    setAmount(presetAmount);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    const value = e.target.value;
    if (value === '' || (parseInt(value) > 0 && parseInt(value) <= 100)) {
      setCustomAmount(value);
      setAmount(0);
    }
  };

  const incrementAmount = () => {
    if (customAmount) {
      const newAmount = parseInt(customAmount) + 1;
      if (newAmount <= 100) {
        setCustomAmount(newAmount.toString());
      }
    } else {
      const newAmount = amount + 1;
      if (newAmount <= 100) {
        setAmount(newAmount);
      }
    }
  };

  const decrementAmount = () => {
    if (customAmount) {
      const newAmount = parseInt(customAmount) - 1;
      if (newAmount > 0) {
        setCustomAmount(newAmount.toString());
      }
    } else {
      const newAmount = amount - 1;
      if (newAmount > 0) {
        setAmount(newAmount);
      }
    }
  };

  const finalAmount = customAmount ? parseInt(customAmount) : amount;
  const gallons = (finalAmount / 128).toFixed(2);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add Water Intake</h2>
              <button onClick={onClose} className="close-button">
                <X className="close-icon" />
              </button>
            </div>

            <div className="modal-body">
              <div className="user-info">
                <div className="user-avatar">
                  <Droplets className="avatar-icon" />
                </div>
                <span className="user-name">{user.name}</span>
              </div>

              <div className="amount-section">
                <h3>How much water did you drink?</h3>
                
                <div className="preset-amounts">
                  {presetAmounts.map((preset) => (
                    <motion.button
                      key={preset}
                      className={`preset-button ${amount === preset && !customAmount ? 'active' : ''}`}
                      onClick={() => handlePresetClick(preset)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {preset} oz
                    </motion.button>
                  ))}
                </div>

                <div className="custom-amount">
                  <label>Or enter custom amount:</label>
                  <div className="custom-input-group">
                    <button 
                      className="amount-button"
                      onClick={decrementAmount}
                      disabled={finalAmount <= 1}
                    >
                      <Minus className="button-icon" />
                    </button>
                    
                    <input
                      type="number"
                      value={customAmount}
                      onChange={handleCustomChange}
                      placeholder="Enter oz"
                      min="1"
                      max="100"
                      className="custom-input"
                    />
                    
                    <button 
                      className="amount-button"
                      onClick={incrementAmount}
                      disabled={finalAmount >= 100}
                    >
                      <Plus className="button-icon" />
                    </button>
                  </div>
                </div>

                <div className="amount-display">
                  <div className="amount-oz">{finalAmount} oz</div>
                  <div className="amount-gallons">({gallons} gallons)</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <motion.button
                onClick={handleAdd}
                className="add-button"
                disabled={finalAmount <= 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Droplets className="button-icon" />
                Add {finalAmount} oz
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddWaterModal;
