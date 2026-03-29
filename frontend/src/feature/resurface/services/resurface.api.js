import api from '../../../app/api'

export async function getResurfaceItem() {
    const response = await api.get('/api/resurface')
    return response.data
}
