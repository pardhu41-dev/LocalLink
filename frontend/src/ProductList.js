import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, CardActions, Button, Typography, Chip, Box, TextField, Paper, IconButton, Checkbox, Divider } from '@mui/material';
import { Favorite, FavoriteBorder, Search } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const ProductList = ({ products, addToCart, token, onLoginRequired }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem('wishlist');
        if (saved) {
          setWishlist(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      }
    };
    loadWishlist();
  }, []);

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const types = ['SELL', 'BUY', 'SHARE'];

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleTypeChange = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(p.listingType);
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'priceLow') return a.price - b.price;
      if (sortBy === 'priceHigh') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

  const toggleWishlist = (product) => {
  if (!token) {
    onLoginRequired();
    return;
  }
  
  const isInWishlist = wishlist.some(p => p._id === product._id);
  let updated = isInWishlist 
    ? wishlist.filter(p => p._id !== product._id)
    : [...wishlist, product];
  
  setWishlist(updated);
  localStorage.setItem('wishlist', JSON.stringify(updated));
  window.dispatchEvent(new Event('wishlist-updated'));
};


  const isInWishlist = (productId) => wishlist.some(p => p._id === productId);

  return (
    <Box>
      {/* Hero Section */}
<Paper 
  elevation={0}
  sx={{ 
    p: 4, 
    mb: 4, 
    background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
    color: 'white',
    borderRadius: 3,
    boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)',
    border: 'none'
  }}
>
  <Typography variant="h3" fontWeight={700} gutterBottom>
     Discover Amazing Products
  </Typography>
  <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '1.1rem', color: '#E8F5E9' }}>
    Find what you need from our vibrant community marketplace
  </Typography>
</Paper>


      {/* Main Content with Sidebar */}
{/* Main Content with Sidebar */}
<Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
  {/* Main Products Area */}
  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
    {/* Search Bar */}
    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search products..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <Button
          variant={sortBy === 'newest' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setSortBy('newest')}
        >
          Newest
        </Button>
        
        <Button
          variant={sortBy === 'priceLow' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setSortBy('priceLow')}
        >
          Price ↑
        </Button>
        <Button
          variant={sortBy === 'priceHigh' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setSortBy('priceHigh')}
        >
          Price ↓
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" mt={2}>
        Showing {filteredProducts.length} products
      </Typography>
    </Paper>

    {/* Product Grid */}
    <Grid container spacing={2.5}>
      {filteredProducts.map((p) => (
        <Grid 
          item 
          xs={12}
          sm={6} 
          md={4} 
          lg={4}
          xl={3}
          key={p._id}
        >
         <Card 
  elevation={2}
  sx={{ 
    height: 420,
    display: 'flex', 
    flexDirection: 'column',
    position: 'relative',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 4
    }
  }}
>
  <IconButton
    onClick={() => toggleWishlist(p)}
    size="small"
    sx={{ 
      position: 'absolute', 
      top: 8, 
      right: 8, 
      zIndex: 2,
      bgcolor: 'background.paper',
      boxShadow: 1,
      '&:hover': { 
        bgcolor: 'background.paper',
        transform: 'scale(1.1)'
      }
    }}
    color={isInWishlist(p._id) ? 'error' : 'default'}
  >
    {isInWishlist(p._id) ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
  </IconButton>
  
  {/* Product Image */}
  <Box 
    sx={{ 
      height: 140,
      width: '100%',
      flexShrink: 0,
      overflow: 'hidden',
      bgcolor: 'grey.200'
    }}
  >
    {p.imageUrl ? (
      <img 
        src={p.imageUrl} 
        alt={p.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />
    ) : (
      <Box 
        sx={{ 
          height: '100%',
          width: '100%',
          background: `linear-gradient(135deg, ${
            p.listingType === 'SELL' ? '#667eea 0%, #764ba2' : 
            p.listingType === 'BUY' ? '#f093fb 0%, #f5576c' : 
            '#4facfe 0%, #00f2fe'
          } 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '3rem',
          fontWeight: 700
        }}
      >
        {p.name.charAt(0).toUpperCase()}
      </Box>
    )}
  </Box>

  <CardContent sx={{ 
    flexGrow: 0,
    flexShrink: 0,
    height: 220,
    overflow: 'hidden',
    pt: 2, 
    pb: 1,
    px: 2
  }}>
    <Chip
      label={p.listingType}
      size="small"
      color={p.listingType === 'SELL' ? 'error' : p.listingType === 'BUY' ? 'success' : 'info'}
      sx={{ mb: 1, fontWeight: 600, fontSize: '0.7rem' }}
    />
    
    <Typography
      component={Link}
      to={`/product/${p._id}`}
      variant="h6"
      sx={{ 
        textDecoration: 'none', 
        color: 'text.primary', 
        fontWeight: 600,
        display: 'block',
        mb: 1,
        height: '44px',
        fontSize: '0.9rem',
        overflow: 'hidden',
        lineHeight: 1.3,
        '&:hover': { color: 'primary.main' }
      }}
    >
      {p.name.length > 45 ? p.name.slice(0, 45) + '...' : p.name}
    </Typography>
    
    <Typography 
      variant="body2" 
      color="text.secondary" 
      sx={{ 
        mb: 2,
        height: '54px',
        overflow: 'hidden',
        fontSize: '0.8rem',
        lineHeight: 1.4
      }}
    >
      {p.description?.slice(0, 80) || 'No description available'}
    </Typography>
    
    <Box>
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5 }}>
        By: {p.seller?.name || 'Unknown'}
      </Typography>
      <Typography variant="h6" color="primary.main" fontWeight={700}>
        ₹{p.price.toLocaleString()}
      </Typography>
    </Box>
  </CardContent>
  
  <CardActions sx={{ 
    px: 2, 
    pb: 2, 
    pt: 0,
    height: 60,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center'
  }}>
    <Button 
  variant="contained" 
  size="small"
  fullWidth 
  onClick={() => addToCart(p)}
  sx={{ 
    fontWeight: 600, 
    textTransform: 'none',
    backgroundColor: '#FF7043',
    '&:hover': {
      backgroundColor: '#F4511E'
    }
  }}
>
  Add to Cart
</Button>

  </CardActions>
</Card>

        </Grid>
      ))}
    </Grid>

    {filteredProducts.length === 0 && (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No products found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your filters
        </Typography>
      </Box>
    )}
  </Box>

  {/* Sidebar Filters */}
<Paper 
  elevation={2} 
  sx={{ 
    width: { xs: '100%', lg: 250 }, 
    p: 2.5, 
    borderRadius: 2,
    position: { xs: 'relative', lg: 'sticky' },
    top: 16,
    alignSelf: 'flex-start',
    maxHeight: { lg: 'calc(100vh - 120px)' },
    overflowY: 'auto',
    flexShrink: 0
  }}
>
  <Typography variant="h6" fontWeight={700} mb={2} fontSize="1.1rem">
    Filters
  </Typography>

  <Divider sx={{ mb: 2 }} />

  {/* Category Filters */}
  <Typography variant="subtitle2" fontWeight={600} mb={1} fontSize="0.85rem">
    Categories
  </Typography>
  <Box sx={{ mb: 2.5 }}>
    {categories.map(category => (
      <Box 
        key={category}
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 0.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: 1,
          px: 0.5,
          py: 0.3
        }}
        onClick={() => handleCategoryChange(category)}
      >
        <Checkbox
          checked={selectedCategories.includes(category)}
          size="small"
          sx={{ p: 0.5 }}
        />
        <Typography variant="body2" fontSize="0.85rem" sx={{ ml: 1 }}>
          {category}
        </Typography>
      </Box>
    ))}
  </Box>

  <Divider sx={{ mb: 2 }} />

  {/* Type Filters */}
  <Typography variant="subtitle2" fontWeight={600} mb={1} fontSize="0.85rem">
    Listing Type
  </Typography>
  <Box sx={{ mb: 2 }}>
    {types.map(type => (
      <Box 
        key={type}
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 0.5,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: 1,
          px: 0.5,
          py: 0.3
        }}
        onClick={() => handleTypeChange(type)}
      >
        <Checkbox
          checked={selectedTypes.includes(type)}
          size="small"
          color={type === 'SELL' ? 'error' : type === 'BUY' ? 'success' : 'info'}
          sx={{ p: 0.5 }}
        />
        <Typography variant="body2" fontSize="0.85rem" sx={{ ml: 1 }}>
          {type}
        </Typography>
      </Box>
    ))}
  </Box>

  {/* Clear Filters */}
  {(selectedCategories.length > 0 || selectedTypes.length > 0) && (
    <>
      <Divider sx={{ mb: 2 }} />
      <Button 
        variant="outlined" 
        size="small" 
        fullWidth
        onClick={() => {
          setSelectedCategories([]);
          setSelectedTypes([]);
        }}
      >
        Clear All Filters
      </Button>
    </>
  )}
</Paper>

</Box>

    </Box>
  );
};

export default ProductList;
