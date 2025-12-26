import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
    const [favorites, setFavorites] = useState(() => {
        try {
            const stored = localStorage.getItem('colorsful_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load favorites", e);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('colorsful_favorites', JSON.stringify(favorites));
        } catch (e) {
            console.error("Failed to save favorites", e);
        }
    }, [favorites]);

    const addFavorite = (video) => {
        setFavorites(prev => {
            if (prev.some(v => v.url === video.url)) return prev;
            return [...prev, video];
        });
    };

    const removeFavorite = (videoUrl) => {
        setFavorites(prev => prev.filter(v => v.url !== videoUrl));
    };

    const isFavorite = (videoUrl) => {
        return favorites.some(v => v.url === videoUrl);
    };

    const toggleFavorite = (video) => {
        if (isFavorite(video.url)) {
            removeFavorite(video.url);
        } else {
            addFavorite(video);
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => useContext(FavoritesContext);
