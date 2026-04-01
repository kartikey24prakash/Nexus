import AppShell from '../../../app/components/AppShell'
import './extension-install.css'

const STEPS = [
    'Download the Nexus extension zip.',
    'Extract the zip to a normal folder on your computer.',
    'Open chrome://extensions in Chrome or Edge.',
    'Turn on Developer mode.',
    'Click Load unpacked and choose the extracted Nexus folder.',
]

export default function ExtensionInstall() {
    return (
        <AppShell
            title="Extension"
            subtitle="Install Nexus in your browser and save pages directly into your workspace."
        >
            <div className="extension-page">
                <section className="extension-hero-card">
                    <div className="extension-hero-copy">
                        <div className="extension-kicker">Browser extension</div>
                        <h2>Add pages to Nexus in one click</h2>
                        <p>
                            Use the free unpacked version in Chrome or Edge, sign in once, and save the current page into your collections.
                        </p>
                    </div>

                    <div className="extension-actions">
                        <a
                            className="extension-download-btn"
                            href="/downloads/nexus-extension.zip"
                            download
                        >
                            Download extension
                        </a>
                        <span className="extension-note">Free to use in developer mode</span>
                    </div>
                </section>

                <section className="extension-grid">
                    <div className="extension-card">
                        <div className="extension-card-title">Install steps</div>
                        <div className="extension-steps">
                            {STEPS.map((step, index) => (
                                <div key={step} className="extension-step">
                                    <div className="extension-step-index">0{index + 1}</div>
                                    <div className="extension-step-text">{step}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="extension-card">
                        <div className="extension-card-title">What it does</div>
                        <div className="extension-feature-list">
                            <div className="extension-feature">
                                <strong>Save current page</strong>
                                <span>Capture the active tab straight into Nexus.</span>
                            </div>
                            <div className="extension-feature">
                                <strong>Choose a collection</strong>
                                <span>Send saved links into the right workspace instantly.</span>
                            </div>
                            <div className="extension-feature">
                                <strong>Open the app</strong>
                                <span>Jump back into your deployed Nexus workspace anytime.</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AppShell>
    )
}
