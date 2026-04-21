import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import Logo from './Logo';

const SplashScreen = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 50%, #004D40 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: show ? 1 : 0,
        transition: 'opacity 0.5s ease-out'
      }}
    >
      <Box
        sx={{
          animation: 'slideUp 1s ease-out',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Logo size={140} animated={true} />
        
        <Typography
          variant="h2"
          sx={{
            color: 'white',
            fontWeight: 800,
            letterSpacing: 2,
            animation: 'fadeInUp 0.8s ease-out 1s forwards',
            opacity: 0,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
        >
          LocalMarket
        </Typography>
        
        <Typography
          variant="h6"
          sx={{
            color: '#AEEA00',
            fontWeight: 600,
            animation: 'fadeInUp 0.8s ease-out 1.5s forwards',
            opacity: 0,
            textShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}
        >
          Your Sustainable Community Marketplace 🛒
        </Typography>
      </Box>

      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes fadeInUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default SplashScreen;
