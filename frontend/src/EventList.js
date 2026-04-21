import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Button, Grid } from '@mui/material';

const EventsList = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/events')
      .then(res => setEvents(res.data))
      .catch(() => alert('Failed to load events'));
  }, []);

  const handleJoin = async (id) => {
    try {
      await axios.post(`http://localhost:5001/api/events/${id}/join`, {}, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('jwt') },
      });
      alert('Joined event!');
    } catch {
      alert('Failed to join event');
    }
  };

  return (
    <Grid container spacing={2}>
      {events.map(event => (
        <Grid item xs={12} md={4} key={event._id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{event.title}</Typography>
              <Typography variant="body2" mb={1}>{event.description}</Typography>
              <Typography variant="caption">
                Date: {new Date(event.date).toLocaleDateString()}
              </Typography><br/>
              <Typography variant="caption" mb={1}>
                Created by: {event.createdBy.name}
              </Typography><br/>
              <Button variant="contained" onClick={() => handleJoin(event._id)}>Join Event</Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default EventsList;
