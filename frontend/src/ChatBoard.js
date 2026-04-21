import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, List, ListItem, ListItemText, TextField, Button, Typography, Paper } from '@mui/material';

const ChatBoard = ({ listingId, token }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const fetchMessages = async () => {
    try {
      const url = listingId 
        ? `http://localhost:5001/api/messages?listingId=${listingId}` 
        : 'http://localhost:5001/api/messages';
      const res = await axios.get(url);
      setMessages(res.data);
    } catch {
      console.error('Failed to load messages');
    }
  };

  useEffect(() => {
  fetchMessages();
  const interval = setInterval(fetchMessages, 5000);
  return () => clearInterval(interval);
}, [listingId]); // Add fetchMessages here if needed

  const sendMessage = async () => {
    try {
      if (!input.trim()) return;
      await axios.post('http://localhost:5001/api/messages', 
        { content: input, listingId }, 
        { headers: { Authorization: 'Bearer ' + token } }
      );
      setInput('');
      fetchMessages();
    } catch {
      alert('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h5" mb={2}>Community Chat</Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <List sx={{ 
          height: 400, 
          overflowY: 'auto', 
          mb: 2,
          bgcolor: 'background.paper'
        }}>
          {messages.length === 0 ? (
            <Typography color="text.secondary" align="center" mt={3}>
              No messages yet. Start the conversation!
            </Typography>
          ) : (
            messages.map((msg) => (
              <ListItem key={msg._id} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" color="primary">
                      {msg.sender.name}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body1" component="span" display="block">
                        {msg.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.createdAt).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!token}
          />
          <Button 
            variant="contained" 
            onClick={sendMessage}
            disabled={!token || !input.trim()}
          >
            Send
          </Button>
        </Box>
        {!token && (
          <Typography variant="caption" color="error" mt={1}>
            Please login to send messages
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ChatBoard;
