import { createSlice } from "@reduxjs/toolkit";

const collectionsSlice = createSlice({
    name: "collections",
    initialState: {
        collections: [],
        activeCollection: null,
        loading: false,
        error: null,
    },
    reducers: {
        setCollections: (state, action) => {
            state.collections = action.payload
        },
        addCollection: (state, action) => {
            state.collections.unshift(action.payload)
        },
        removeCollection: (state, action) => {
            state.collections = state.collections.filter(c => c._id !== action.payload)
        },
        setActiveCollection: (state, action) => {
            state.activeCollection = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
    }
})

export const {
    setCollections,
    addCollection,
    removeCollection,
    setActiveCollection,
    setLoading,
    setError,
} = collectionsSlice.actions

export default collectionsSlice.reducer