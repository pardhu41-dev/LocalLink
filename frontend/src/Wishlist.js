import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, CardActions, Button, Typography, Box, IconButton, Chip } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Wishlist = ({ addToCart }) => {
  const [wishlist, setWishlist] = useState([]);

  const loadWishlist = () => {
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Wishlist loaded:', parsed);
        setWishlist(parsed);
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    }
  };

  useEffect(() => {
    loadWishlist();
    
    // Listen for custom wishlist updates
    const handleWishlistUpdate = () => {
      console.log('Wishlist update event received');
      loadWishlist();
    };
    
    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('storage', loadWishlist);
    window.addEventListener('focus', loadWishlist);
    
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('storage', loadWishlist);
      window.removeEventListener('focus', loadWishlist);
    };
  }, []);

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(p => p._id !== productId);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    window.dispatchEvent(new Event('wishlist-updated'));
  };

  return (
    <Box>
      <Typography variant="h4" mb={3}>My Wishlist ({wishlist.length})</Typography>
      
      {wishlist.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            Your wishlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Click the heart icon on products to add them to your wishlist
          </Typography>
          <Button variant="contained" component={Link} to="/">
            Browse Products
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wishlist.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    component={Link}
                    to={`/product/${p._id}`}
                    variant="h6"
                    sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 'bold' }}
                  >
                    {p.name}
                    <Chip
                      label={p.listingType}
                      color={p.listingType === 'SELL' ? 'error' : p.listingType === 'BUY' ? 'success' : 'info'}
                      size="small"
                      sx={{ ml: 1, verticalAlign: 'middle' }}
                    />
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {p.description?.length > 80 ? p.description.slice(0, 80) + '...' : p.description}
                  </Typography>
                  <Typography variant="h6" mt={2}>₹{p.price}</Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      addToCart(p);
                      alert('Added to cart!');
                    }}
                    sx={{ flexGrow: 1, mr: 1 }}
                  >
                    Add to Cart
                  </Button>
                  <IconButton onClick={() => removeFromWishlist(p._id)} color="error">
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Wishlist;
