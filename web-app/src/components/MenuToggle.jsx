import React from 'react';

const MenuToggle = ({ isOpen, onClick, style }) => {
    return (
        <button
            onClick={onClick}
            style={{
                position: 'fixed',
                top: '20px',
                right: '30px',
                zIndex: 2000,
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                outline: 'none',
                ...style
            }}
        >
            <div style={{
                position: 'relative',
                width: '24px',
                height: '24px',
                transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', // Straight plus when closed
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Vertical line */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '50%',
                    width: '4px',
                    height: '100%',
                    background: 'white',
                    transform: 'translateX(-50%)',
                    borderRadius: '2px'
                }} />
                {/* Horizontal line */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '0',
                    width: '100%',
                    height: '4px',
                    background: 'white',
                    transform: 'translateY(-50%)',
                    borderRadius: '2px'
                }} />
            </div>
        </button>
    );
};

export default MenuToggle;
