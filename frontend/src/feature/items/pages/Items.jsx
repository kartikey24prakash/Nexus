import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import AppShell from '../../../app/components/AppShell'
import { useItems } from '../../dashboard/hook/useItems'
import './items.css'

const TYPE_TABS = [
    { label: 'All', value: '' },
    { label: 'Articles', value: 'article' },
    { label: 'Videos', value: 'youtube' },
    { label: 'PDFs', value: 'pdf' },
    { label: 'Images', value: 'image' },
    { label: 'Tweets', value: 'tweet' },
]

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf: { bg: '#3f2a00', color: '#F59E0B' },
    tweet: { bg: '#0a2540', color: '#1D9BF0' },
    image: { bg: '#2a1a3f', color: '#A78BFA' },
}

function timeAgo(date) {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

export default function Items() {
    const navigate = useNavigate()
    const [activeType, setActiveType] = useState('')
    const { items, loading, handleGetItems } = useItems()

    useEffect(() => {
        handleGetItems(activeType ? { type: activeType } : {})
    }, [activeType])

    const heading = useMemo(() => {
        if (!activeType) return 'Your full library'
        const tab = TYPE_TABS.find((entry) => entry.value === activeType)
        return tab?.label || 'Items'
    }, [activeType])

    return (
        <AppShell showHeader={false}>
            <div className="items-page">
                <div className="items-hero">
                    <div className="items-kicker">Items</div>
                    <div className="items-title">{heading}</div>
                    <div className="items-copy">Browse everything by format.</div>
                </div>

                <div className="items-tabs" role="tablist" aria-label="Filter items by type">
                    {TYPE_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            type="button"
                            className={`items-tab ${activeType === tab.value ? 'is-active' : ''}`}
                            onClick={() => setActiveType(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading && <div className="items-empty">Loading your library...</div>}

                {!loading && items.length === 0 && (
                    <div className="items-empty">
                        {activeType ? 'No items in this type yet.' : 'No items saved yet.'}
                    </div>
                )}

                {!loading && items.length > 0 && (
                    <div className="items-grid">
                        {items.map((item) => {
                            const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.article

                            return (
                                <button
                                    key={item._id}
                                    type="button"
                                    className="items-card"
                                    onClick={() => navigate(`/item/${item._id}`)}
                                >
                                    <div className="items-card-media" style={{ background: typeStyle.bg }}>
                                        {item.thumbnail ? (
                                            <img className="items-card-image" src={item.thumbnail} alt={item.title} />
                                        ) : (
                                            <div className="items-card-fallback">{item.type}</div>
                                        )}
                                    </div>

                                    <div className="items-card-body">
                                        <div className="items-card-top">
                                            <span className="type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                                                {item.type}
                                            </span>
                                            <span className="items-card-date">{timeAgo(item.createdAt)}</span>
                                        </div>

                                        <div className="items-card-title">{item.title}</div>

                                        <div className="items-card-tags">
                                            {item.tags?.slice(0, 3).map((tag) => (
                                                <span key={tag} className="item-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </AppShell>
    )
}
