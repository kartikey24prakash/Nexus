import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import AppShell from '../../../app/components/AppShell'
import { askQuestion } from '../../search/services/search.api'
import { useCollections } from '../../collections/hook/useCollections'
import './ask.css'

export default function Ask() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [question, setQuestion] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [result, setResult] = useState(null)
    const [selectedCollectionId, setSelectedCollectionId] = useState('')
    const { collections, handleGetCollections } = useCollections()
    const topSource = result?.sources?.[0] || null
    const otherSources = result?.sources?.slice(1) || []
    const collectionParam = searchParams.get('collection') || ''

    useEffect(() => {
        handleGetCollections()
    }, [])

    useEffect(() => {
        setSelectedCollectionId(collectionParam)
    }, [collectionParam])

    const selectedCollection = useMemo(
        () => collections.find((collection) => collection._id === selectedCollectionId) || null,
        [collections, selectedCollectionId]
    )

    useEffect(() => {
        if (!collectionParam || collections.length === 0) return

        const exists = collections.some((collection) => collection._id === collectionParam)

        if (!exists) {
            setSelectedCollectionId('')
            setSearchParams({})
            setError('That collection is no longer available')
        }
    }, [collectionParam, collections, setSearchParams])

    const updateCollectionScope = (nextCollectionId) => {
        setSelectedCollectionId(nextCollectionId)
        setResult(null)
        setError('')

        if (nextCollectionId) {
            setSearchParams({ collection: nextCollectionId })
            return
        }

        setSearchParams({})
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const trimmedQuestion = question.trim()
        if (!trimmedQuestion) return

        setLoading(true)
        setError('')

        try {
            const response = await askQuestion({
                question: trimmedQuestion,
                collection: selectedCollectionId || undefined,
            })
            setResult(response)
            setQuestion('')
        } catch (err) {
            setError(err.response?.data?.message || 'Could not get an answer right now')
            setResult(null)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AppShell showHeader={false}>
            <div className="ask-page">
                <div className="ask-hero">
                    <div className="ask-hero-kicker">Ask</div>
                    <div className="ask-hero-title">Your personal AI</div>
                </div>

                <div className="ask-scope-row">
                    <select
                        className="ask-scope-select"
                        value={selectedCollectionId}
                        onChange={(e) => updateCollectionScope(e.target.value)}
                    >
                        <option value="">All saves</option>
                        {collections.map((collection) => (
                            <option key={collection._id} value={collection._id}>
                                {collection.name}
                            </option>
                        ))}
                    </select>

                    {selectedCollection && (
                        <button
                            className="ask-scope-chip"
                            type="button"
                            onClick={() => updateCollectionScope('')}
                        >
                            Asking in {selectedCollection.name}
                            <span className="ask-scope-chip-close">×</span>
                        </button>
                    )}
                </div>

                <form className="ask-form" onSubmit={handleSubmit}>
                    <div className="ask-composer-glow" aria-hidden="true" />
                    <div className="ask-composer-shell">
                        <textarea
                            className="ask-input"
                            rows="2"
                            placeholder="Ask anything..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                        <div className="ask-composer-actions">
                            <span className="ask-chip">Personal</span>
                            <button className="ask-submit" type="submit" disabled={loading}>
                                {loading ? 'Thinking' : 'Ask'}
                            </button>
                        </div>
                    </div>
                </form>

                {error && <div className="ask-error">{error}</div>}

                {!result && !loading && (
                    <div className="ask-empty">Ask from your saves or anything broader.</div>
                )}

                {result?.answer && (
                    <div className="ask-answer-card">
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
                                    {Math.round((topSource.score || 0) * 100)}% match
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
                                            {Math.round((source.score || 0) * 100)}% match
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
