import { useDispatch, useSelector } from "react-redux";
import { getItems, saveItem, deleteItem, saveFile} from "../services/item.api";
import { setItems, addItem, removeItem, setLoading, setError, setPagination } from "../services/item.slice";
import toast from "react-hot-toast";

export function useItems() {
    const dispatch = useDispatch();
    const { items, loading, error, pagination } = useSelector(s => s.items);

    async function handleGetItems(filters = {}) {
        try {
            dispatch(setLoading(true));
            const data = await getItems(filters);
            dispatch(setItems(data.items));
            dispatch(setPagination(data.pagination));
        } catch (err) {
            dispatch(setError(err.response?.data?.message || "Failed to fetch items"));
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleSaveItem(url) {
        try {
            dispatch(setLoading(true));
            const data = await saveItem({ url });
            dispatch(addItem(data.item));
            toast.success("Saved to Nexus!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save item");
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleDeleteItem(id) {
        try {
            await deleteItem(id);
            dispatch(removeItem(id));
            toast.success("Item deleted");
        } catch (err) {
            toast.error("Failed to delete item");
        }
    }


    async function handleSaveFile(file) {
        try {
            dispatch(setLoading(true))
            const data = await saveFile(file)
            dispatch(addItem(data.item))
            toast.success('File saved to Nexus!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save file')
        } finally {
            dispatch(setLoading(false))
        }
    }

    
    return {
        items,
        loading,
        error,
        pagination,
        handleGetItems,
        handleSaveItem,
        handleDeleteItem,
        handleSaveFile,
    };
}