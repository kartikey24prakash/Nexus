import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCollections } from '../hook/useCollections'
import './collections.css'

const COLORS = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B']

export default function Collections() {
    const navigate = useNavigate()
    const { collections, loading, handleGetCollections, handleCreateCollection, handleDeleteCollection } = useCollections()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', color: '#F97316' })

    useEffect(() => {
        handleGetCollections()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        await handleCreateCollection(form)
        setForm({ name: '', description: '', color: '#F97316' })
        setShowForm(false)
    }

    return (
        <div className="collections-page">
            {/* ── Topbar ── */}
            <div className="collections-topbar">
                <span className="collections-logo">Collections</span>
                <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕' : '+ New'}
                </button>
            </div>

            {/* ── Create form ── */}
            {showForm && (
                <form className="collection-form" onSubmit={handleSubmit}>
                    <input
                        className="collection-input"
                        type="text"
                        placeholder="Collection name"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        required
                        autoFocus
                    />
                    <input
                        className="collection-input"
                        type="text"
                        placeholder="Description (optional)"
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    />
                    <div className="color-picker">
                        {COLORS.map(c => (
                            <div
                                key={c}
                                className={`color-dot ${form.color === c ? 'selected' : ''}`}
                                style={{ background: c }}
                                onClick={() => setForm(p => ({ ...p, color: c }))}
                            />
                        ))}
                    </div>
                    <button className="save-btn" type="submit" disabled={loading}>
                        Create
                    </button>
                </form>
            )}

            {/* ── Collections list ── */}
            <div className="collections-list">
                {loading && <div className="collections-empty">Loading...</div>}

                {!loading && collections.length === 0 && (
                    <div className="collections-empty">
                        No collections yet. Create one above.
                    </div>
                )}

                {collections.map(col => (
                    <div
                        key={col._id}
                        className="collection-card"
                        onClick={() => navigate(`/collections/${col._id}`)}
                    >
                        <div className="collection-dot" style={{ background: col.color }} />
                        <div className="collection-info">
                            <div className="collection-name">{col.name}</div>
                            {col.description && (
                                <div className="collection-desc">{col.description}</div>
                            )}
                        </div>
                        <div className="collection-count">{col.itemCount || 0} items</div>
                        <button
                            className="collection-delete"
                            onClick={e => { e.stopPropagation(); handleDeleteCollection(col._id) }}
                        >×</button>
                    </div>
                ))}
            </div>

            {/* ── Bottom nav ── */}
            <div className="bottom-nav">
                <div className="nav-item" onClick={() => navigate('/')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="#333"/><rect x="11" y="2" width="7" height="7" rx="2" fill="#333"/><rect x="2" y="11" width="7" height="7" rx="2" fill="#333"/><rect x="11" y="11" width="7" height="7" rx="2" fill="#333"/></svg>
                    <span className="nav-label">Feed</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/search')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="#444" strokeWidth="1.5"/><path d="M14 14l4 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="nav-label">Search</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/graph')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="2.5" fill="#444"/><circle cx="15" cy="5" r="2.5" fill="#444"/><circle cx="15" cy="15" r="2.5" fill="#444"/><path d="M7.5 9L12.5 6M7.5 11L12.5 14" stroke="#444" strokeWidth="1"/></svg>
                    <span className="nav-label">Graph</span>
                </div>
                <div className="nav-item active" onClick={() => navigate('/collections')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#F97316" strokeWidth="1.5"/><path d="M7 5V4M13 5V4" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="nav-label active">Collections</span>
                </div>
            </div>
        </div>
    )
}