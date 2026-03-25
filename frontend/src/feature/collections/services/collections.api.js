import axios from 'axios'

const api = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true,
})

export async function getCollections() {
    const response = await api.get('/api/collections')
    return response.data
}

export async function getCollectionById(id) {
    const response = await api.get(`/api/collections/${id}`)
    return response.data
}

export async function createCollection({ name, description, color }) {
    const response = await api.post('/api/collections', { name, description, color })
    return response.data
}

export async function deleteCollection(id) {
    const response = await api.delete(`/api/collections/${id}`)
    return response.data
}

export async function addItemToCollection(collectionId, itemId) {
    const response = await api.patch(`/api/collections/${collectionId}/add-item`, { itemId })
    return response.data
}

export async function removeItemFromCollection(collectionId, itemId) {
    const response = await api.patch(`/api/collections/${collectionId}/remove-item`, { itemId })
    return response.data
}