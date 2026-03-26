import { createSlice } from "@reduxjs/toolkit";

const graphSlice = createSlice({
    name: "graph",
    initialState: {
        nodes: [],
        edges: [],
        stats: { totalNodes: 0, totalEdges: 0 },
        loading: false,
        error: null,
    },
    reducers: {
        setGraph: (state, action) => {
            state.nodes = action.payload.nodes
            state.edges = action.payload.edges
            state.stats = action.payload.stats
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
    }
})

export const { setGraph, setLoading, setError } = graphSlice.actions
export default graphSlice.reducer