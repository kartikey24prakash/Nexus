import axios from 'axios'

const api = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true,
})

export async function getResurfaceItem() {
    const response = await api.get('/api/resurface')
    return response.data
}