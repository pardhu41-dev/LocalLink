import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Card, CardContent, Chip, Stepper, Step, StepLabel, 
  Accordion, AccordionSummary, AccordionDetails 
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';


const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Please login to view orders');
      return;
    }

    axios.get('http://localhost:5001/api/orders', {
      headers: { Authorization: 'Bearer ' + token }
    })
    .then(res => setOrders(res.data))
    .catch(err => {
      console.error('Orders error:', err);
      setError(err.response?.data?.msg || 'Failed to load orders');
    });
  }, [token]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'warning';
      case 'Processing': return 'info';
      case 'Shipped': return 'primary';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const statusSteps = ['Pending', 'Processing', 'Shipped', 'Delivered'];

  if (error) return <Typography color="error">{error}</Typography>;
  if (orders.length === 0) return <Typography>No orders placed yet.</Typography>;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', my: 4 }}>
      <Typography variant="h4" mb={3}>Your Orders</Typography>
      
      {orders.map(order => {
        const activeStep = statusSteps.indexOf(order.status);
        
        return (
          <Card key={order._id} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Order #{order._id.slice(-8)}</Typography>
                <Chip label={order.status} color={getStatusColor(order.status)} />
              </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                Placed on: {new Date(order.createdAt).toLocaleDateString()}
              </Typography>

              <Typography variant="h6" mb={2}>Total: ₹{order.total}</Typography>

              {/* Order Progress Stepper */}
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                {statusSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* Order Items Accordion */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography>Order Items ({order.products.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {order.products.map((item, idx) => (
                    <Box key={idx} sx={{ mb: 1 }}>
                      <Typography>
                        {item.product?.name || 'Product'} x {item.quantity}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>

              {/* Tracking Timeline */}
              {order.trackingUpdates && order.trackingUpdates.length > 0 && (
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Tracking History</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {order.trackingUpdates.slice().reverse().map((update, idx) => (
                      <Box key={idx} sx={{ mb: 2, pb: 2, borderBottom: idx < order.trackingUpdates.length - 1 ? '1px solid #eee' : 'none' }}>
                        <Typography variant="subtitle2" color="primary">{update.status}</Typography>
                        <Typography variant="body2">{update.message}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(update.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default Orders;
