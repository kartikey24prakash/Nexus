import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import * as d3 from 'd3'
import AppShell from '../../../app/components/AppShell'
import { useGraph } from '../hook/useGraph'
import './graph.css'

const TYPE_COLORS = {
    article: '#60A5FA',
    youtube: '#EF4444',
    pdf: '#F59E0B',
    tweet: '#1D9BF0',
    image: '#A78BFA',
}

function formatType(type) {
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Item'
}

export default function Graph() {
    const navigate = useNavigate()
    const svgRef = useRef(null)
    const linkSelectionRef = useRef(null)
    const nodeSelectionRef = useRef(null)
    const [selectedNodeId, setSelectedNodeId] = useState(null)
    const { nodes, edges, stats, loading, handleGetGraph } = useGraph()
    const hasGraphData =
        nodes.length > 0 ||
        edges.length > 0 ||
        (stats?.totalNodes || 0) > 0 ||
        (stats?.totalEdges || 0) > 0

    useEffect(() => {
        if (hasGraphData) return
        handleGetGraph()
    }, [hasGraphData, handleGetGraph])

    useEffect(() => {
        if (!nodes.length || !svgRef.current) return undefined
        return drawGraph()
    }, [nodes, edges])

    useEffect(() => {
        updateSelectionStyles()
    }, [selectedNodeId, nodes, edges])

    const nodesById = useMemo(() => {
        return nodes.reduce((acc, node) => {
            acc[node.id] = node
            return acc
        }, {})
    }, [nodes])

    const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : null

    const selectedConnections = useMemo(() => {
        if (!selectedNodeId) return []

        return edges
            .filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId)
            .map((edge) => {
                const otherId = edge.source === selectedNodeId ? edge.target : edge.source
                const otherNode = nodesById[otherId]

                return {
                    id: `${selectedNodeId}-${otherId}`,
                    otherNode,
                    sharedTags: edge.sharedTags || [],
                    strength: edge.strength || 0,
                    sameType: otherNode?.type && selectedNode?.type ? otherNode.type === selectedNode.type : false,
                    sameCollection:
                        Boolean(selectedNode?.collection?.id) &&
                        selectedNode?.collection?.id === otherNode?.collection?.id,
                }
            })
            .filter((connection) => Boolean(connection.otherNode))
            .sort((a, b) => b.strength - a.strength)
    }, [edges, nodesById, selectedNode, selectedNodeId])

    const explanation = useMemo(() => {
        if (!selectedNode) return null

        if (!selectedConnections.length) {
            return {
                headline: 'This save is mostly on its own right now.',
                details: 'It does not share enough tags with other saves yet.',
                topTags: [],
            }
        }

        const tagFrequency = {}
        selectedConnections.forEach((connection) => {
            connection.sharedTags.forEach((tag) => {
                tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
            })
        })

        const topTags = Object.entries(tagFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag]) => tag)

        const sameTypeCount = selectedConnections.filter((connection) => connection.sameType).length
        const sameCollectionCount = selectedConnections.filter((connection) => connection.sameCollection).length

        const reasons = []
        if (topTags.length) reasons.push(topTags.join(', '))
        if (sameCollectionCount) reasons.push(`shared collection context`)
        if (sameTypeCount) reasons.push(`similar ${selectedNode.type} saves`)

        return {
            headline: reasons.length
                ? `Connected through ${reasons.join(', ')}.`
                : 'Connected through overlapping themes.',
            details: `${selectedConnections.length} related saves found around this item.`,
            topTags,
        }
    }, [selectedConnections, selectedNode])

    const clusterSeeds = useMemo(() => {
        if (!nodes.length) return []

        const adjacency = new Map()
        nodes.forEach((node) => {
            adjacency.set(node.id, new Set())
        })

        edges.forEach((edge) => {
            const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source
            const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target

            if (!adjacency.has(sourceId)) adjacency.set(sourceId, new Set())
            if (!adjacency.has(targetId)) adjacency.set(targetId, new Set())

            adjacency.get(sourceId).add(targetId)
            adjacency.get(targetId).add(sourceId)
        })

        const visited = new Set()
        const clusters = []

        nodes.forEach((node) => {
            if (visited.has(node.id)) return

            const queue = [node.id]
            const component = []
            visited.add(node.id)

            while (queue.length) {
                const currentId = queue.shift()
                const currentNode = nodes.find((entry) => entry.id === currentId)
                if (currentNode) component.push(currentNode)

                ;(adjacency.get(currentId) || []).forEach((neighborId) => {
                    if (visited.has(neighborId)) return
                    visited.add(neighborId)
                    queue.push(neighborId)
                })
            }

            if (component.length >= 3) {
                const tagCounts = {}
                component.forEach((item) => {
                    ;(item.tags || []).forEach((tag) => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1
                    })
                })

                const label =
                    Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
                    formatType(component[0]?.type || 'Item')

                clusters.push({
                    id: `cluster-${clusters.length}`,
                    label,
                    nodeIds: component.map((item) => item.id),
                })
            }
        })

        return clusters
    }, [nodes, edges])

    function drawGraph() {
        const container = svgRef.current.parentElement
        const width = container.clientWidth
        const height = container.clientHeight

        d3.select(svgRef.current).selectAll('*').remove()

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)

        const g = svg.append('g')
        svg.on('click', () => {
            setSelectedNodeId(null)
        })
        svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e) => {
            g.attr('transform', e.transform)
        }))

        const graphNodes = nodes.map((n) => ({ ...n }))
        const graphEdges = edges.map((e) => ({ ...e }))
        const graphClusters = clusterSeeds.map((cluster) => ({ ...cluster }))

        const simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphEdges).id((d) => d.id).distance(112))
            .force('charge', d3.forceManyBody().strength(-235))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide(36))

        const link = g.append('g')
            .selectAll('line')
            .data(graphEdges)
            .enter()
            .append('line')
            .attr('stroke', 'rgba(255,255,255,0.12)')
            .attr('stroke-width', (d) => Math.min(d.strength || 1, 3.5))
            .attr('stroke-opacity', 0.7)

        const node = g.append('g')
            .selectAll('g')
            .data(graphNodes)
            .enter()
            .append('g')
            .attr('cursor', 'pointer')
            .call(d3.drag()
                .on('start', (e, d) => {
                    if (!e.active) simulation.alphaTarget(0.3).restart()
                    d.fx = d.x
                    d.fy = d.y
                })
                .on('drag', (e, d) => {
                    d.fx = e.x
                    d.fy = e.y
                })
                .on('end', (e, d) => {
                    if (!e.active) simulation.alphaTarget(0)
                    d.fx = null
                    d.fy = null
                })
            )
            .on('click', (e, d) => {
                e.stopPropagation()
                setSelectedNodeId(d.id)
            })

        const clusterLabel = g.append('g')
            .selectAll('g')
            .data(graphClusters)
            .enter()
            .append('g')
            .attr('class', 'graph-cluster-label')

        clusterLabel.append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(205, 233, 255, 0.46)')
            .attr('font-size', '11px')
            .attr('font-family', 'Syne, sans-serif')
            .attr('letter-spacing', '0.08em')
            .text((d) => d.label)

        const defs = svg.append('defs')

        graphNodes.forEach((nodeData) => {
            if (!nodeData.thumbnail) return

            defs.append('pattern')
                .attr('id', `thumb-${nodeData.id}`)
                .attr('patternUnits', 'objectBoundingBox')
                .attr('width', 1)
                .attr('height', 1)
                .append('image')
                .attr('href', nodeData.thumbnail)
                .attr('width', 52)
                .attr('height', 52)
                .attr('preserveAspectRatio', 'xMidYMid slice')
        })

        node.append('circle')
            .attr('r', 24)
            .attr('fill', (d) => d.thumbnail ? `url(#thumb-${d.id})` : `${TYPE_COLORS[d.type] || '#67b8ff'}22`)
            .attr('stroke', 'rgba(8, 15, 24, 0.95)')
            .attr('stroke-width', 5)

        node.append('circle')
            .attr('r', 28)
            .attr('fill', 'transparent')
            .attr('stroke', (d) => TYPE_COLORS[d.type] || '#67b8ff')
            .attr('stroke-width', 1.6)
            .attr('stroke-opacity', 0.9)

        node.append('circle')
            .attr('r', 5)
            .attr('fill', (d) => TYPE_COLORS[d.type] || '#67b8ff')

        node.append('text')
            .attr('dy', 42)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(225,242,255,0.42)')
            .attr('font-size', '10px')
            .attr('font-family', 'Syne, sans-serif')
            .text((d) => d.title.length > 20 ? `${d.title.slice(0, 20)}...` : d.title)

        node.on('mouseover', function handleOver(e, d) {
            const isSelected = d.id === selectedNodeId
            d3.select(this).select('circle:nth-child(2)').attr('stroke-width', isSelected ? 3.2 : 2.8)
        }).on('mouseout', function handleOut(e, d) {
            const isSelected = d.id === selectedNodeId
            d3.select(this).select('circle:nth-child(2)').attr('stroke-width', isSelected ? 3.2 : 1.6)
        })

        linkSelectionRef.current = link
        nodeSelectionRef.current = node
        updateSelectionStyles(link, node)

        simulation.on('tick', () => {
            link
                .attr('x1', (d) => d.source.x)
                .attr('y1', (d) => d.source.y)
                .attr('x2', (d) => d.target.x)
                .attr('y2', (d) => d.target.y)

            node.attr('transform', (d) => `translate(${d.x},${d.y})`)

            clusterLabel.attr('transform', (cluster) => {
                const clusterNodes = graphNodes.filter((nodeEntry) => cluster.nodeIds.includes(nodeEntry.id))
                if (!clusterNodes.length) return 'translate(-9999,-9999)'

                const avgX = clusterNodes.reduce((sum, entry) => sum + (entry.x || 0), 0) / clusterNodes.length
                const minY = Math.min(...clusterNodes.map((entry) => entry.y || 0))

                return `translate(${avgX},${minY - 38})`
            })
        })

        return () => {
            linkSelectionRef.current = null
            nodeSelectionRef.current = null
            simulation.stop()
        }
    }

    function updateSelectionStyles(linkSelection = linkSelectionRef.current, nodeSelection = nodeSelectionRef.current) {
        if (!linkSelection || !nodeSelection) return

        linkSelection
            .attr('stroke', (d) => {
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source
                const targetId = typeof d.target === 'object' ? d.target.id : d.target
                const isSelected = selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId)
                return isSelected ? 'rgba(114, 196, 255, 0.72)' : 'rgba(255,255,255,0.12)'
            })
            .attr('stroke-width', (d) => {
                const baseStrength = Math.min(d.strength || 1, 3.5)
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source
                const targetId = typeof d.target === 'object' ? d.target.id : d.target
                const isSelected = selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId)
                return isSelected ? Math.min(baseStrength + 0.8, 4) : baseStrength
            })
            .attr('stroke-opacity', (d) => {
                if (!selectedNodeId) return 0.7
                const sourceId = typeof d.source === 'object' ? d.source.id : d.source
                const targetId = typeof d.target === 'object' ? d.target.id : d.target
                return sourceId === selectedNodeId || targetId === selectedNodeId ? 0.95 : 0.22
            })

        nodeSelection.select('circle:nth-child(2)')
            .attr('stroke-width', (d) => d.id === selectedNodeId ? 3.2 : 1.6)
            .attr('stroke-opacity', (d) => d.id === selectedNodeId ? 1 : 0.9)

        nodeSelection.select('text')
            .attr('fill', (d) => d.id === selectedNodeId ? 'rgba(225,242,255,0.78)' : 'rgba(225,242,255,0.42)')
    }

    return (
        <AppShell
            title=""
            subtitle=""
            showHeader={false}
        >
            <div className="graph-page">
                <div className="graph-canvas">
                    <div className="graph-overlay">
                        <div className="graph-overlay-title">Knowledge Graph</div>
                        <div className="graph-overlay-subtitle">Select a node to see why it belongs in your map.</div>
                        <div className="graph-stats">
                            <span>{stats?.totalNodes || 0} nodes</span>
                            <span>{stats?.totalEdges || 0} connections</span>
                        </div>
                    </div>

                    {selectedNode && (
                        <aside className="graph-insight-panel">
                            <div className="graph-insight-top">
                                <div className="graph-insight-kicker">Why connected?</div>
                                <button
                                    type="button"
                                    className="graph-insight-close"
                                    onClick={() => setSelectedNodeId(null)}
                                >
                                    Close
                                </button>
                            </div>

                            <div className="graph-insight-item">
                                <div className="graph-insight-copy">
                                    <h3>{selectedNode.title}</h3>
                                    <div className="graph-insight-meta">
                                        <span>{formatType(selectedNode.type)}</span>
                                        {selectedNode.collection?.name ? (
                                            <span>{selectedNode.collection.name}</span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            <p className="graph-insight-headline">{explanation?.headline}</p>
                            <p className="graph-insight-details">{explanation?.details}</p>

                            {explanation?.topTags?.length ? (
                                <div className="graph-insight-tags">
                                    {explanation.topTags.map((tag) => (
                                        <span key={tag}>{tag}</span>
                                    ))}
                                </div>
                            ) : null}

                            <div className="graph-insight-section">
                                <div className="graph-insight-section-title">Closest links</div>
                                <div className="graph-insight-links">
                                    {selectedConnections.slice(0, 3).map((connection) => (
                                        <button
                                            key={connection.id}
                                            type="button"
                                            className="graph-link-card"
                                            onClick={() => setSelectedNodeId(connection.otherNode.id)}
                                        >
                                            <div className="graph-link-card-top">
                                                <div className="graph-link-title">
                                                    {connection.otherNode.title}
                                                </div>
                                                <div className="graph-link-score">
                                                    {connection.strength} shared
                                                </div>
                                            </div>

                                            <div className="graph-link-meta">
                                                <span>{formatType(connection.otherNode.type)}</span>
                                                {connection.sameCollection ? <span>same collection</span> : null}
                                                {connection.sameType ? <span>same type</span> : null}
                                            </div>

                                            {connection.sharedTags.length ? (
                                                <div className="graph-link-tags">
                                                    {connection.sharedTags.slice(0, 3).map((tag) => (
                                                        <span key={tag}>{tag}</span>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </button>
                                    ))}

                                    {!selectedConnections.length ? (
                                        <div className="graph-link-empty">
                                            No strong links yet. Save more related items to grow this area.
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="graph-open-item"
                                onClick={() => navigate(`/item/${selectedNode.id}`)}
                            >
                                Open item
                                <span aria-hidden="true">↗</span>
                            </button>
                        </aside>
                    )}

                    {loading && !hasGraphData && <div className="graph-loading">Loading graph...</div>}
                    {!loading && nodes.length === 0 && (
                        <div className="graph-empty">
                            Save more items to see your knowledge graph grow.
                        </div>
                    )}

                    <div className="graph-legend graph-legend-inside">
                        {Object.entries(TYPE_COLORS).map(([type, color]) => (
                            <div key={type} className="legend-item">
                                <div className="legend-dot" style={{ background: color }} />
                                <span>{type}</span>
                            </div>
                        ))}
                    </div>

                    <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
        </AppShell>
    )
}
