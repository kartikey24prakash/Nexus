import { createSlice } from "@reduxjs/toolkit";

const resurfaceSlice = createSlice({
    name: "resurface",
    initialState: {
        item: null,
        loading: false,
        error: null,
    },
    reducers: {
        setResurfaceItem: (state, action) => {
            state.item = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
    }
})

export const { setResurfaceItem, setLoading, setError } = resurfaceSlice.actions
export default resurfaceSlice.reducer