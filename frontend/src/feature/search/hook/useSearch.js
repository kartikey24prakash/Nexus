import { useDispatch, useSelector } from "react-redux";
import { semanticSearch, keywordSearch } from "../services/search.api";
import {
    setKeywordResults,
    setSemanticResults,
    setLoading,
    setError,
    setQuery,
    clearResults
} from "../services/search.slice";

export function useSearch() {
    const dispatch = useDispatch();
    const { keywordResults, semanticResults, loading, error, query } = useSelector(s => s.search);

    async function handleSearch(q) {
        if (!q.trim()) return
        dispatch(setQuery(q))
        dispatch(setLoading(true))

        try {
            // run both in parallel
            const [keywordData, semanticData] = await Promise.all([
                keywordSearch({ q }),
                semanticSearch({ query: q }),
            ])
            dispatch(setKeywordResults(keywordData.results))
            dispatch(setSemanticResults(semanticData.results))
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Search failed"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    function handleClear() {
        dispatch(clearResults())
    }

    return {
        keywordResults,
        semanticResults,
        loading,
        error,
        query,
        handleSearch,
        handleClear,
    }
}