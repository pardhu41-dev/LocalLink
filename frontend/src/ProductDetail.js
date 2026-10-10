import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { API, API_BASE_URL } from "./config";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Fade
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentModal from './components/PaymentModal';

function parseJwt(token) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

const ProductDetail = ({ addToCart, token, onLoginRequired }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const userId = parseJwt(token)?.userId;

  const fetchProductData = async () => {
    try {
      const { data } = await axios.get(API.product(id));
      setProduct(data);
      setForm({
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        imageUrl: data.imageUrl,
        availableQty: data.availableQty
      });
    } catch {
      alert("Product not found");
    }
  };

  useEffect(() => {
    fetchProductData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEdit = () => setEditMode(true);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(API.product(id), form, {
        headers: { Authorization: "Bearer " + token },
      });
      alert("Product updated");
      setEditMode(false);
      fetchProductData();
    } catch (err) {
      alert(err.response?.data?.msg || "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axios.delete(API.product(id), {
        headers: { Authorization: "Bearer " + token },
      });
      alert("Product deleted");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.msg || "Delete failed");
    }
  };

  if (!product) return <Typography>Loading...</Typography>;

  if (editMode) {
    return (
      <Fade in>
        <Box
          component="form"
          onSubmit={handleUpdate}
          sx={{ maxWidth: 600, mx: "auto", my: 4, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Typography variant="h5" fontWeight={700}>Edit Product</Typography>
          <TextField name="name" label="Name" value={form.name} onChange={handleChange} fullWidth required />
          <TextField name="description" label="Description" value={form.description} onChange={handleChange} fullWidth multiline rows={3} />
          <TextField name="price" label="Price" type="number" value={form.price} onChange={handleChange} fullWidth required />
          <TextField name="category" label="Category" value={form.category} onChange={handleChange} fullWidth />
          <TextField name="imageUrl" label="Image URL" value={form.imageUrl} onChange={handleChange} fullWidth />
          <TextField name="availableQty" label="Available Quantity" type="number" value={form.availableQty} onChange={handleChange} fullWidth />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="contained" type="submit" sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}>
              Save
            </Button>
            <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
          </Box>
        </Box>
      </Fade>
    );
  }

  const resolveImg = (src) => {
    if (!src) return '';
    return src.startsWith('/uploads/') ? `${API_BASE_URL || ''}${src}` : src;
  };

  const rawImages = (product.images && product.images.length > 0)
    ? product.images
    : (product.imageUrl ? [product.imageUrl] : []);
  const allImages = rawImages.map(resolveImg);
  const currentImage = allImages[activeImageIndex] || resolveImg(product.imageUrl) || '';

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", my: 4 }}>
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardMedia 
          component="img" 
          height="400" 
          image={currentImage} 
          alt={product.name}
          sx={{ objectFit: 'cover', maxHeight: 420 }}
        />
        {allImages.length > 1 && (
          <Box sx={{ display: 'flex', gap: 1.5, p: 2, bgcolor: 'background.paper', overflowX: 'auto', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {allImages.map((img, idx) => (
              <Box
                key={idx}
                component="img"
                src={img}
                alt={`${product.name} thumbnail ${idx + 1}`}
                onClick={() => setActiveImageIndex(idx)}
                sx={{
                  width: 72,
                  height: 54,
                  objectFit: 'cover',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  border: activeImageIndex === idx ? '2px solid #2E7D32' : '1px solid rgba(0,0,0,0.15)',
                  opacity: activeImageIndex === idx ? 1 : 0.7,
                  transition: 'all 0.2s',
                  '&:hover': { opacity: 1 }
                }}
              />
            ))}
          </Box>
        )}
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="h5" color="#2E7D32" fontWeight={700} mb={2}>
            ₹{product.price?.toLocaleString()}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {product.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Category:</strong> {product.category}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Available:</strong> {product.availableQty}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ px: 3, pb: 3, gap: 1.5, flexWrap: 'wrap' }}>
          {token && product.seller && product.seller._id === userId ? (
            <>
              <Button 
                variant="contained" 
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
              >
                Edit
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              {/* 💬 Direct WhatsApp Chat */}
              <Button 
                variant="contained" 
                onClick={() => {
                  const phone = (product.sellerPhone || product.seller?.phone || '9876543210').replace(/\D/g, '').slice(-10);
                  const title = product.title || product.name || 'Local Marketplace Item';
                  const price = product.price || 0;
                  const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent('Hi, I am interested in buying "' + title + '" listed on LocalMarket for ₹' + price)}`;
                  window.open(waUrl, '_blank', 'noopener,noreferrer');
                }}
                sx={{ 
                  bgcolor: '#25D366',
                  color: '#ffffff',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#1EBE5D' }
                }}
              >
                Chat on WhatsApp
              </Button>

              {/* ⚡ Zero-Fee UPI Payment QR */}
              <Button 
                variant="contained" 
                onClick={() => setPaymentOpen(true)}
                sx={{ 
                  bgcolor: '#16A34A',
                  color: '#ffffff',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#15803D' }
                }}
              >
                Pay via UPI QR (Zero Fee)
              </Button>

              {/* 🛒 Add to Cart */}
              <Button 
                variant="outlined" 
                onClick={() => addToCart(product)}
                sx={{ 
                  borderColor: '#FF7043',
                  color: '#FF7043',
                  fontWeight: 600,
                  '&:hover': { bgcolor: 'rgba(255, 112, 67, 0.08)', borderColor: '#F4511E' }
                }}
              >
                Add to Cart
              </Button>
            </>
          )}
        </CardActions>
      </Card>

      {/* ── Zero-Fee UPI Payment Modal ── */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        item={product}
      />
    </Box>
  );
};

export default ProductDetail;
