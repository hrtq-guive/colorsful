import React from 'react';

const MobileOverlay = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100dvh',
            backgroundColor: 'black',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <h1 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.3rem',
                marginBottom: '15px',
                lineHeight: '1'
            }}>
                COLORSFUL
            </h1>
            <p style={{
                fontSize: '0.7rem',
                fontWeight: '400',
                opacity: 0.6,
                maxWidth: '280px',
                lineHeight: '1.6',
                textTransform: 'uppercase',
                letterSpacing: '0.1rem'
            }}>
                Colorsful is currently only available on desktop. See you there!
            </p>
        </div>
    );
};

export default MobileOverlay;
