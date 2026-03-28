import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import AppShell from '../../../app/components/AppShell'
import { useSearch } from '../hook/useSearch'
import './search.css'

const TYPE_COLORS = {
    article: { bg: '#1e3a5f', color: '#60A5FA' },
    youtube: { bg: '#3f1a1a', color: '#EF4444' },
    pdf: { bg: '#3f2a00', color: '#F59E0B' },
    tweet: { bg: '#0a2540', color: '#1D9BF0' },
    image: { bg: '#2a1a3f', color: '#A78BFA' },
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
        <AppShell showHeader={false}>
            <div className="search-page">
                <div className="search-hero">
                    <div className="search-kicker">Search</div>
                    <div className="search-title">Find in your workspace</div>
                    <div className="search-copy">Exact or related, all in one flow.</div>
                </div>

                <form className="search-bar" onSubmit={handleSubmit}>
                        <div className="search-bar-shell">
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
                        </div>
                </form>

                <div className="search-results">
                    {keywordResults.length > 0 && (
                        <div className="results-section">
                            <div className="results-label">Keyword Matches</div>
                            {keywordResults.map((item) => (
                                <SearchResult key={item._id} item={item} onClick={() => navigate(`/item/${item._id}`)} />
                            ))}
                        </div>
                    )}

                    {semanticResults.length > 0 && (
                        <div className="results-section">
                            <div className="results-label semantic">
                                Related by meaning
                                <span className="semantic-badge">AI</span>
                            </div>
                            {semanticResults.map((item) => (
                                <SearchResult
                                    key={item._id}
                                    item={item}
                                    score={item.relevanceScore}
                                    onClick={() => navigate(`/item/${item._id}`)}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && keywordResults.length === 0 && semanticResults.length === 0 && input && (
                        <div className="search-empty">No results found for "{input}"</div>
                    )}

                    {!input && keywordResults.length === 0 && semanticResults.length === 0 && !loading && (
                        <div className="search-empty">Type something to search your saves</div>
                    )}
                </div>
            </div>
        </AppShell>
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
                    {item.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="item-tag">{tag}</span>
                    ))}
                    {score && <span className="result-score">{Math.round(score * 100)}% match</span>}
                </div>
            </div>
        </div>
    )
}
