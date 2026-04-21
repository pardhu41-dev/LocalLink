import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Button,
  Slide,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const Cart = ({ cart, setCart, onCheckout }) => {
  if (cart.length === 0)
    return (
      <Typography
        variant="h6"
        align="center"
        sx={{ mt: 4, fontWeight: "bold", color: "text.secondary" }}
      >
        Your cart is empty
      </Typography>
    );

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleRemove = (id) => {
    setCart(cart.filter((item) => item.product._id !== id));
  };

  return (
    <Box sx={{ mt: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Your Shopping Cart
      </Typography>
      <List>
        {cart.map(({ product, quantity }, index) => (
          <Slide
            direction="up"
            in={true}
            mountOnEnter
            unmountOnExit
            key={product._id}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <ListItem
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="remove"
                  onClick={() => handleRemove(product._id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
              divider
            >
              <ListItemText
                primary={`${product.name} x ${quantity}`}
                secondary={`Price: ₹${product.price * quantity}`}
              />
            </ListItem>
          </Slide>
        ))}
      </List>
      <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>
        Total: ₹{total}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => onCheckout(total)}
        fullWidth
        sx={{ mt: 2 }}
      >
        Place Order
      </Button>
    </Box>
  );
};

export default Cart;
