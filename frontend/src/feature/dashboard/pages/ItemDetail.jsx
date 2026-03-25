import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getItemById, addHighlight, deleteHighlight } from '../services/item.api'
import './itemdetail.css'

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf:     { bg: '#3f2a00', color: '#F59E0B' },
    tweet:   { bg: '#0a2540', color: '#1D9BF0' },
    image:   { bg: '#2a1a3f', color: '#A78BFA' },
}

export default function ItemDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [item, setItem] = useState(null)
    const [related, setRelated] = useState([])
    const [loading, setLoading] = useState(true)
    const [highlightNote, setHighlightNote] = useState('')
    const [selectedText, setSelectedText] = useState('')

    useEffect(() => {
        fetchItem()
    }, [id])

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

    if (loading) return <div className="item-detail-loading">Loading...</div>
    if (!item) return <div className="item-detail-loading">Item not found</div>

    const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.article

    return (
        <div className="item-detail-page">
            {/* ── Topbar ── */}
            <div className="item-detail-topbar">
                <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
                <span className="type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>{item.type}</span>
            </div>

            <div className="item-detail-body">
                {/* Thumbnail */}
                {item.thumbnail && (
                    <img className="item-detail-thumb" src={item.thumbnail} alt={item.title} />
                )}

                {/* Title */}
                <h1 className="item-detail-title">{item.title}</h1>

                {/* Tags */}
                <div className="item-detail-tags">
                    {item.tags?.map(tag => (
                        <span key={tag} className="item-tag">{tag}</span>
                    ))}
                </div>

                {/* Meta */}
                <div className="item-detail-meta">
                    <a href={item.url} target="_blank" rel="noreferrer" className="item-url">
                        Open original ↗
                    </a>
                    <span className="item-date-full">
                        {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                {/* Content */}
                {item.content && (
                    <div className="item-detail-content" onMouseUp={handleTextSelect}>
                        <div className="section-label">CONTENT</div>
                        <p className="item-content-text">{item.content.slice(0, 1000)}{item.content.length > 1000 ? '...' : ''}</p>
                    </div>
                )}

                {/* Highlight selection */}
                {selectedText && (
                    <div className="highlight-prompt">
                        <div className="highlight-selected">"{selectedText.slice(0, 80)}{selectedText.length > 80 ? '...' : ''}"</div>
                        <input
                            className="highlight-note-input"
                            type="text"
                            placeholder="Add a note (optional)"
                            value={highlightNote}
                            onChange={e => setHighlightNote(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="highlight-save-btn" onClick={handleAddHighlight}>Save highlight</button>
                            <button className="highlight-cancel-btn" onClick={() => setSelectedText('')}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Highlights */}
                {item.highlights?.length > 0 && (
                    <div className="item-highlights">
                        <div className="section-label">HIGHLIGHTS</div>
                        {item.highlights.map(h => (
                            <div key={h._id} className="highlight-card">
                                <div className="highlight-text">"{h.text}"</div>
                                {h.note && <div className="highlight-note">{h.note}</div>}
                                <button className="highlight-delete" onClick={() => handleDeleteHighlight(h._id)}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Related items */}
                {related?.length > 0 && (
                    <div className="item-related">
                        <div className="section-label">RELATED ITEMS</div>
                        {related.map(r => (
                            <div key={r._id} className="related-card" onClick={() => navigate(`/item/${r._id}`)}>
                                <div className="related-title">{r.title}</div>
                                <div className="related-type" style={{ color: TYPE_COLORS[r.type]?.color }}>{r.type}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}