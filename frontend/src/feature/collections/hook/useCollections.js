import { useDispatch, useSelector } from "react-redux";
import {
    getCollections,
    getCollectionById,
    createCollection,
    deleteCollection,
} from "../services/collections.api";
import {
    setCollections,
    addCollection,
    removeCollection,
    setActiveCollection,
    setLoading,
    setError,
} from "../services/collections.slice";
import toast from "react-hot-toast";

export function useCollections() {
    const dispatch = useDispatch();
    const { collections, activeCollection, loading, error } = useSelector(s => s.collections);

    async function handleGetCollections() {
        try {
            dispatch(setLoading(true));
            const data = await getCollections();
            dispatch(setCollections(data.collections));
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to fetch collections"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleGetCollectionById(id) {
        try {
            dispatch(setLoading(true));
            const data = await getCollectionById(id);
            dispatch(setActiveCollection(data));
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to fetch collection"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleCreateCollection({ name, description, color }) {
        try {
            dispatch(setLoading(true));
            const data = await createCollection({ name, description, color });
            dispatch(addCollection(data.collection));
            toast.success("Collection created!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create collection");
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleDeleteCollection(id) {
        try {
            await deleteCollection(id);
            dispatch(removeCollection(id));
            toast.success("Collection deleted");
        } catch (err) {
            toast.error("Failed to delete collection");
        }
    }

    return {
        collections,
        activeCollection,
        loading,
        error,
        handleGetCollections,
        handleGetCollectionById,
        handleCreateCollection,
        handleDeleteCollection,
    }
}