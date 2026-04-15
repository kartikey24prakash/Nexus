import { useDispatch, useSelector } from "react-redux";
import { getGraph } from "../services/graph.api";
import { setGraph, setLoading, setError } from "../services/graph.slice";

export function useGraph() {
    const dispatch = useDispatch();
    const { nodes, edges, stats, loading, error } = useSelector(s => s.graph);

    async function handleGetGraph(options = {}) {
        const { force = false } = options;

        if (loading) return;

        const hasCachedGraph =
            nodes.length > 0 ||
            edges.length > 0 ||
            (stats?.totalNodes || 0) > 0 ||
            (stats?.totalEdges || 0) > 0;

        if (!force && hasCachedGraph) {
            return;
        }

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
