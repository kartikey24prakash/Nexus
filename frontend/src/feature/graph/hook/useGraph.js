import { useDispatch, useSelector } from "react-redux";
import { getGraph } from "../services/graph.api";
import { setGraph, setLoading, setError } from "../services/graph.slice";

export function useGraph() {
    const dispatch = useDispatch();
    const { nodes, edges, stats, loading, error } = useSelector(s => s.graph);

    async function handleGetGraph() {
        try {
            dispatch(setLoading(true));
            const data = await getGraph();
            dispatch(setGraph({
                nodes: data.nodes,
                edges: data.edges,
                stats: data.stats,
            }));
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to load graph"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    return {
        nodes,
        edges,
        stats,
        loading,
        error,
        handleGetGraph,
    }
}