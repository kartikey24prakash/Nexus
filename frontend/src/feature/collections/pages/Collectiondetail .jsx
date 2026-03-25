import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCollections } from '../hook/useCollections'
import './collections.css'

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf:     { bg: '#3f2a00', color: '#F59E0B' },
    tweet:   { bg: '#0a2540', color: '#1D9BF0' },
    image:   { bg: '#2a1a3f', color: '#A78BFA' },
}

export default function CollectionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { activeCollection, loading, handleGetCollectionById } = useCollections()

    useEffect(() => {
        handleGetCollectionById(id)
    }, [id])

    if (loading) return <div className="collections-empty">Loading...</div>
    if (!activeCollection) return <div className="collections-empty">Collection not found</div>

    const { collection, items } = activeCollection

    return (
        <div className="collections-page">
            <div className="collections-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={() => navigate('/collections')}
                        style={{ background: 'transparent', border: 'none', color: '#555', fontSize: '18px', cursor: 'pointer' }}
                    >←</button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: collection?.color }} />
                        <span className="collections-logo" style={{ fontSize: '16px' }}>{collection?.name}</span>
                    </div>
                </div>
                <span style={{ fontSize: '12px', color: '#555' }}>{items?.length || 0} items</span>
            </div>

            <div className="collections-list">
                {items?.length === 0 && (
                    <div className="collections-empty">No items in this collection yet.</div>
                )}

                {items?.map(item => {
                    const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.article
                    return (
                        <div
                            key={item._id}
                            className="collection-card"
                            onClick={() => navigate(`/item/${item._id}`)}
                        >
                            <div className="item-thumb" style={{ background: typeStyle.bg, width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {item.thumbnail
                                    ? <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                    : <span style={{ fontSize: '14px' }}>
                                        {item.type === 'article' ? '📄' :
                                         item.type === 'youtube' ? '▶' :
                                         item.type === 'pdf' ? '📕' :
                                         item.type === 'tweet' ? '🐦' : '🖼'}
                                      </span>
                                }
                            </div>
                            <div className="collection-info">
                                <div className="collection-name" style={{ fontSize: '13px' }}>{item.title}</div>
                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    <span className="type-badge" style={{ background: typeStyle.bg, color: typeStyle.color, fontSize: '10px', padding: '2px 7px', borderRadius: '4px' }}>{item.type}</span>
                                    {item.tags?.slice(0, 2).map(tag => (
                                        <span key={tag} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: '#F9731615', color: '#F97316', border: '0.5px solid #F9731630' }}>{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

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