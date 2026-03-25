import React from 'react'
import { useNavigate } from 'react-router'
import '../pages/dashboard.css'

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf:     { bg: '#3f2a00', color: '#F59E0B' },
    tweet:   { bg: '#0a2540', color: '#1D9BF0' },
    image:   { bg: '#2a1a3f', color: '#A78BFA' },
}

const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 60)  return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

export default function ItemCard({ item, onDelete }) {
    const navigate = useNavigate()
    const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.article

    return (
        <div className="item-card" onClick={() => navigate(`/item/${item._id}`)}>
            <div className="item-thumb" style={{ background: typeStyle.bg }}>
                {item.thumbnail
                    ? <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    : <span style={{ fontSize: '18px' }}>
                        {item.type === 'article' ? '📄' :
                         item.type === 'youtube' ? '▶' :
                         item.type === 'pdf'     ? '📕' :
                         item.type === 'tweet'   ? '🐦' : '🖼'}
                      </span>
                }
            </div>
            <div className="item-info">
                <div className="item-title">{item.title}</div>
                <div className="item-meta">
                    <span className="type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                        {item.type}
                    </span>
                    {item.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="item-tag">{tag}</span>
                    ))}
                    <span className="item-date">{timeAgo(item.createdAt)}</span>
                </div>
            </div>
            <button
                className="item-delete"
                onClick={e => { e.stopPropagation(); onDelete(item._id); }}
            >×</button>
        </div>
    )
}