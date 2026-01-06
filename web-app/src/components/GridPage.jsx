import React from 'react';
import Grid from './Grid';
import Navigation from './Navigation';
import { useVideo } from '../contexts/VideoContext';

const GridPage = () => {
    const { currentVideo } = useVideo();

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            overflowY: 'auto',
            backgroundColor: currentVideo ? currentVideo.color : '#0a0a0a',
            transition: 'background-color 0.4s ease',
            color: 'white'
        }}>
            <Grid />
        </div>
    );
};

export default GridPage;
