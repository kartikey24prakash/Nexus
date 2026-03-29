import api from '../../../app/api'

export async function semanticSearch({ query, type, collection }) {
    const response = await api.post('/api/search', { query, type, collection })
    return response.data
}

export async function keywordSearch({ q, type }) {
    const response = await api.get('/api/search/keyword', { params: { q, type } })
    return response.data
}

export async function askQuestion({ question, type, collection, itemId }) {
    const response = await api.post('/api/chat/ask', { question, type, collection, itemId })
    return response.data
}
