import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Fade, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';

const AuthForms = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', isSeller: false });
  const [fadeIn, setFadeIn] = useState(true);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await axios.post('http://localhost:5001/api/users/login', {
          email: form.email,
          password: form.password
        });
        setToken(res.data.token);
      } else {
        await axios.post('http://localhost:5001/api/users/register', form);
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Error');
    }
  };

  const toggleForm = () => {
    setFadeIn(false);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setFadeIn(true);
    }, 300);
  };

  return (
    <Fade in={fadeIn}>
      <Box component="form" onSubmit={handleSubmit} maxWidth={400} mx="auto" display="flex" flexDirection="column" gap={2} mt={4}>
        <Typography variant="h5">{isLogin ? 'Login' : 'Register'}</Typography>
        {!isLogin && (
          <>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
            <FormControlLabel
              control={<Checkbox checked={form.isSeller} onChange={handleChange} name="isSeller" />}
              label="I'm a Seller"
            />
          </>
        )}
        <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth />
        <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth />
        <Button variant="contained" type="submit" fullWidth>{isLogin ? 'Login' : 'Register'}</Button>
        <Button variant="text" onClick={toggleForm} fullWidth color="primary">
          {isLogin ? 'Need to register?' : 'Have an account? Login'}
        </Button>
      </Box>
    </Fade>
  );
};

export default AuthForms;
