import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import AppShell from '../../../app/components/AppShell'
import { useCollections } from '../hook/useCollections'
import { useItems } from '../../dashboard/hook/useItems'
import './collections.css'

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf: { bg: '#3f2a00', color: '#F59E0B' },
    tweet: { bg: '#0a2540', color: '#1D9BF0' },
    image: { bg: '#2a1a3f', color: '#A78BFA' },
}

function formatType(type) {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Mixed'
}

function buildCollectionInsights(items = []) {
    if (!items.length) {
        return {
            topThemes: [],
            dominantType: null,
            mostConnectedItem: null,
            densityLabel: 'No connections yet',
            summaryLine: 'This collection is still waiting for its first meaningful cluster.',
        }
    }

    const tagCount = {}
    const typeCount = {}
    const connectionScores = new Map()

    items.forEach((item) => {
        typeCount[item.type] = (typeCount[item.type] || 0) + 1
        ;(item.tags || []).forEach((tag) => {
            tagCount[tag] = (tagCount[tag] || 0) + 1
        })
        connectionScores.set(item._id, 0)
    })

    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const itemA = items[i]
            const itemB = items[j]
            const sharedTags = (itemA.tags || []).filter((tag) => (itemB.tags || []).includes(tag))

            if (sharedTags.length) {
                connectionScores.set(itemA._id, (connectionScores.get(itemA._id) || 0) + sharedTags.length)
                connectionScores.set(itemB._id, (connectionScores.get(itemB._id) || 0) + sharedTags.length)
            }
        }
    }

    const topThemes = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag)

    const dominantType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    const mostConnectedEntry = [...connectionScores.entries()].sort((a, b) => b[1] - a[1])[0]
    const mostConnectedItem = mostConnectedEntry
        ? items.find((item) => item._id === mostConnectedEntry[0]) || null
        : null

    const totalPossibleConnections = (items.length * (items.length - 1)) / 2
    const actualConnections = [...connectionScores.values()].reduce((sum, value) => sum + value, 0) / 2
    const connectionRatio = totalPossibleConnections ? actualConnections / totalPossibleConnections : 0

    let densityLabel = 'Lightly connected'
    if (connectionRatio > 1.2) densityLabel = 'Tightly connected'
    else if (connectionRatio > 0.45) densityLabel = 'Moderately connected'

    const summaryParts = []
    if (topThemes.length) summaryParts.push(topThemes.join(', '))
    if (dominantType) summaryParts.push(`${formatType(dominantType).toLowerCase()} saves`)

    return {
        topThemes,
        dominantType,
        mostConnectedItem,
        densityLabel,
        summaryLine: summaryParts.length
            ? `This collection clusters around ${summaryParts.join(' and ')}.`
            : 'This collection is starting to form its own pattern.',
    }
}

export default function CollectionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [selectedItemId, setSelectedItemId] = useState('')
    const {
        activeCollection,
        loading,
        handleGetCollectionById,
        handleAddItemToCollection,
        handleRemoveItemFromCollection,
    } = useCollections()
    const {
        items: savedItems,
        handleGetItems,
    } = useItems()

    useEffect(() => {
        handleGetCollectionById(id)
        handleGetItems()
    }, [id])

    const handleAddExistingItem = async () => {
        if (!selectedItemId) return
        await handleAddItemToCollection(id, selectedItemId)
        setSelectedItemId('')
        handleGetCollectionById(id)
    }

    const handleRemoveFromCollection = async (itemId) => {
        await handleRemoveItemFromCollection(id, itemId)
        handleGetCollectionById(id)
    }

    if (loading) return <div className="collections-empty">Loading...</div>
    if (!activeCollection) return <div className="collections-empty">Collection not found</div>

    const { collection, items } = activeCollection
    const collectionItemIds = new Set((items || []).map((item) => item._id))
    const availableSavedItems = savedItems.filter((item) => !collectionItemIds.has(item._id))
    const insights = buildCollectionInsights(items || [])

    return (
        <AppShell
            title={collection?.name || 'Collection'}
            subtitle={collection?.description || 'A focused pocket of related saves.'}
            actions={
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="add-btn" onClick={() => navigate(`/ask?collection=${collection._id}`)}>
                        Ask this collection
                    </button>
                    <button className="add-btn" onClick={() => navigate('/collections')}>
                        Back to Collections
                    </button>
                </div>
            }
        >
            <div className="collections-page">
                <div className="collection-insight-card">
                    <div className="collection-insight-top">
                        <div>
                            <div className="collection-insight-kicker">Collection insight</div>
                            <div className="collection-insight-summary">{insights.summaryLine}</div>
                        </div>
                        <div className="collection-insight-density">{insights.densityLabel}</div>
                    </div>

                    <div className="collection-insight-grid">
                        <div className="collection-insight-block">
                            <div className="collection-insight-label">Top themes</div>
                            <div className="collection-insight-tags">
                                {insights.topThemes.length
                                    ? insights.topThemes.map((tag) => <span key={tag}>{tag}</span>)
                                    : <span className="collection-insight-empty">No strong themes yet</span>}
                            </div>
                        </div>

                        <div className="collection-insight-block">
                            <div className="collection-insight-label">Dominant type</div>
                            <div className="collection-insight-value">
                                {insights.dominantType ? formatType(insights.dominantType) : 'Mixed'}
                            </div>
                        </div>

                        <div className="collection-insight-block">
                            <div className="collection-insight-label">Most connected item</div>
                            <div className="collection-insight-value collection-insight-value-strong">
                                {insights.mostConnectedItem?.title || 'Not enough links yet'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="collection-controls">
                    <div className="collection-existing-bar compact">
                        <select
                            className="collection-existing-select"
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value)}
                        >
                            <option value="">Add saved item...</option>
                            {availableSavedItems.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.title}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="save-btn compact"
                            disabled={!selectedItemId}
                            onClick={handleAddExistingItem}
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div className="collections-list">
                    {items?.length === 0 && (
                        <div className="collections-empty">No items in this collection yet.</div>
                    )}

                    {items?.map((item) => {
                        const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.article

                        return (
                            <div
                                key={item._id}
                                className="collection-card"
                                onClick={() => navigate(`/item/${item._id}`)}
                            >
                                <div className="item-thumb" style={{ background: typeStyle.bg }}>
                                    {item.thumbnail
                                        ? <img src={item.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                                        : <span style={{ fontSize: '14px' }}>{item.type}</span>}
                                </div>
                                <div className="collection-info">
                                    <div className="collection-name">{item.title}</div>
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        <span className="type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>{item.type}</span>
                                        {item.tags?.slice(0, 2).map(tag => (
                                            <span key={tag} className="item-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    className="collection-item-remove"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveFromCollection(item._id)
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </AppShell>
    )
}
