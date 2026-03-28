import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useAuth } from '../hook/useAuth'
import NexusBackground from '../components/Background3D'
import './nexus-auth.css'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const user    = useSelector(state => state.auth.user)
  const loading = useSelector(state => state.auth.loading)
  const { handleLogin } = useAuth()

  const handleSubmit = async e => {
    e.preventDefault()
    await handleLogin({ email, password })
  }

  if (!loading && user) return <Navigate to="/" replace />

  return (
    <div className="nx-root">
      <NexusBackground />
      <div className="nx-vignette" />

      <div className="nx-page">

        {/* ── LEFT ── */}
        <div className="nx-left">
          <NexusLogo />
          <div className="nl-body">
            <div className="nl-tag">// Your knowledge operating system</div>
            <h1 className="nl-h1">
              One place for<br />everything you<br /><em>discover</em>
            </h1>
            <p className="nl-desc">
              Nexus captures knowledge from any source — websites, videos, PDFs,
              photos, articles — and connects it into a searchable, intelligent second brain.
            </p>
            <SourceGrid />
            <div className="ext-pill">
              <div className="ext-dot" />
              <div className="ext-txt">
                <b>Nexus Browser Extension</b> — Save any page while browsing.
                One click, always searchable in your brain.
              </div>
            </div>
          </div>
          {/* stats intentionally removed */}
        </div>

        {/* ── RIGHT ── */}
        <div className="nx-right">
          <div className="auth-box">
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="auth-inner">
              <div className="tab-row">
                <div className="atab atab--on">Sign in</div>
                <Link to="/register" className="atab">Create account</Link>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="f-eyebrow">// ACCESS PORTAL</div>
                <div className="f-title">Welcome back</div>
                <div className="f-sub">Continue building your second brain</div>

                <div className="fgrp">
                  <div className="flbl">Email</div>
                  <input
                    className="finput" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </div>
                <div className="fgrp">
                  <div className="flbl">Password</div>
                  <input
                    className="finput" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required
                  />
                </div>

                <div className="frgt"><a href="#">Forgot password?</a></div>
                <button className="btn-nx" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in to Nexus'}
                </button>
              </form>

              <div className="div-row">
                <div className="dline" /><div className="dtxt">or</div><div className="dline" />
              </div>
              <div className="soc-row">
                <div className="soc-btn">Google</div>
                <div className="soc-btn">GitHub</div>
              </div>
              <div className="fnote">
                No account? <Link to="/register">Create one free</Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function NexusLogo() {
  return (
    <div className="nlogo">
      <div className="nlogo-mark">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="3" stroke="#63b4ff" strokeWidth="1.4"/>
          <line x1="9" y1="1.5" x2="9" y2="5"      stroke="#63b4ff" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="9" y1="13"  x2="9" y2="16.5"    stroke="#63b4ff" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="1.5" y1="9" x2="5"   y2="9"     stroke="#63b4ff" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="13"  y1="9" x2="16.5" y2="9"    stroke="#63b4ff" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="3.5" y1="3.5" x2="6"    y2="6"    stroke="rgba(127,212,255,0.5)" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="12"  y1="12"  x2="14.5" y2="14.5" stroke="rgba(127,212,255,0.5)" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="14.5" y1="3.5" x2="12"  y2="6"    stroke="rgba(127,212,255,0.5)" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="6"    y1="12"  x2="3.5"  y2="14.5" stroke="rgba(127,212,255,0.5)" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <div className="nlogo-name">NEXUS</div>
        <div className="nlogo-sub">SECOND BRAIN</div>
      </div>
    </div>
  )
}

function SourceGrid() {
  return (
    <div className="src-grid">
      {SOURCE_ITEMS.map((s, i) => (
        <div className={`src-card${s.extBorder ? ' src-card--ext' : ''}`} key={i}>
          <div className={`src-icon ${s.cls}`}>{s.icon}</div>
          <div className="src-name">{s.name}</div>
          <div className="src-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

const SOURCE_ITEMS = [
  { cls: 'ic-url', name: 'Website URL', sub: 'Any link',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#63b4ff" strokeWidth="1.2"/><path d="M1.5 7h11M7 1.5c-1.8 1.8-2.5 3.5-2.5 5.5s.7 3.7 2.5 5.5M7 1.5c1.8 1.8 2.5 3.5 2.5 5.5s-.7 3.7-2.5 5.5" stroke="#63b4ff" strokeWidth="1.1" strokeLinecap="round"/></svg> },
  { cls: 'ic-pdf', name: 'PDF / Docs', sub: 'Upload files',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2.5" y="1" width="9" height="12" rx="1.5" stroke="#7fd4ff" strokeWidth="1.2"/><line x1="5" y1="4.5" x2="9" y2="4.5" stroke="#7fd4ff" strokeWidth="1" strokeLinecap="round"/><line x1="5" y1="7" x2="9" y2="7" stroke="#7fd4ff" strokeWidth="1" strokeLinecap="round"/><line x1="5" y1="9.5" x2="7.5" y2="9.5" stroke="#7fd4ff" strokeWidth="1" strokeLinecap="round"/></svg> },
  { cls: 'ic-yt', name: 'YouTube', sub: 'Video + transcripts',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="2" stroke="#5db5ff" strokeWidth="1.2"/><polygon points="5.5,5 9.5,7 5.5,9" fill="#5db5ff"/></svg> },
  { cls: 'ic-img', name: 'Photos', sub: 'Screenshots',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="11" height="10" rx="1.8" stroke="#cc55ff" strokeWidth="1.2"/><circle cx="5" cy="5.5" r="1.3" stroke="#cc55ff" strokeWidth="1"/><path d="M1.5 9.5l3-2.5 2.5 2.5 2-2 3 3" stroke="#cc55ff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { cls: 'ic-art', name: 'Articles', sub: 'Web content',
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 10.5L4 3l2.5 5.5 2-3.5 3 5.5" stroke="#8fd7ff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { cls: 'ic-ext', name: 'Extension', sub: '1-click save', extBorder: true,
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="#9ce1ff" strokeWidth="1.2"/><path d="M7 4.5v5M4.5 7h5" stroke="#9ce1ff" strokeWidth="1.3" strokeLinecap="round"/></svg> },
]
