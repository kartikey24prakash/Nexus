import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import * as d3 from 'd3'
import { useGraph } from '../hook/useGraph'
import './graph.css'

const TYPE_COLORS = {
    article: '#60A5FA',
    youtube: '#EF4444',
    pdf: '#F59E0B',
    tweet: '#1D9BF0',
    image: '#A78BFA',
}

export default function Graph() {
    const navigate = useNavigate()
    const svgRef = useRef(null)
    const { nodes, edges, stats, loading, handleGetGraph } = useGraph()

    useEffect(() => {
        handleGetGraph()
    }, [])

    useEffect(() => {
        if (!nodes.length || !svgRef.current) return
        const cleanup = drawGraph()
        return cleanup
    }, [nodes, edges])

    const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "#1A1A1A")
    .style("border", "0.5px solid #2a2a2a")
    .style("border-radius", "8px")
    .style("padding", "6px 10px")
    .style("font-size", "12px")
    .style("color", "#EEEEEE")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("white-space", "nowrap")
    .style("z-index", 9999)

    function drawGraph() {
        const container = svgRef.current.parentElement
        const width = container.clientWidth
        const height = container.clientHeight

        // clear previous
        d3.select(svgRef.current).selectAll('*').remove()

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height)

        // zoom
        const g = svg.append('g')
        svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e) => {
            g.attr('transform', e.transform)
        }))

        // copy nodes and edges for d3 mutation
        const graphNodes = nodes.map(n => ({ ...n }))
        const graphEdges = edges.map(e => ({ ...e }))

        // simulation
        const simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphEdges).id(d => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide(40))

        // edges
        const link = g.append('g')
            .selectAll('line')
            .data(graphEdges)
            .enter().append('line')
            .attr('stroke', '#2a2a2a')
            .attr('stroke-width', d => Math.min(d.strength, 3))
            .attr('stroke-opacity', 0.8)

        // nodes
        const node = g.append('g')
            .selectAll('g')
            .data(graphNodes)
            .enter().append('g')
            .attr('cursor', 'pointer')
            .call(d3.drag()
                .on('start', (e, d) => {
                    if (!e.active) simulation.alphaTarget(0.3).restart()
                    d.fx = d.x; d.fy = d.y
                })
                .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y })
                .on('end', (e, d) => {
                    if (!e.active) simulation.alphaTarget(0)
                    d.fx = null; d.fy = null
                })
            )
            .on('click', (e, d) => navigate(`/item/${d.id}`))

        // node circle
        node.append('circle')
            .attr('r', 18)
            .attr('fill', d => TYPE_COLORS[d.type] + '22')
            .attr('stroke', d => TYPE_COLORS[d.type] || '#F97316')
            .attr('stroke-width', 1.5)

        // node type dot
        node.append('circle')
            .attr('r', 5)
            .attr('fill', d => TYPE_COLORS[d.type] || '#F97316')

        // node label
        node.append('text')
            .attr('dy', 32)
            .attr('text-anchor', 'middle')
            .attr('fill', '#888')
            .attr('font-size', '10px')
            .attr('font-family', 'Inter, sans-serif')
            .text(d => d.title.length > 20 ? d.title.slice(0, 20) + '...' : d.title)

        /// update mouseover/mouseout:
        node.on('mouseover', function (e, d) {
            d3.select(this).select('circle:first-child')
                .attr('stroke-width', 2.5)
            tooltip
                .style("opacity", 1)
                .html(d.title)
                .style("left", (e.pageX + 10) + "px")
                .style("top", (e.pageY - 10) + "px")
        }).on('mouseout', function () {
            d3.select(this).select('circle:first-child')
                .attr('stroke-width', 1.5)
            tooltip.style("opacity", 0)
        })

        // tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)

            node.attr('transform', d => `translate(${d.x},${d.y})`)
        })
        return () => tooltip.remove()
    }

    return (
        <div className="graph-page">
            {/* ── Topbar ── */}
            <div className="graph-topbar">
                <span className="graph-logo">Knowledge Graph</span>
                <div className="graph-stats">
                    <span>{stats?.totalNodes || 0} nodes</span>
                    <span>{stats?.totalEdges || 0} connections</span>
                </div>
            </div>

            {/* ── Graph canvas ── */}
            <div className="graph-canvas">
                {loading && <div className="graph-loading">Loading graph...</div>}
                {!loading && nodes.length === 0 && (
                    <div className="graph-empty">
                        Save more items to see your knowledge graph grow.
                    </div>
                )}
                <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* ── Legend ── */}
            <div className="graph-legend">
                {Object.entries(TYPE_COLORS).map(([type, color]) => (
                    <div key={type} className="legend-item">
                        <div className="legend-dot" style={{ background: color }} />
                        <span>{type}</span>
                    </div>
                ))}
            </div>

            {/* ── Bottom nav ── */}
            <div className="bottom-nav">
                <div className="nav-item" onClick={() => navigate('/')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" fill="#333" /><rect x="11" y="2" width="7" height="7" rx="2" fill="#333" /><rect x="2" y="11" width="7" height="7" rx="2" fill="#333" /><rect x="11" y="11" width="7" height="7" rx="2" fill="#333" /></svg>
                    <span className="nav-label">Feed</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/search')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="5" stroke="#444" strokeWidth="1.5" /><path d="M14 14l4 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <span className="nav-label">Search</span>
                </div>
                <div className="nav-item active" onClick={() => navigate('/graph')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="5" cy="10" r="2.5" fill="#F97316" /><circle cx="15" cy="5" r="2.5" fill="#F97316" /><circle cx="15" cy="15" r="2.5" fill="#F97316" /><path d="M7.5 9L12.5 6M7.5 11L12.5 14" stroke="#F97316" strokeWidth="1" /></svg>
                    <span className="nav-label active">Graph</span>
                </div>
                <div className="nav-item" onClick={() => navigate('/collections')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="12" rx="2" stroke="#444" strokeWidth="1.5" /><path d="M7 5V4M13 5V4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    <span className="nav-label">Collections</span>
                </div>
            </div>
        </div>
    )
}