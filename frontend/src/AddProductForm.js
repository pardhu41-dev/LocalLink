import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";

const AddProductForm = ({ token }) => {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    availableQty: "",
    listingType: "SELL", // Default
  });

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5001/api/products", product, {
        headers: { Authorization: "Bearer " + token },
      });
      alert("Product added!");
      setProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        imageUrl: "",
        availableQty: "",
        listingType: "SELL",
      });
    } catch (err) {
      alert(err.response?.data?.msg || "Add product failed");
    }
  };

  return (
    <Fade in>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 600,
          mx: "auto",
          my: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5">Add New Product</Typography>

        <TextField
          name="name"
          label="Name"
          value={product.name}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          name="description"
          label="Description"
          value={product.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
        />
        <TextField
          name="price"
          label="Price"
          type="number"
          value={product.price}
          onChange={handleChange}
          required
          fullWidth
        />
        <TextField
          name="category"
          label="Category"
          value={product.category}
          onChange={handleChange}
          fullWidth
        />

        <TextField
          name="imageUrl"
          label="Image URL"
          value={product.imageUrl}
          onChange={handleChange}
          fullWidth
        />

        <TextField
          name="availableQty"
          label="Available Quantity"
          type="number"
          value={product.availableQty}
          onChange={handleChange}
          fullWidth
        />

        <FormControl fullWidth required>
          <InputLabel>Listing Type</InputLabel>
          <Select
            name="listingType"
            value={product.listingType}
            label="Listing Type"
            onChange={handleChange}
            required
          >
            <MenuItem value="SELL">Sell</MenuItem>
            <MenuItem value="BUY">Buy</MenuItem>
            <MenuItem value="SHARE">Share</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" type="submit">
          Add Product
        </Button>
      </Box>
    </Fade>
  );
};

export default AddProductForm;
