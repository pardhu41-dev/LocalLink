import React, { useState, useEffect } from 'react';
import { API } from '../config';
import axios from 'axios';

const HealthCheck = () => {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(API.health);
        setHealth(res.data);
        setError(false);
      } catch (err) {
        setError(true);
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);

  if (!health && !error) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      padding: '8px 16px',
      borderRadius: 8,
      background: error ? '#ff4444' : '#4caf50',
      color: 'white',
      fontSize: 12,
      fontWeight: 600,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: 9999
    }}>
      {error ? '🔴 Backend Offline' : `🟢 Backend Online (${health.mongodb})`}
    </div>
  );
};

export default HealthCheck;
