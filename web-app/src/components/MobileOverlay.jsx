import React from 'react';

const MobileOverlay = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{
                fontSize: '3rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '-2px',
                marginBottom: '20px',
                lineHeight: '1'
            }}>
                COLORSFUL
            </h1>
            <p style={{
                fontSize: '1.2rem',
                fontWeight: '500',
                opacity: 0.8,
                maxWidth: '280px',
                lineHeight: '1.4'
            }}>
                Colorsful is currently only available on desktop. See you there!
            </p>
        </div>
    );
};

export default MobileOverlay;
