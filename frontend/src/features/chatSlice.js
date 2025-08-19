import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { chatAPI } from '../services/api'

// Async thunks
export const fetchChatRooms = createAsyncThunk(
  'chat/fetchChatRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getChatRooms()
      return response.data.chat_rooms
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch chat rooms'
      return rejectWithValue(errorMessage)
    }
  }
)

export const createChatRoom = createAsyncThunk(
  'chat/createChatRoom',
  async (data, { rejectWithValue }) => {
    try {
      const response = await chatAPI.createChatRoom(data)
      return response.data.chat_room
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create chat room'
      return rejectWithValue(errorMessage)
    }
  }
)

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ roomId, params }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getMessages(roomId, params)
      return {
        roomId,
        messages: response.data.messages,
        pagination: response.data.pagination
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch messages'
      return rejectWithValue(errorMessage)
    }
  }
)

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ roomId, data }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.sendMessage(roomId, data)
      return {
        roomId,
        message: response.data.message
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send message'
      return rejectWithValue(errorMessage)
    }
  }
)

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await chatAPI.markMessagesAsRead(roomId)
      return { roomId, ...response.data }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mark messages as read'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteChatRoom = createAsyncThunk(
  'chat/deleteChatRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      await chatAPI.deleteChatRoom(roomId)
      return roomId
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete chat room'
      return rejectWithValue(errorMessage)
    }
  }
)

const initialState = {
  chatRooms: [],
  currentRoom: null,
  messages: {}, // Organized by roomId
  loading: false,
  messagesLoading: false,
  sendingMessage: false,
  error: null,
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentRoom: (state, action) => {
      state.currentRoom = action.payload
    },
    clearCurrentRoom: (state) => {
      state.currentRoom = null
    },
    clearError: (state) => {
      state.error = null
    },
    addMessageToRoom: (state, action) => {
      const { roomId, message } = action.payload
      if (!state.messages[roomId]) {
        state.messages[roomId] = []
      }
      state.messages[roomId].push(message)
    },
    updateRoomLastMessage: (state, action) => {
      const { roomId, lastMessage, lastMessageAt } = action.payload
      const room = state.chatRooms.find(room => room.id === roomId)
      if (room) {
        room.last_message = lastMessage
        room.last_message_at = lastMessageAt
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat rooms
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false
        state.chatRooms = action.payload || []
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create chat room
      .addCase(createChatRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.loading = false
        const existingRoom = state.chatRooms.find(room => room.id === action.payload.id)
        if (!existingRoom) {
          state.chatRooms.unshift(action.payload)
        }
        state.currentRoom = action.payload
      })
      .addCase(createChatRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        const { roomId, messages } = action.payload
        state.messages[roomId] = messages || []
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false
        state.error = action.payload
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false
        const { roomId, message } = action.payload
        
        // Add message to room
        if (!state.messages[roomId]) {
          state.messages[roomId] = []
        }
        state.messages[roomId].push(message)

        // Update room's last message
        const room = state.chatRooms.find(room => room.id === parseInt(roomId))
        if (room) {
          room.last_message = message.content
          room.last_message_at = message.created_at
          
          // Move room to top of list
          const roomIndex = state.chatRooms.findIndex(room => room.id === parseInt(roomId))
          if (roomIndex > 0) {
            const [movedRoom] = state.chatRooms.splice(roomIndex, 1)
            state.chatRooms.unshift(movedRoom)
          }
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false
        state.error = action.payload
      })

      // Mark messages as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { roomId } = action.payload
        if (state.messages[roomId]) {
          state.messages[roomId] = state.messages[roomId].map(message => ({
            ...message,
            is_read: true,
            read_at: new Date().toISOString()
          }))
        }
      })

      // Delete chat room
      .addCase(deleteChatRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteChatRoom.fulfilled, (state, action) => {
        state.loading = false
        const roomId = action.payload
        state.chatRooms = state.chatRooms.filter(room => room.id !== roomId)
        delete state.messages[roomId]
        if (state.currentRoom?.id === roomId) {
          state.currentRoom = null
        }
      })
      .addCase(deleteChatRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  setCurrentRoom,
  clearCurrentRoom,
  clearError,
  addMessageToRoom,
  updateRoomLastMessage
} = chatSlice.actions

export default chatSlice.reducer
