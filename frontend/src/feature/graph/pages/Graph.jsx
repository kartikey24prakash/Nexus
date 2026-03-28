import React, { useEffect, useMemo, useRef } from 'react'
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

export default function Graph() {
    const navigate = useNavigate()
    const svgRef = useRef(null)
    const tooltipRef = useRef(null)
    const { nodes, edges, stats, loading, handleGetGraph } = useGraph()

    useEffect(() => {
        handleGetGraph()
    }, [])

    useEffect(() => {
        if (!tooltipRef.current) {
            tooltipRef.current = d3.select('body').append('div')
                .style('position', 'absolute')
                .style('background', '#120f0e')
                .style('border', '1px solid rgba(255,255,255,0.08)')
                .style('border-radius', '12px')
                .style('padding', '8px 10px')
                .style('font-size', '12px')
                .style('color', '#EEEEEE')
                .style('pointer-events', 'none')
                .style('opacity', 0)
                .style('white-space', 'nowrap')
                .style('z-index', 9999)
                .style('box-shadow', '0 18px 40px rgba(0,0,0,0.28)')
        }

        return () => {
            tooltipRef.current?.remove()
            tooltipRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!nodes.length || !svgRef.current) return undefined
        return drawGraph()
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
        svg.call(d3.zoom().scaleExtent([0.3, 3]).on('zoom', (e) => {
            g.attr('transform', e.transform)
        }))

        const graphNodes = nodes.map(n => ({ ...n }))
        const graphEdges = edges.map(e => ({ ...e }))

        const simulation = d3.forceSimulation(graphNodes)
            .force('link', d3.forceLink(graphEdges).id(d => d.id).distance(126))
            .force('charge', d3.forceManyBody().strength(-320))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide(42))

        const link = g.append('g')
            .selectAll('line')
            .data(graphEdges)
            .enter().append('line')
            .attr('stroke', 'rgba(255,255,255,0.12)')
            .attr('stroke-width', d => Math.min(d.strength, 3))
            .attr('stroke-opacity', 0.7)

        const node = g.append('g')
            .selectAll('g')
            .data(graphNodes)
            .enter().append('g')
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
            .on('click', (e, d) => navigate(`/item/${d.id}`))

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
            .attr('fill', d => d.thumbnail ? `url(#thumb-${d.id})` : `${TYPE_COLORS[d.type] || '#67b8ff'}22`)
            .attr('stroke', 'rgba(8, 15, 24, 0.95)')
            .attr('stroke-width', 5)

        node.append('circle')
            .attr('r', 28)
            .attr('fill', 'transparent')
            .attr('stroke', d => TYPE_COLORS[d.type] || '#67b8ff')
            .attr('stroke-width', 1.6)
            .attr('stroke-opacity', 0.9)

        node.append('circle')
            .attr('r', 5)
            .attr('fill', d => TYPE_COLORS[d.type] || '#67b8ff')

        node.append('text')
            .attr('dy', 42)
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(225,242,255,0.42)')
            .attr('font-size', '10px')
            .attr('font-family', 'Syne, sans-serif')
            .text(d => d.title.length > 20 ? `${d.title.slice(0, 20)}...` : d.title)

        node.on('mouseover', function handleOver(e, d) {
            d3.select(this).select('circle:nth-child(2)').attr('stroke-width', 2.8)
            tooltipRef.current
                .style('opacity', 1)
                .html(d.title)
                .style('left', `${e.pageX + 10}px`)
                .style('top', `${e.pageY - 10}px`)
        }).on('mouseout', function handleOut() {
            d3.select(this).select('circle:nth-child(2)').attr('stroke-width', 1.6)
            tooltipRef.current?.style('opacity', 0)
        })

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y)

            node.attr('transform', d => `translate(${d.x},${d.y})`)
        })

        return () => {
            simulation.stop()
        }
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
                        <div className="graph-overlay-subtitle">A live map of your saved ideas and how they connect.</div>
                        <div className="graph-stats">
                            <span>{stats?.totalNodes || 0} nodes</span>
                            <span>{stats?.totalEdges || 0} connections</span>
                        </div>
                    </div>

                    {loading && <div className="graph-loading">Loading graph...</div>}
                    {!loading && nodes.length === 0 && (
                        <div className="graph-empty">
                            Save more items to see your knowledge graph grow.
                        </div>
                    )}
                    <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
                </div>

                <div className="graph-legend">
                    {Object.entries(TYPE_COLORS).map(([type, color]) => (
                        <div key={type} className="legend-item">
                            <div className="legend-dot" style={{ background: color }} />
                            <span>{type}</span>
                        </div>
                    ))}
                </div>
            </div>
        </AppShell>
    )
}
