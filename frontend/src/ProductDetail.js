import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Fade,
  Chip
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const userId = parseJwt(token)?.userId;

  const fetchProductData = async () => {
    try {
      const { data } = await axios.get(`http://localhost:5001/api/products/${id}`);
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
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEdit = () => setEditMode(true);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5001/api/products/${id}`, form, {
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
      await axios.delete(`http://localhost:5001/api/products/${id}`, {
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

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", my: 4 }}>
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardMedia 
          component="img" 
          height="400" 
          image={product.imageUrl} 
          alt={product.name}
          sx={{ objectFit: 'cover' }}
        />
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

        <CardActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          {token && product.seller._id === userId ? (
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
            <Button 
              variant="contained" 
              onClick={() => addToCart(product)}
              sx={{ 
                bgcolor: '#FF7043',
                '&:hover': { bgcolor: '#F4511E' }
              }}
            >
              Add to Cart
            </Button>
          )}
        </CardActions>
      </Card>
    </Box>
  );
};

export default ProductDetail;
