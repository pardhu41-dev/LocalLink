import { API } from './config';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Tabs, Tab, 
  Box, Button, IconButton, Badge, Typography, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';

import SplashScreen from './components/SplashScreen';
import Logo from './components/Logo';
import AuthForms from './AuthForms';
import AddProductForm from './AddProductForm';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import Profile from './Profile';
import Orders from './Orders';
import Cart from './Cart';
import Wishlist from './Wishlist';
import HealthCheck from './components/HealthCheck';

function LinkTab(props) {
  return (
    <Tab
      component={Link}
      {...props}
      sx={{ 
        color: 'white', 
        fontWeight: 600,
        fontSize: '0.95rem',
        '&:hover': { 
          opacity: 0.9,
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        },
        '&.Mui-selected': { 
          color: '#AEEA00',
          fontWeight: 700
        }
      }}
    />
  );
}

function NavTabs({ token, setToken, darkMode, toggleDarkMode, onLoginClick }) {
  let location = useLocation();
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState(0);
  
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setWishlistCount(wishlist.length);
  }, [location]);

  const currentTab = () => {
    if (location.pathname.startsWith('/profile')) return 1;
    if (location.pathname.startsWith('/orders')) return 2;
    if (location.pathname.startsWith('/wishlist')) return 3;
    if (location.pathname.startsWith('/add-product')) return 4;
    if (location.pathname.startsWith('/cart')) return 5;
    return 0;
  };
  const [value, setValue] = React.useState(currentTab());
  const handleChange = (event, newValue) => setValue(newValue);

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem('jwt');
    navigate("/");
  };
  
  return (
    <AppBar 
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
      }}
    >
      <Toolbar sx={{ minHeight: 70 }}>
        {/* Logo and Title */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            mr: 4,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          <Logo size={45} />
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              letterSpacing: 0.5,
              display: { xs: 'none', sm: 'block' },
              color: '#AEEA00'
            }}
          >
            LocalMarket
          </Typography>
        </Box>

        <Tabs 
          value={value} 
          onChange={handleChange} 
          TabIndicatorProps={{
            style: { backgroundColor: '#AEEA00', height: 3 }
          }}
          textColor="inherit"
          sx={{ flexGrow: 1 }}
        >
          <LinkTab label="Home" to="/" />
          {token && <LinkTab label="Profile" to="/profile" />}
          {token && <LinkTab label="Orders" to="/orders" />}
          {token && (
            <LinkTab 
              label={
                <Badge badgeContent={wishlistCount} color="error">
                  Wishlist
                </Badge>
              } 
              to="/wishlist" 
            />
          )}
          {token && <LinkTab label="Add Product" to="/add-product" />}
          {token && <LinkTab label="Cart" to="/cart" />}
        </Tabs>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton 
            color="inherit" 
            onClick={toggleDarkMode} 
            sx={{ 
              mr: 1,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          {!token ? (
            <Button 
              variant="contained"
              onClick={onLoginClick}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                backgroundColor: '#FF7043',
                color: 'white',
                px: 3,
                '&:hover': {
                  backgroundColor: '#F4511E'
                }
              }}
            >
              Login / Register
            </Button>
          ) : (
            <Button 
              size="small" 
              onClick={handleLogout} 
              variant="outlined"
              sx={{ 
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { 
                  borderColor: '#AEEA00',
                  backgroundColor: 'rgba(174, 234, 0, 0.1)',
                  color: '#AEEA00'
                }
              }}
            >
              Logout
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('jwt') || "");
  const [cart, setCart] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { 
        main: '#2E7D32', // Forest Green
        light: '#4CAF50',
        dark: '#1B5E20'
      },
      secondary: { 
        main: '#AEEA00', // Lime Green
        light: '#C6FF00',
        dark: '#9CCC65'
      },
      error: {
        main: '#FF7043', // Deep Orange for errors
        light: '#FF8A65'
      },
      info: {
        main: '#009688', // Teal
        light: '#4DB6AC'
      },
      success: {
        main: '#009688', // Teal for success
      },
      background: {
        default: darkMode ? '#1B5E20' : '#F9F9F9', // Off White
        paper: darkMode ? '#2E7D32' : '#FFFFFF'
      },
      text: {
        primary: darkMode ? '#E8F5E9' : '#333333', // Charcoal Gray
        secondary: darkMode ? '#C8E6C9' : '#666666'
      }
    },
    typography: { 
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 }
    },
    shape: {
      borderRadius: 12
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 10
          },
          contained: {
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(46, 125, 50, 0.3)',
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: '1px solid #E0E0E0'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: '1px solid #E0E0E0'
          }
        }
      }
    }
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  useEffect(() => {
    // ✅ UPDATED: Using API config instead of hardcoded URL
    axios.get(API.products)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem('jwt', token);
  }, [token]);

  const addToCart = (product) => {
    if (!token) {
      setLoginDialogOpen(true);
      return;
    }
    const exist = cart.find(item => item.product._id === product._id);
    if (exist) {
      setCart(cart.map(item => item.product._id === product._id
        ? { ...item, quantity: item.quantity + 1 }
        : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const handleCheckout = async (total) => {
    if (!token) {
      alert('Please login to place an order');
      return;
    }
    try {
      // ✅ UPDATED: Using API config
      await axios.post(API.orders, {
        products: cart,
        total
      }, { headers: { Authorization: 'Bearer ' + token } });
      alert('Order placed!');
      setCart([]);
    } catch (err) {
      alert('Order failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    setLoginDialogOpen(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <NavTabs 
          token={token} 
          setToken={setToken} 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode}
          onLoginClick={() => setLoginDialogOpen(true)}
        />
        
        <Dialog 
          open={loginDialogOpen} 
          onClose={() => setLoginDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700, color: '#2E7D32' }}>
            Login / Register
          </DialogTitle>
          <DialogContent>
            <AuthForms setToken={handleLoginSuccess} />
          </DialogContent>
        </Dialog>

        {/* ✅ NEW: Health Check Component */}
        <HealthCheck />

        <Box sx={{ width: '100%', px: 3, py: 4 }}>
          <Routes>
            <Route path="/" element={<ProductList products={products} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
            <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
            <Route path="/profile" element={token ? <Profile token={token} /> : <ProductList products={products} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
            <Route path="/orders" element={token ? <Orders token={token} /> : <ProductList products={products} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
            <Route path="/wishlist" element={token ? <Wishlist addToCart={addToCart} /> : <ProductList products={products} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
            <Route path="/add-product" element={token ? <AddProductForm token={token} /> : <ProductList products={products} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
            <Route path="/cart" element={token ? <Cart cart={cart} setCart={setCart} onCheckout={handleCheckout} /> : <ProductList products={products} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
          </Routes>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
