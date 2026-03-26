import axios from 'axios'

const api = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true,
})

export async function getGraph() {
    const response = await api.get('/api/graph')
    return response.data
}

export async function getClusters() {
    const response = await api.get('/api/graph/clusters')
    return response.data
}