import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SecretPage = () => {
    // Force enable scrolling on this page
    useEffect(() => {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);

    const versions = [
        { path: '/', name: 'Logo (Perfectionist)', description: 'Final Hybrid Nebula (Heart + Shell)' },
        { path: '/previoushome', name: 'Logo (Previous)', description: 'Watercolor Nebula (r < 25 + N=20)' },
        { path: '/wheel', name: 'Wheel', description: 'Original color wheel with dynamic shape' },
        { path: '/gradient', name: 'Gradient', description: 'Organic gradient nebula' },
        { path: '/bloc', name: 'Bloc', description: 'Grid-based color blocks' },
        { path: '/palette', name: 'Palette', description: 'Your favorited videos' },
        { path: '/point', name: 'Point', description: 'Single point interaction' }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            background: '#000',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            padding: '80px 40px',
            boxSizing: 'border-box'
        }}>
            <div style={{
                maxWidth: '500px'
            }}>
                <h1 style={{
                    fontSize: '0.7rem',
                    fontWeight: '400',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15rem',
                    marginBottom: '80px',
                    opacity: 0.4
                }}>
                    Versions
                </h1>

                {versions.map((version, index) => (
                    <Link
                        key={index}
                        to={version.path}
                        style={{
                            display: 'block',
                            padding: '16px 0',
                            textDecoration: 'none',
                            color: 'white',
                            transition: 'opacity 0.2s ease',
                            borderBottom: index < versions.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                            opacity: 0.8
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '0.8';
                        }}
                    >
                        <div style={{
                            fontSize: '0.95rem',
                            fontWeight: '400',
                            letterSpacing: '0.02rem',
                            marginBottom: '6px'
                        }}>
                            {version.name}
                        </div>
                        <div style={{
                            fontSize: '0.7rem',
                            opacity: 0.5,
                            letterSpacing: '0.01rem',
                            fontFamily: 'monospace'
                        }}>
                            {version.path}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SecretPage;
