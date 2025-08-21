import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

// Async thunks
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await api.post('/reviews', reviewData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create review')
    }
  }
)

export const fetchMyReviews = createAsyncThunk(
  'reviews/fetchMyReviews',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/my?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch reviews')
    }
  }
)

export const fetchUserReviews = createAsyncThunk(
  'reviews/fetchUserReviews',
  async ({ userId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/user/${userId}?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user reviews')
    }
  }
)

export const fetchUserRating = createAsyncThunk(
  'reviews/fetchUserRating',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/reviews/user/${userId}/rating`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch user rating')
    }
  }
)

export const fetchPendingReviews = createAsyncThunk(
  'reviews/fetchPendingReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/reviews/pending')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pending reviews')
    }
  }
)

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ reviewId, reviewData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update review')
    }
  }
)

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`)
      return { reviewId, message: response.data.message }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete review')
    }
  }
)

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    myReviews: [],
    userReviews: [],
    pendingReviews: [],
    userRating: null,
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_items: 0,
      per_page: 10
    },
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearReviews: (state) => {
      state.myReviews = []
      state.userReviews = []
      state.pendingReviews = []
      state.userRating = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Review
      .addCase(createReview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false
        state.myReviews.unshift(action.payload)
        // Remove from pending reviews
        state.pendingReviews = state.pendingReviews.filter(
          exchange => exchange.id !== action.payload.exchange_id
        )
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch My Reviews
      .addCase(fetchMyReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.loading = false
        state.myReviews = action.payload.reviews
        state.pagination = action.payload.pagination
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch User Reviews
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserReviews.fulfilled, (state, action) => {
        state.loading = false
        state.userReviews = action.payload.reviews
        state.pagination = action.payload.pagination
      })
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch User Rating
      .addCase(fetchUserRating.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserRating.fulfilled, (state, action) => {
        state.loading = false
        state.userRating = action.payload
      })
      .addCase(fetchUserRating.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Pending Reviews
      .addCase(fetchPendingReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPendingReviews.fulfilled, (state, action) => {
        state.loading = false
        state.pendingReviews = action.payload.exchanges
      })
      .addCase(fetchPendingReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update Review
      .addCase(updateReview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false
        const index = state.myReviews.findIndex(review => review.id === action.payload.id)
        if (index !== -1) {
          state.myReviews[index] = action.payload
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Delete Review
      .addCase(deleteReview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false
        state.myReviews = state.myReviews.filter(review => review.id !== action.payload.reviewId)
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, clearReviews } = reviewSlice.actions
export default reviewSlice.reducer
