import api from '../../../app/api'

export async function getGraph() {
    const response = await api.get('/api/graph')
    return response.data
}

export async function getClusters() {
    const response = await api.get('/api/graph/clusters')
    return response.data
}
