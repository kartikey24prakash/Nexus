import { useDispatch, useSelector } from "react-redux";
import { getResurfaceItem } from "../services/resurface.api";
import { setResurfaceItem, setLoading, setError } from "../services/resurface.slice";

export function useResuface() {
    const dispatch = useDispatch();
    const { item, loading, error } = useSelector(s => s.resurface);

    async function handleGetResuface() {
        try {
            dispatch(setLoading(true));
            const data = await getResurfaceItem();
            dispatch(setResurfaceItem(data.item));
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to get resurface item"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    return {
        resurfaceItem: item,
        loading,
        error,
        handleGetResuface,
    };
}