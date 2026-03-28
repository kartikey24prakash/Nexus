import AppBackground from './AppBackground'
import FloatingIslandNav from './FloatingIslandNav'

export default function AppShell({
    title,
    subtitle,
    actions = null,
    children,
    contentClassName = '',
    showHeader = true,
}) {
    return (
        <div className="nexus-shell">
            <AppBackground />

            <div className="nexus-shell-overlay" />

            <div className="nexus-shell-content">
                {showHeader && (
                    <header className="nexus-page-header">
                        <div className="nexus-page-title-wrap">
                            <div className="nexus-page-kicker">Nexus Workspace</div>
                            <h1 className="nexus-page-title">{title}</h1>
                            {subtitle ? <p className="nexus-page-subtitle">{subtitle}</p> : null}
                        </div>
                        {actions ? <div className="nexus-page-actions">{actions}</div> : null}
                    </header>
                )}

                <main className={`nexus-page-body ${contentClassName}`.trim()}>
                    {children}
                </main>
            </div>

            <FloatingIslandNav />
        </div>
    )
}
