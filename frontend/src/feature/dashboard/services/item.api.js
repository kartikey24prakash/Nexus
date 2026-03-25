import axios from 'axios'

const api = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true,
})

export async function getItems({ type, collection, page = 1, limit = 20 } = {}) {
    const params = { page, limit }
    if (type) params.type = type
    if (collection) params.collection = collection

    const response = await api.get('/api/items', { params })
    return response.data
}

export async function saveItem({ url, type, collectionId }) {
    const response = await api.post('/api/items', { url, type, collectionId })
    return response.data
}

export async function getItemById(id) {
    const response = await api.get(`/api/items/${id}`)
    return response.data
}

export async function deleteItem(id) {
    const response = await api.delete(`/api/items/${id}`)
    return response.data
}

export async function addHighlight(id, { text, note }) {
    const response = await api.patch(`/api/items/${id}/highlight`, { text, note })
    return response.data
}

export async function deleteHighlight(id, highlightId) {
    const response = await api.delete(`/api/items/${id}/highlight/${highlightId}`)
    return response.data
}