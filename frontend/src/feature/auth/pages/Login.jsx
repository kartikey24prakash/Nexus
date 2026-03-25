import React, { useState } from 'react'
import './login.css'
import { Link, useNavigate } from 'react-router'

import { useSelector } from 'react-redux'
import { useAuth } from '../hook/useAuth'
import { Navigate } from 'react-router'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const user = useSelector(state => state.auth.user)
    const loading = useSelector(state => state.auth.loading)

    const { handleLogin } = useAuth()
    const navigate = useNavigate()


    const handleSubmit = async e => {
        e.preventDefault()
        await handleLogin({ email, password })
        // navigate('/')
        console.log({ email, password })
    }

    if (!loading && user) return <Navigate to="/" replace />
    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Welcome Back</h2>
                <p className="login-subtitle">Login to your account</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button type="submit" className="login-button">
                        Login
                    </button>

                </form>
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#666' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#2563eb' }}>Register</Link>
                </p>
            </div>
        </div>
    )
}