import React from 'react';
import { Box } from '@mui/material';

const Logo = ({ size = 50, animated = false }) => {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{
          animation: animated ? 'spin 2s ease-in-out' : 'none'
        }}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="bagGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2E7D32', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#AEEA00', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#009688', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#2E7D32', stopOpacity: 1 }} />
          </linearGradient>
        </defs>

        {/* Outer circle with gradient */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#circleGradient)"
          strokeWidth="4"
          style={{
            animation: animated ? 'drawCircle 1.5s ease-out forwards' : 'none',
            strokeDasharray: animated ? 283 : 'none',
            strokeDashoffset: animated ? 283 : 0
          }}
        />
        
        {/* Shopping bag with gradient */}
        <path
          d="M 30 35 L 30 75 Q 30 80 35 80 L 65 80 Q 70 80 70 75 L 70 35 Z"
          fill="url(#bagGradient)"
          style={{
            animation: animated ? 'fadeIn 0.8s ease-out 0.5s forwards' : 'none',
            opacity: animated ? 0 : 1
          }}
        />
        
        {/* Handle */}
        <path
          d="M 35 35 Q 35 25 42 22 Q 50 20 58 22 Q 65 25 65 35"
          fill="none"
          stroke="url(#bagGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          style={{
            animation: animated ? 'fadeIn 0.8s ease-out 0.8s forwards' : 'none',
            opacity: animated ? 0 : 1
          }}
        />
        
        {/* Cart icon inside - white for contrast */}
        <path
          d="M 40 50 L 42 60 L 58 60 L 60 50 M 44 65 A 2 2 0 1 1 44 65.1 M 56 65 A 2 2 0 1 1 56 65.1"
          stroke="#ffffff"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          style={{
            animation: animated ? 'fadeIn 0.6s ease-out 1.2s forwards' : 'none',
            opacity: animated ? 0 : 1
          }}
        />
        
        {/* Sparkles - eco theme */}
        <circle cx="20" cy="25" r="2" fill="#AEEA00" opacity="0.8"
          style={{
            animation: animated ? 'twinkle 1.5s ease-in-out 1.5s infinite' : 'none'
          }}
        />
        <circle cx="80" cy="30" r="2.5" fill="#009688" opacity="0.8"
          style={{
            animation: animated ? 'twinkle 1.5s ease-in-out 1.7s infinite' : 'none'
          }}
        />
        <circle cx="75" cy="70" r="2" fill="#4CAF50" opacity="0.8"
          style={{
            animation: animated ? 'twinkle 1.5s ease-in-out 1.9s infinite' : 'none'
          }}
        />
      </svg>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg) scale(0.5); opacity: 0; }
            50% { transform: rotate(180deg) scale(1.1); opacity: 1; }
            100% { transform: rotate(360deg) scale(1); opacity: 1; }
          }
          
          @keyframes drawCircle {
            to { strokeDashoffset: 0; }
          }
          
          @keyframes fadeIn {
            to { opacity: 1; }
          }

          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
        `}
      </style>
    </Box>
  );
};

export default Logo;
