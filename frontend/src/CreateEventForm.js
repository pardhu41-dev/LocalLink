import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, Typography } from '@mui/material';

const CreateEventForm = () => {
  const [form, setForm] = useState({ title: '', description: '', date: '' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/events', form, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('jwt') },
      });
      alert('Event created!');
      setForm({ title: '', description: '', date: '' });
    } catch {
      alert('Failed to create event');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', my: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5">Create Event</Typography>
      <TextField label="Title" name="title" value={form.title} onChange={handleChange} required />
      <TextField label="Description" name="description" value={form.description} onChange={handleChange} multiline rows={3} />
      <TextField label="Date" type="date" name="date" value={form.date} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
      <Button variant="contained" type="submit">Create Event</Button>
    </Box>
  );
};

export default CreateEventForm;
