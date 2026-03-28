import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import AppShell from '../../../app/components/AppShell'
import { askQuestion } from '../../search/services/search.api'
import './ask.css'

export default function Ask() {
    const navigate = useNavigate()
    const [question, setQuestion] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)
    const topSource = result?.sources?.[0] || null
    const otherSources = result?.sources?.slice(1) || []

    const handleSubmit = async (e) => {
        e.preventDefault()

        const trimmedQuestion = question.trim()
        if (!trimmedQuestion) return

        setLoading(true)
        setError('')

        try {
            const response = await askQuestion({ question: trimmedQuestion })
            setResult(response)
        } catch (err) {
            setError(err.response?.data?.message || 'Could not get an answer right now')
            setResult(null)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AppShell
            title="Ask Your Knowledge Base"
            subtitle="One focused space for retrieval-backed answers, related saves, and quick exploration."
        >
            <div className="ask-page">
                <div className="ask-hero">
                    <div className="ask-hero-title">Talk to your knowledge base</div>
                    <div className="ask-hero-copy">
                        Ask questions about your notes, saved links, PDFs, and ideas in one place.
                    </div>
                </div>

                <form className="ask-form" onSubmit={handleSubmit}>
                    <textarea
                        className="ask-input"
                        rows="5"
                        placeholder="Ask anything about your saved notes, PDFs, links, or a broader topic..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                    <button className="ask-submit" type="submit" disabled={loading}>
                        {loading ? 'Thinking...' : 'Ask Nexus'}
                    </button>
                </form>

                {error && <div className="ask-error">{error}</div>}

                {!result && !loading && (
                    <div className="ask-empty">
                        Start with a question like "What does my saved PDF say about RAG?" or "Explain vector databases simply."
                    </div>
                )}

                {result?.answer && (
                    <div className="ask-answer-card">
                        <div className="ask-answer-label">Answer</div>
                        <div className="ask-answer-text">{result.answer}</div>

                        {topSource && (
                            <button
                                className="ask-top-source"
                                type="button"
                                onClick={() => navigate(`/item/${topSource.itemId}`)}
                            >
                                <span className="ask-top-source-label">Most Related Save</span>
                                <span className="ask-top-source-title">{topSource.title || 'Untitled'}</span>
                                <span className="ask-top-source-meta">
                                    chunk {topSource.chunkIndex} • {Math.round((topSource.score || 0) * 100)}% match
                                </span>
                            </button>
                        )}

                        {otherSources.length > 0 && (
                            <div className="ask-sources">
                                <div className="ask-sources-label">Related Saves</div>
                                {otherSources.map((source, index) => (
                                    <button
                                        key={`${source.itemId}-${source.chunkIndex}-${index}`}
                                        className="ask-source-item"
                                        type="button"
                                        onClick={() => navigate(`/item/${source.itemId}`)}
                                    >
                                        <span className="ask-source-title">{source.title || 'Untitled'}</span>
                                        <span className="ask-source-meta">
                                            chunk {source.chunkIndex} • {Math.round((source.score || 0) * 100)}% match
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    )
}
