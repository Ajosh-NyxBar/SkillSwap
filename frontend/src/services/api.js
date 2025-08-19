import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Chat API functions
export const chatAPI = {
  // Get all chat rooms for current user
  getChatRooms: () => api.get('/chat/rooms'),
  
  // Create a new chat room
  createChatRoom: (data) => api.post('/chat/rooms', data),
  
  // Get messages in a chat room
  getMessages: (roomId, params = {}) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  
  // Send a message
  sendMessage: (roomId, data) => api.post(`/chat/rooms/${roomId}/messages`, data),
  
  // Mark messages as read
  markMessagesAsRead: (roomId) => api.put(`/chat/rooms/${roomId}/read`),
  
  // Delete chat room
  deleteChatRoom: (roomId) => api.delete(`/chat/rooms/${roomId}`)
}

// Exchange API functions
export const exchangeAPI = {
  // Create a new exchange request
  createExchange: (data) => api.post('/exchanges', data),
  
  // Get exchanges (sent, received, or all)
  getExchanges: (type = '') => api.get('/exchanges', { params: type ? { type } : {} }),
  
  // Get exchange by ID
  getExchangeById: (id) => api.get(`/exchanges/${id}`),
  
  // Update exchange status
  updateExchangeStatus: (id, data) => api.put(`/exchanges/${id}/status`, data)
}

// Match API functions
export const matchAPI = {
  // Get skill matches for current user
  getMatches: () => api.get('/matches')
}
