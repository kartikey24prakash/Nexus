import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useItems } from '../hook/useItems'
import { useResuface } from '../../resurface/hook/useResuface'
import ItemCard from '../components/ItemCard'
import './dashboard.css'
export default function Dashboard() {
    const navigate = useNavigate()
    const [url, setUrl] = useState('')
    const { items, loading, handleGetItems, handleSaveItem, handleDeleteItem ,handleSaveFile} = useItems()
    const { resurfaceItem, handleGetResuface } = useResuface()
    const fileInputRef = useRef(null)

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
        <div className="dashboard">
            {/* ── Top bar ── */}
            <div className="dashboard-topbar">
                <span className="dashboard-logo">Nexus</span>
                <span className="dashboard-count">{items.length} saved</span>
                
            </div>

            {/* ── Main content ── */}
            <div className="dashboard-main">

                {/* Save bar */}
                <form className="save-bar" onSubmit={handleSave}>
                    <input
                        className="save-input"
                        type="url"
                        placeholder="Paste a URL to save..."
                        value={url}
                        onChange={e => setUrl(e.target.value)}
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
                        onClick={() => fileInputRef.current.click()}
                    >
                        📎
                    </button>
                    <button className="save-btn" type="submit" disabled={loading}>
                        {loading ? '...' : 'Save'}
                    </button>
                </form>

                {/* Resurfacing card */}
                {resurfaceItem && (
                    <div className="resurface-card" onClick={() => navigate(`/item/${resurfaceItem._id}`)}>
                        <div className="resurface-icon">↻</div>
                        <div>
                            <div className="resurface-label">FROM {Math.floor((Date.now() - new Date(resurfaceItem.createdAt)) / 86400000)} DAYS AGO</div>
                            <div className="resurface-title">{resurfaceItem.title}</div>
                            <div className="resurface-meta">{resurfaceItem.type} · saved {new Date(resurfaceItem.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                )}

                {/* Feed */}
                <div className="section-label">RECENT SAVES</div>

                {loading && <div className="dashboard-loading">Loading...</div>}

                {!loading && items.length === 0 && (
                    <div className="dashboard-empty">
                        <p>No saves yet. Paste a URL above to get started.</p>
                    </div>
                )}

                <div className="feed">
                    {items.map(item => (
                        <ItemCard
                            key={item._id}
                            item={item}
                            onDelete={handleDeleteItem}
                        />
                    ))}
                </div>
            </div>

            {/* ── Bottom nav ── */}
            <div className="bottom-nav">
                <div className="nav-item active" onClick={() => navigate('/')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="#F97316" /><rect x="11" y="2" width="7" height="7" rx="2" fill="#333" /><rect x="2" y="11" width="7" height="7" rx="2" fill="#333" /><rect x="11" y="11" width="7" height="7" rx="2" fill="#333" /></svg>
                    <span className="nav-label active">Feed</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/search')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="#444" strokeWidth="1.5" /><path d="M14 14l4 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <span className="nav-label">Search</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/graph')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="2.5" fill="#444" /><circle cx="15" cy="5" r="2.5" fill="#444" /><circle cx="15" cy="15" r="2.5" fill="#444" /><path d="M7.5 9L12.5 6M7.5 11L12.5 14" stroke="#444" strokeWidth="1" /></svg>
                    <span className="nav-label">Graph</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/collections')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#444" strokeWidth="1.5" /><path d="M7 5V4M13 5V4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <span className="nav-label">Collections</span>
                </div>
            </div>
        </div>
    )
}