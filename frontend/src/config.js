import axios from 'axios';

// Ensure withCredentials is enabled consistently across axios requests
axios.defaults.withCredentials = true;

// API Configuration
const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:5001';
  }
  return 'https://locallink-1.onrender.com';
};

// Strictly remove any trailing slashes to prevent double slashes when appending endpoints
export const API_BASE_URL = getBaseUrl().replace(/\/+$/, '');

// Helper function for API endpoints
export const API = {
  // Products & Listings
  products: `${API_BASE_URL}/api/products`,
  product: (id) => `${API_BASE_URL}/api/products/${id}`,
  listings: `${API_BASE_URL}/api/listings`,
  
  // Users & Auth
  register: `${API_BASE_URL}/api/users/register`,
  login: `${API_BASE_URL}/api/users/login`,
  profile: `${API_BASE_URL}/api/users/profile`,
  verifyEmail: (token) => `${API_BASE_URL}/api/users/verify-email?token=${token}`,
  resendVerification: `${API_BASE_URL}/api/users/resend-verification`,
  sendRegistrationOtp: `${API_BASE_URL}/api/auth/send-registration-otp`,
  verifyRegistrationOtp: `${API_BASE_URL}/api/auth/verify-registration-otp`,
  resendRegistrationOtp: `${API_BASE_URL}/api/auth/resend-registration-otp`,
  forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
  verifyResetOtp: `${API_BASE_URL}/api/auth/verify-reset-otp`,
  resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
  
  // Orders
  orders: `${API_BASE_URL}/api/orders`,
  orderStatus: (id) => `${API_BASE_URL}/api/orders/${id}/status`,
  
  // Events
  events: `${API_BASE_URL}/api/events`,
  event: (id) => `${API_BASE_URL}/api/events/${id}`,
  joinEvent: (id) => `${API_BASE_URL}/api/events/${id}/join`,
  
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
  
  // AI Assistant
  aiRecommend: `${API_BASE_URL}/api/ai/recommend`,

  // Health Check
  health: `${API_BASE_URL}/api/health`
};

export default API;
