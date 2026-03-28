import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import AppShell from '../../../app/components/AppShell'
import ItemCard from '../components/ItemCard'
import { useItems } from '../hook/useItems'
import { useResuface } from '../../resurface/hook/useResuface'
import './dashboard.css'

export default function Dashboard() {
    const navigate = useNavigate()
    const [url, setUrl] = useState('')
    const fileInputRef = useRef(null)
    const { items, loading, handleGetItems, handleSaveItem, handleDeleteItem, handleSaveFile } = useItems()
    const { resurfaceItem, handleGetResuface } = useResuface()

    useEffect(() => {
        handleGetItems()
        handleGetResuface()
    }, [])

    const handleSave = async (e) => {
        e.preventDefault()
        if (!url.trim()) return
        await handleSaveItem(url.trim())
        setUrl('')
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        await handleSaveFile(file)
        e.target.value = ''
    }

    return (
        <AppShell
            title="Your Living Workspace"
            subtitle={`${items.length} saved item${items.length === 1 ? '' : 's'} connected across search, ask, collections, and graph.`}
        >
            <div className="dashboard">
                <form className="save-bar" onSubmit={handleSave}>
                    <input
                        className="save-input"
                        type="url"
                        placeholder="Paste a URL to save..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <button
                        type="button"
                        className="upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Attach
                    </button>
                    <button className="save-btn" type="submit" disabled={loading}>
                        {loading ? '...' : 'Save'}
                    </button>
                </form>

                {resurfaceItem && (
                    <div className="resurface-card" onClick={() => navigate(`/item/${resurfaceItem._id}`)}>
                        <div className="resurface-icon">Re</div>
                        <div>
                            <div className="resurface-label">
                                FROM {Math.floor((Date.now() - new Date(resurfaceItem.createdAt)) / 86400000)} DAYS AGO
                            </div>
                            <div className="resurface-title">{resurfaceItem.title}</div>
                            <div className="resurface-meta">
                                {resurfaceItem.type} · saved {new Date(resurfaceItem.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                )}

                <div className="section-label">Recent Saves</div>

                {loading && <div className="dashboard-loading">Loading...</div>}

                {!loading && items.length === 0 && (
                    <div className="dashboard-empty">
                        <p>No saves yet. Paste a URL above to get started.</p>
                    </div>
                )}

                <div className="feed">
                    {items.map((item) => (
                        <ItemCard key={item._id} item={item} onDelete={handleDeleteItem} />
                    ))}
                </div>
            </div>
        </AppShell>
    )
}
