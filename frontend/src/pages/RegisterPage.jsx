import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterModal from './RegisterModal';

export default function RegisterPage({ setToken }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <RegisterModal
        isOpen={true}
        onClose={() => navigate('/')}
        onSuccess={(token) => {
          if (setToken) setToken(token);
          navigate('/');
        }}
        onSwitchToLogin={() => navigate('/')}
      />
    </div>
  );
}
