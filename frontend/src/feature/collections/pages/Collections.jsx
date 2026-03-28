import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import AppShell from '../../../app/components/AppShell'
import { useCollections } from '../hook/useCollections'
import './collections.css'

const COLORS = ['#4FA6FF', '#7FD4FF', '#3B82F6', '#8B5CF6', '#22C55E', '#A78BFA']

export default function Collections() {
    const navigate = useNavigate()
    const { collections, loading, handleGetCollections, handleCreateCollection, handleDeleteCollection } = useCollections()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', description: '', color: '#4FA6FF' })

    useEffect(() => {
        handleGetCollections()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        await handleCreateCollection(form)
        setForm({ name: '', description: '', color: '#4FA6FF' })
        setShowForm(false)
    }

    return (
        <AppShell
            title="Collections"
            subtitle="Group related saves into focused clusters you can return to later."
            actions={
                <button className="add-btn" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Close' : '+ New Collection'}
                </button>
            }
        >
            <div className="collections-page">
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
                            Create Collection
                        </button>
                    </form>
                )}

                <div className="collections-list">
                    {loading && <div className="collections-empty">Loading...</div>}

                    {!loading && collections.length === 0 && (
                        <div className="collections-empty">
                            No collections yet. Create your first one above.
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
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AppShell>
    )
}
