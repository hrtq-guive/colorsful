import React from 'react';
import Grid from './Grid';
import Navigation from './Navigation';
import { useVideo } from '../contexts/VideoContext';

const GridPage = () => {
    const { currentVideo } = useVideo();
    const containerRef = React.useRef(null);

    // Save scroll position on unmount / Restore on mount
    React.useLayoutEffect(() => {
        const savedPosition = sessionStorage.getItem('gridScrollPosition');
        if (savedPosition && containerRef.current) {
            containerRef.current.scrollTop = parseInt(savedPosition, 10);
        }

        return () => {
            if (containerRef.current) {
                sessionStorage.setItem('gridScrollPosition', containerRef.current.scrollTop);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                overflowY: 'auto',
                backgroundColor: currentVideo ? currentVideo.color : '#0a0a0a',
                transition: 'background-color 0.4s ease',
                color: 'white'
            }}
        >
            <Grid />
        </div>
    );
};

export default GridPage;
