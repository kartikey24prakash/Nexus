import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useSearch } from '../hook/useSearch'
import './search.css'

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf:     { bg: '#3f2a00', color: '#F59E0B' },
    tweet:   { bg: '#0a2540', color: '#1D9BF0' },
    image:   { bg: '#2a1a3f', color: '#A78BFA' },
}

export default function Search() {
    const navigate = useNavigate()
    const [input, setInput] = useState('')
    const { keywordResults, semanticResults, loading, handleSearch, handleClear } = useSearch()

    const handleSubmit = (e) => {
        e.preventDefault()
        handleSearch(input)
    }

    const handleChange = (e) => {
        setInput(e.target.value)
        if (!e.target.value) handleClear()
    }

    return (
        <div className="search-page">
            {/* ── Topbar ── */}
            <div className="search-topbar">
                <span className="search-logo">Search</span>
            </div>

            {/* ── Search input ── */}
            <form className="search-bar" onSubmit={handleSubmit}>
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search your saves..."
                    value={input}
                    onChange={handleChange}
                    autoFocus
                />
                <button className="search-btn" type="submit" disabled={loading}>
                    {loading ? '...' : 'Search'}
                </button>
            </form>

            {/* ── Results ── */}
            <div className="search-results">
                {/* Keyword results */}
                {keywordResults.length > 0 && (
                    <div className="results-section">
                        <div className="results-label">KEYWORD MATCHES</div>
                        {keywordResults.map(item => (
                            <SearchResult key={item._id} item={item} onClick={() => navigate(`/item/${item._id}`)} />
                        ))}
                    </div>
                )}

                {/* Semantic results */}
                {semanticResults.length > 0 && (
                    <div className="results-section">
                        <div className="results-label semantic">
                            Related by meaning
                            <span className="semantic-badge">AI</span>
                        </div>
                        {semanticResults.map(item => (
                            <SearchResult
                                key={item._id}
                                item={item}
                                score={item.relevanceScore}
                                onClick={() => navigate(`/item/${item._id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && keywordResults.length === 0 && semanticResults.length === 0 && input && (
                    <div className="search-empty">No results found for "{input}"</div>
                )}

                {/* Initial state */}
                {!input && (
                    <div className="search-empty">Type something to search your saves</div>
                )}
            </div>

            {/* ── Bottom nav ── */}
            <div className="bottom-nav">
                <div className="nav-item" onClick={() => navigate('/')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="#333"/><rect x="11" y="2" width="7" height="7" rx="2" fill="#333"/><rect x="2" y="11" width="7" height="7" rx="2" fill="#333"/><rect x="11" y="11" width="7" height="7" rx="2" fill="#333"/></svg>
                    <span className="nav-label">Feed</span>
                </div>
                <div className="nav-item active" onClick={() => navigate('/search')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="#F97316" strokeWidth="1.5"/><path d="M14 14l4 4" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="nav-label active">Search</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/graph')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="2.5" fill="#444"/><circle cx="15" cy="5" r="2.5" fill="#444"/><circle cx="15" cy="15" r="2.5" fill="#444"/><path d="M7.5 9L12.5 6M7.5 11L12.5 14" stroke="#444" strokeWidth="1"/></svg>
                    <span className="nav-label">Graph</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/collections')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#444" strokeWidth="1.5"/><path d="M7 5V4M13 5V4" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="nav-label">Collections</span>
                </div>
            </div>
        </div>
    )
}

function SearchResult({ item, score, onClick }) {
    const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.article
    return (
        <div className="search-result" onClick={onClick}>
            <div className="result-info">
                <div className="result-title">{item.title}</div>
                <div className="result-meta">
                    <span className="type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>{item.type}</span>
                    {item.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="item-tag">{tag}</span>
                    ))}
                    {score && <span className="result-score">{Math.round(score * 100)}% match</span>}
                </div>
            </div>
        </div>
    )
}