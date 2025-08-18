import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

// Async thunks
export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/skills', { params })
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch skills'
      return rejectWithValue(errorMessage)
    }
  }
)

export const fetchUserSkills = createAsyncThunk(
  'skills/fetchUserSkills',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/skills/my')
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch user skills'
      return rejectWithValue(errorMessage)
    }
  }
)

export const createSkill = createAsyncThunk(
  'skills/createSkill',
  async (skillData, { rejectWithValue }) => {
    try {
      const response = await api.post('/skills', skillData)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create skill'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateSkill = createAsyncThunk(
  'skills/updateSkill',
  async ({ id, skillData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/skills/${id}`, skillData)
      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update skill'
      return rejectWithValue(errorMessage)
    }
  }
)

export const deleteSkill = createAsyncThunk(
  'skills/deleteSkill',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/skills/${id}`)
      return id
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete skill'
      return rejectWithValue(errorMessage)
    }
  }
)

export const fetchMatches = createAsyncThunk(
  'skills/fetchMatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/matches')
      return response.data.matches
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch matches'
      return rejectWithValue(errorMessage)
    }
  }
)

const initialState = {
  skills: [],
  userSkills: [],
  matches: [],
  pagination: null,
  loading: false,
  error: null,
}

const skillSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Skills
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.loading = false
        state.skills = action.payload.skills
        state.pagination = action.payload.pagination
        state.error = null
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch User Skills
      .addCase(fetchUserSkills.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUserSkills.fulfilled, (state, action) => {
        state.loading = false
        state.userSkills = action.payload
        state.error = null
      })
      .addCase(fetchUserSkills.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Create Skill
      .addCase(createSkill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createSkill.fulfilled, (state, action) => {
        state.loading = false
        state.userSkills.unshift(action.payload)
        state.error = null
      })
      .addCase(createSkill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Update Skill
      .addCase(updateSkill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.loading = false
        const index = state.userSkills.findIndex(skill => skill.id === action.payload.id)
        if (index !== -1) {
          state.userSkills[index] = action.payload
        }
        state.error = null
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Delete Skill
      .addCase(deleteSkill.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.loading = false
        state.userSkills = state.userSkills.filter(skill => skill.id !== action.payload)
        state.error = null
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Fetch Matches
      .addCase(fetchMatches.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false
        state.matches = action.payload
        state.error = null
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError } = skillSlice.actions
export default skillSlice.reducer
