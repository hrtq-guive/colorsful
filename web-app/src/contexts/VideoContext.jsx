import React, { createContext, useContext, useState, useEffect } from 'react';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [currentVideo, setCurrentVideo] = useState(null);
    const [options, setOptions] = useState({});

    const openVideo = (video, opts = {}) => {
        setCurrentVideo(video);
        setOptions(opts);
        // Save as last played video for REPLAY LAST feature (session only)
        if (video) {
            sessionStorage.setItem('lastPlayedVideo', JSON.stringify(video));
        }
    };

    const closeVideo = () => {
        setCurrentVideo(null);
        setOptions({});
    };

    return (
        <VideoContext.Provider value={{ currentVideo, openVideo, closeVideo, options }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => useContext(VideoContext);
