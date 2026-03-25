import { createSlice } from "@reduxjs/toolkit";

const searchSlice = createSlice({
    name: "search",
    initialState: {
        keywordResults: [],
        semanticResults: [],
        loading: false,
        error: null,
        query: "",
    },
    reducers: {
        setKeywordResults: (state, action) => {
            state.keywordResults = action.payload
        },
        setSemanticResults: (state, action) => {
            state.semanticResults = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        setError: (state, action) => {
            state.error = action.payload
        },
        setQuery: (state, action) => {
            state.query = action.payload
        },
        clearResults: (state) => {
            state.keywordResults = []
            state.semanticResults = []
            state.error = null
            state.query = ""
        }
    }
})

export const {
    setKeywordResults,
    setSemanticResults,
    setLoading,
    setError,
    setQuery,
    clearResults
} = searchSlice.actions

export default searchSlice.reducer