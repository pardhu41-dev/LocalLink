import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddProductModal from './components/AddProductModal';

export default function AddProductForm({ token, onProductAdded }) {
  const navigate = useNavigate();

  return (
    <AddProductModal
      isOpen={true}
      token={token}
      onClose={() => navigate('/')}
      onSuccess={(newProduct) => {
        if (onProductAdded) onProductAdded(newProduct);
        navigate('/');
      }}
    />
  );
}
