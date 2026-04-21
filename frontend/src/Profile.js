import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  Grid,
  Divider
} from '@mui/material';

const Profile = ({ token }) => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    profilePhoto: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Please login to view profile');
      return;
    }

    axios.get('http://localhost:5001/api/users/profile', {
      headers: { Authorization: 'Bearer ' + token }
    })
    .then(res => {
      setUser(res.data);
      setForm({
        name: res.data.name || '',
        phone: res.data.phone || '',
        bio: res.data.bio || '',
        profilePhoto: res.data.profilePhoto || '',
        address: res.data.address || { street: '', city: '', state: '', pincode: '' }
      });
    })
    .catch(err => {
      console.error('Profile error:', err);
      setError(err.response?.data?.msg || 'Failed to load profile');
    });
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setForm({
        ...form,
        address: { ...form.address, [addressField]: value }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5001/api/users/profile', form, {
        headers: { Authorization: 'Bearer ' + token }
      });
      alert('Profile updated!');
      setEditMode(false);
      // Refresh user data
      const res = await axios.get('http://localhost:5001/api/users/profile', {
        headers: { Authorization: 'Bearer ' + token }
      });
      setUser(res.data);
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.msg || err.message));
    }
  };

  if (error) return <Typography color="error">{error}</Typography>;
  if (!user) return <Typography>Loading...</Typography>;

  if (editMode) {
    return (
      <Box component="form" onSubmit={handleUpdate} sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
        <Typography variant="h5" mb={3}>Edit Profile</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Profile Photo URL"
              name="profilePhoto"
              value={form.profilePhoto}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Bio"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Street Address"
              name="address.street"
              value={form.address.street}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="City"
              name="address.city"
              value={form.address.city}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="State"
              name="address.state"
              value={form.address.state}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Pincode"
              name="address.pincode"
              value={form.address.pincode}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" type="submit">Save</Button>
          <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={user.profilePhoto}
              alt={user.name}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            <Box>
              <Typography variant="h4">{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
              <Typography variant="caption" color="text.secondary">Role: {user.role}</Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {user.bio && (
            <>
              <Typography variant="h6" mb={1}>Bio</Typography>
              <Typography variant="body1" mb={2}>{user.bio}</Typography>
            </>
          )}

          <Typography variant="h6" mb={1}>Contact Information</Typography>
          <Typography><strong>Phone:</strong> {user.phone || 'Not provided'}</Typography>
          
          <Typography variant="h6" mt={2} mb={1}>Address</Typography>
          {user.address?.street ? (
            <>
              <Typography>{user.address.street}</Typography>
              <Typography>{user.address.city}, {user.address.state} - {user.address.pincode}</Typography>
            </>
          ) : (
            <Typography color="text.secondary">No address provided</Typography>
          )}

          <Button variant="contained" sx={{ mt: 3 }} onClick={() => setEditMode(true)}>
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
