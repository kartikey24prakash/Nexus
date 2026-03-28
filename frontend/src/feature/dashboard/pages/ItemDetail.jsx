import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getItemById, addHighlight, deleteHighlight } from '../services/item.api'
import { useCollections } from '../../collections/hook/useCollections'
import './itemdetail.css'

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf: { bg: '#3f2a00', color: '#F59E0B' },
    tweet: { bg: '#0a2540', color: '#1D9BF0' },
    image: { bg: '#2a1a3f', color: '#A78BFA' },
}

export default function ItemDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [item, setItem] = useState(null)
    const [related, setRelated] = useState([])
    const [loading, setLoading] = useState(true)
    const [highlightNote, setHighlightNote] = useState('')
    const [selectedText, setSelectedText] = useState('')
    const [selectedCollectionId, setSelectedCollectionId] = useState('')

    const {
        collections,
        handleGetCollections,
        handleAddItemToCollection,
        handleRemoveItemFromCollection,
    } = useCollections()

    useEffect(() => {
        fetchItem()
    }, [id])

    useEffect(() => {
        handleGetCollections()
    }, [])

    useEffect(() => {
        setSelectedCollectionId(item?.collection?._id || '')
    }, [item?.collection?._id])

    async function fetchItem() {
        try {
            setLoading(true)
            const data = await getItemById(id)
            setItem(data.item)
            setRelated(data.related || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    function handleTextSelect() {
        const selection = window.getSelection()
        const text = selection?.toString().trim()
        if (text) setSelectedText(text)
    }

    async function handleAddHighlight() {
        if (!selectedText) return
        try {
            const data = await addHighlight(id, { text: selectedText, note: highlightNote })
            setItem(prev => ({ ...prev, highlights: data.highlights }))
            setSelectedText('')
            setHighlightNote('')
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDeleteHighlight(highlightId) {
        try {
            const data = await deleteHighlight(id, highlightId)
            setItem(prev => ({ ...prev, highlights: data.highlights }))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleSaveToCollection() {
        if (!selectedCollectionId) return

        try {
            const updatedItem = await handleAddItemToCollection(selectedCollectionId, id)
            const selectedCollection = collections.find(col => col._id === selectedCollectionId)

            setItem(prev => ({
                ...prev,
                ...updatedItem,
                collection: selectedCollection
                    ? {
                        _id: selectedCollection._id,
                        name: selectedCollection.name,
                        color: selectedCollection.color,
                    }
                    : prev.collection,
            }))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleRemoveFromCollection() {
        if (!item?.collection?._id) return

        try {
            const updatedItem = await handleRemoveItemFromCollection(item.collection._id, id)
            setItem(prev => ({
                ...prev,
                ...updatedItem,
                collection: null,
            }))
            setSelectedCollectionId('')
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div className="item-detail-loading">Loading...</div>
    if (!item) return <div className="item-detail-loading">Item not found</div>

    const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.article

    return (
        <div className="item-detail-page">
            <div className="item-detail-topbar">
                <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
                <span className="type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                    {item.type}
                </span>
            </div>

            <div className="item-detail-body">
                {item.thumbnail && (
                    <img className="item-detail-thumb" src={item.thumbnail} alt={item.title} />
                )}

                <h1 className="item-detail-title">{item.title}</h1>

                <div className="item-detail-tags">
                    {item.tags?.map(tag => (
                        <span key={tag} className="item-tag">{tag}</span>
                    ))}
                </div>

                <div className="item-detail-meta">
                    <a href={item.url} target="_blank" rel="noreferrer" className="item-url">
                        Open original
                    </a>
                    <span className="item-date-full">
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>

                <div className="item-collection-panel">
                    <div className="section-label">COLLECTION</div>
                    <div className="item-collection-row">
                        <select
                            className="collection-select"
                            value={selectedCollectionId}
                            onChange={e => setSelectedCollectionId(e.target.value)}
                        >
                            <option value="">Select a collection</option>
                            {collections.map(col => (
                                <option key={col._id} value={col._id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>

                        <button
                            className="collection-save-btn"
                            onClick={handleSaveToCollection}
                            disabled={!selectedCollectionId}
                        >
                            Save
                        </button>
                    </div>

                    {item.collection ? (
                        <div className="item-collection-current">
                            <span
                                className="item-collection-dot"
                                style={{ background: item.collection.color || '#4FA6FF' }}
                            />
                            <span className="item-collection-name">
                                Saved in {item.collection.name}
                            </span>
                            <button
                                className="collection-remove-btn"
                                onClick={handleRemoveFromCollection}
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="item-collection-empty">
                            This item is not saved in any collection yet.
                        </div>
                    )}
                </div>

                {item.content && (
                    <div className="item-detail-content" onMouseUp={handleTextSelect}>
                        <div className="section-label">CONTENT</div>
                        <p className="item-content-text">
                            {item.content.slice(0, 1000)}
                            {item.content.length > 1000 ? '...' : ''}
                        </p>
                    </div>
                )}

                {selectedText && (
                    <div className="highlight-prompt">
                        <div className="highlight-selected">
                            "{selectedText.slice(0, 80)}{selectedText.length > 80 ? '...' : ''}"
                        </div>
                        <input
                            className="highlight-note-input"
                            type="text"
                            placeholder="Add a note (optional)"
                            value={highlightNote}
                            onChange={e => setHighlightNote(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="highlight-save-btn" onClick={handleAddHighlight}>
                                Save highlight
                            </button>
                            <button className="highlight-cancel-btn" onClick={() => setSelectedText('')}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {item.highlights?.length > 0 && (
                    <div className="item-highlights">
                        <div className="section-label">HIGHLIGHTS</div>
                        {item.highlights.map(h => (
                            <div key={h._id} className="highlight-card">
                                <div className="highlight-text">"{h.text}"</div>
                                {h.note && <div className="highlight-note">{h.note}</div>}
                                <button
                                    className="highlight-delete"
                                    onClick={() => handleDeleteHighlight(h._id)}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {related?.length > 0 && (
                    <div className="item-related">
                        <div className="section-label">RELATED ITEMS</div>
                        {related.map(r => (
                            <div key={r._id} className="related-card" onClick={() => navigate(`/item/${r._id}`)}>
                                <div className="related-title">{r.title}</div>
                                <div className="related-type" style={{ color: TYPE_COLORS[r.type]?.color }}>
                                    {r.type}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
