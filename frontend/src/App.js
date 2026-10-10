import { API } from './config';
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  ThemeProvider, createTheme, CssBaseline,
  Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SplashScreen from './components/SplashScreen';
import AuthForms from './AuthForms';
import AddProductForm from './AddProductForm';
import ProductList from './ProductList';
import ProductDetail from './ProductDetail';
import Profile from './Profile';
import Orders from './Orders';
import Cart from './Cart';
import Wishlist from './Wishlist';
import VerifyEmail from './pages/VerifyEmail';
import RegisterPage from './pages/RegisterPage';
import AiAssistant from './components/AiAssistant';
import Navbar from './components/Navbar';


function App() {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('jwt') || "");
  const [cart, setCart] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const theme = useMemo(() => createTheme({
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
        default: darkMode ? '#09090B' : '#F8FAFC', // Clean neutral canvas (slate-50)
        paper: darkMode ? '#18181B' : '#FFFFFF'
      },
      text: {
        primary: darkMode ? '#F8FAFC' : '#0F172A', // Slate 900
        secondary: darkMode ? '#94A3B8' : '#64748B' // Slate 500
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
            border: darkMode ? '1px solid #27272A' : '1px solid #E0E0E0'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: darkMode ? '1px solid #27272A' : '1px solid #E0E0E0'
          }
        }
      }
    }
  }), [darkMode]);

  // Sync dark class on <html> element and persist in localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const fetchProducts = () => {
    setProductsLoading(true);
    axios.get(API.products)
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to fetch products:', err))
      .finally(() => setProductsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
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
        <div className={`min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col transition-colors ${darkMode ? 'dark' : ''}`}>
          <Navbar 
            token={token} 
            setToken={setToken} 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode}
            onLoginClick={() => setLoginDialogOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
          />
          
          <Dialog 
            open={loginDialogOpen} 
            onClose={() => setLoginDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ fontWeight: 700, color: '#16A34A' }}>
              Login / Register
            </DialogTitle>
            <DialogContent>
              <AuthForms setToken={handleLoginSuccess} />
            </DialogContent>
          </Dialog>

          <main className="w-full flex-1">
            <Routes>
              <Route path="/" element={<ProductList products={products} isLoading={productsLoading} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
              <Route path="/product/:id" element={<ProductDetail addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
              <Route path="/profile" element={token ? <Profile token={token} /> : <ProductList products={products} isLoading={productsLoading} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
              <Route path="/orders" element={token ? <Orders token={token} /> : <ProductList products={products} isLoading={productsLoading} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
              <Route path="/wishlist" element={token ? <Wishlist addToCart={addToCart} /> : <ProductList products={products} isLoading={productsLoading} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
              <Route
                path="/add-product"
                element={
                  token ? (
                    <AddProductForm token={token} onProductAdded={fetchProducts} />
                  ) : (
                    <ProductList
                      products={products}
                      isLoading={productsLoading}
                      addToCart={addToCart}
                      token={token}
                      onLoginRequired={() => setLoginDialogOpen(true)}
                    />
                  )
                }
              />
              <Route path="/cart" element={token ? <Cart cart={cart} setCart={setCart} onCheckout={handleCheckout} /> : <ProductList products={products} isLoading={productsLoading} addToCart={addToCart} token={token} onLoginRequired={() => setLoginDialogOpen(true)} />} />
              <Route path="/verify-email" element={<VerifyEmail onOpenLogin={() => setLoginDialogOpen(true)} />} />
              <Route path="/register" element={<RegisterPage setToken={handleLoginSuccess} />} />
            </Routes>

          </main>

          {/* 🤖 Floating AI Shopping Assistant */}
          <AiAssistant />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
