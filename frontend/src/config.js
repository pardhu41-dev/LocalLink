// API Configuration
export const API_BASE_URL = 'http://localhost:5001';

// Helper function for API endpoints
export const API = {
  // Products
  products: `${API_BASE_URL}/api/products`,
  product: (id) => `${API_BASE_URL}/api/products/${id}`,
  
  // Users
  register: `${API_BASE_URL}/api/users/register`,
  login: `${API_BASE_URL}/api/users/login`,
  profile: `${API_BASE_URL}/api/users/profile`,
  
  // Orders
  orders: `${API_BASE_URL}/api/orders`,
  orderStatus: (id) => `${API_BASE_URL}/api/orders/${id}/status`,
  
  // Events
  events: `${API_BASE_URL}/api/events`,
  event: (id) => `${API_BASE_URL}/api/events/${id}`,
  
  // Messages
  messages: `${API_BASE_URL}/api/messages`,
  
  // Chat
  chatStart: `${API_BASE_URL}/api/chat/start`,
  chatMessage: `${API_BASE_URL}/api/chat/message`,
  myChats: `${API_BASE_URL}/api/chat/my-chats`,
  
  // Barter
  barterOffer: `${API_BASE_URL}/api/barter/offer`,
  barterReceived: `${API_BASE_URL}/api/barter/received`,
  barterSent: `${API_BASE_URL}/api/barter/sent`,
  barterAction: (id, action) => `${API_BASE_URL}/api/barter/${id}/${action}`,
  
  // Analytics
  analytics: `${API_BASE_URL}/api/analytics/dashboard`,
  
  // Health Check
  health: `${API_BASE_URL}/api/health`
};
