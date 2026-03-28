import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useSelector } from 'react-redux'
import { useAuth } from '../../feature/auth/hook/useAuth'

const NAV_ITEMS = [
    {
        label: 'Feed',
        path: '/',
        match: (pathname) => pathname === '/',
        icon: (
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="2" />
                <rect x="11" y="2" width="7" height="7" rx="2" />
                <rect x="2" y="11" width="7" height="7" rx="2" />
                <rect x="11" y="11" width="7" height="7" rx="2" />
            </svg>
        ),
    },
    {
        label: 'Search',
        path: '/search',
        match: (pathname) => pathname.startsWith('/search'),
        icon: (
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="5" strokeWidth="1.5" />
                <path d="M14 14l4 4" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        label: 'Ask',
        path: '/ask',
        match: (pathname) => pathname.startsWith('/ask'),
        icon: (
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h7A2.5 2.5 0 0 1 16 5.5v4A2.5 2.5 0 0 1 13.5 12H9l-3.5 3V12.9A2.5 2.5 0 0 1 4 10.5v-5Z" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M7 6.7h6M7 8.9h4" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        label: 'Graph',
        path: '/graph',
        match: (pathname) => pathname.startsWith('/graph'),
        icon: (
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <circle cx="5" cy="10" r="2.5" />
                <circle cx="15" cy="5" r="2.5" />
                <circle cx="15" cy="15" r="2.5" />
                <path d="M7.5 9L12.5 6M7.5 11L12.5 14" strokeWidth="1" />
            </svg>
        ),
    },
    {
        label: 'Collections',
        path: '/collections',
        match: (pathname) => pathname.startsWith('/collections'),
        icon: (
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="5" width="16" height="12" rx="2" strokeWidth="1.5" />
                <path d="M7 5V4M13 5V4" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
]

export default function FloatingIslandNav() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useSelector((state) => state.auth)
    const { handleLogout } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const activeLabel = useMemo(() => {
        const activeItem = NAV_ITEMS.find((item) => item.match(location.pathname))
        return activeItem?.label || 'Nexus'
    }, [location.pathname])

    const initials = (user?.name || user?.email || 'N')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')

    const handleProfileLogout = async () => {
        setMenuOpen(false)
        await handleLogout()
        navigate('/login')
    }

    return (
        <div className="floating-island-wrap">
            <div className="floating-island">
                <div className="floating-island-center">
                    <div className="floating-island-pill">
                        <span className="floating-island-dot" />
                        <span className="floating-island-title">{activeLabel}</span>
                    </div>

                    <nav className="floating-island-nav">
                        {NAV_ITEMS.map((item) => {
                            const isActive = item.match(location.pathname)

                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    className={`floating-nav-item ${isActive ? 'is-active' : ''}`}
                                    onClick={() => navigate(item.path)}
                                >
                                    <span className="floating-nav-icon">{item.icon}</span>
                                    <span className="floating-nav-label">{item.label}</span>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                <div className="floating-profile">
                    <button
                        type="button"
                        className={`floating-profile-trigger ${menuOpen ? 'is-open' : ''}`}
                        onClick={() => setMenuOpen((prev) => !prev)}
                    >
                        <span className="floating-profile-avatar">{initials || 'N'}</span>
                        <span className="floating-profile-copy">
                            <span className="floating-profile-name">{user?.name || 'Your Profile'}</span>
                            <span className="floating-profile-sub">{user?.email || 'Signed in'}</span>
                        </span>
                    </button>

                    {menuOpen && (
                        <div className="floating-profile-menu">
                            <button type="button" className="floating-menu-btn danger" onClick={handleProfileLogout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
