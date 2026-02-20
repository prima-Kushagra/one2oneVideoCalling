import React from 'react';

const Home = ({ onNavigate }) => {
    return (
        <div className="home-container">
            <div className="home-hero">
                <div className="hero-badge">Seamless Connections</div>
                <h1>Connected Living, <span className="gradient-text">Redefined.</span></h1>
                <p>Simple. Secure. Stunning. Join thousands of users who have chosen V2V for their most important conversations.</p>

                <div className="hero-actions">
                    <button
                        className="primary-btn"
                        onClick={() => onNavigate('signup')}
                    >
                        Get Started Free
                    </button>
                    <button
                        className="secondary-btn"
                        onClick={() => onNavigate('login')}
                    >
                        Sign In
                    </button>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                        </div>
                        <h3>HD Video Quality</h3>
                        <p>Optimized peer-to-peer technology for the clearest video and audio experience.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h3>Secure Calling</h3>
                        <p>End-to-end encrypted signals and secure WebRTC connections for your privacy.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h3>Real-time Presence</h3>
                        <p>Instant online status updates so you know exactly who's ready to talk.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
