import { createSlice } from "@reduxjs/toolkit";

const itemsSlice = createSlice({
    name: "items",
    initialState: {
        items: [],
        loading: false,
        error: null,
        pagination: {
            total: 0,
            page: 1,
            pages: 1,
        }
    },
    reducers: {
        setItems: (state, action) => {
            state.items = action.payload
        },
        addItem: (state, action) => {
            state.items.unshift(action.payload) // add to top of feed
        },
        removeItem: (state, action) => {
            state.items = state.items.filter(item => item._id !== action.payload)
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        setPagination: (state, action) => {
            state.pagination = action.payload
        },
        clearItems: (state) => {
            state.items = []
            state.error = null
        }
    }
})

export const {
    setItems,
    addItem,
    removeItem,
    setLoading,
    setError,
    setPagination,
    clearItems
} = itemsSlice.actions

export default itemsSlice.reducer