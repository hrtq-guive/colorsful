import React, { useState, useEffect, useRef } from 'react';

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isPointer, setIsPointer] = useState(false);
    const [isSmall, setIsSmall] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const hideTimeoutRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);

            // Hide cursor after 3 seconds of inactivity
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
            hideTimeoutRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 3000);

            // Check if hovered element is a "pointer" (link, button, etc.)
            const target = e.target;
            const isClickable =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') ||
                target.closest('a') ||
                window.getComputedStyle(target).cursor === 'pointer' ||
                target.onclick ||
                target.getAttribute('role') === 'button';

            const isDiscovery = target.closest('[data-cursor="small"]');

            setIsPointer(!!isClickable);
            setIsSmall(!!isDiscovery);
        };

        const handleMouseLeaveWindow = () => {
            setIsVisible(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeaveWindow);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeaveWindow);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    const size = isSmall ? 8 : (isPointer ? 20 : 32);
    const offset = size / 2;

    return (
        <div
            id="custom-cursor"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                border: '1px solid white',
                pointerEvents: 'none',
                zIndex: 99999,
                transform: `translate(${position.x - offset}px, ${position.y - offset}px)`,
                transition: 'width 0.3s cubic-bezier(0.23, 1, 0.32, 1), height 0.3s cubic-bezier(0.23, 1, 0.32, 1), transform 0.08s ease-out, opacity 0.3s ease',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isPointer ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                opacity: isVisible ? 1 : 0,
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)'
            }}
        >
            {/* Inner dot - only visible in discovery mode (small) */}
            <div style={{
                width: '2px',
                height: '2px',
                backgroundColor: 'white',
                borderRadius: '50%',
                opacity: (isSmall && isVisible) ? 1 : 0,
                transition: 'opacity 0.2s'
            }} />
        </div>
    );
};

export default CustomCursor;
