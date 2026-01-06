import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [currentVideo, setCurrentVideo] = useState(null);
    const [options, setOptions] = useState({});
    const [originRoute, setOriginRoute] = useState('/');

    const openVideo = (video, opts = {}) => {
        setCurrentVideo(video);

        // Use hexpickhome as the definitive backdrop color if available
        const finalOptions = { ...opts };
        if (video?.hexpickhome) {
            finalOptions.backdropColor = video.hexpickhome;
        }

        setOptions(finalOptions);
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
        <VideoContext.Provider value={{ currentVideo, openVideo, closeVideo, options, originRoute, setOriginRoute }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideo = () => useContext(VideoContext);
