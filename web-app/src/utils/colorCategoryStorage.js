// Utility functions for managing color category edits in localStorage

const STORAGE_KEY = 'colorsful_color_categories';

/**
 * Load all color category edits from localStorage
 * @returns {Object} Map of videoUrl -> { category: string, editedAt: timestamp }
 */
export const loadColorCategories = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Error loading color categories:', error);
        return {};
    }
};

/**
 * Save a color category edit for a specific video
 * @param {string} videoUrl - The video URL as identifier
 * @param {string} category - The color category label
 * @param {string} hexpick - Optional hex color picked by user for grid
 * @param {string} hexpickhome - Optional hex color picked by user for home
 */
export const saveColorCategory = (videoUrl, category, hexpick = null, hexpickhome = null) => {
    try {
        const categories = loadColorCategories();
        const existing = categories[videoUrl] || {};
        categories[videoUrl] = {
            category: category ? category.trim() : (existing.category || ''),
            hexpick: hexpick !== null ? hexpick : existing.hexpick,
            hexpickhome: hexpickhome !== null ? hexpickhome : existing.hexpickhome,
            editedAt: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
        return true;
    } catch (error) {
        console.error('Error saving color category:', error);
        return false;
    }
};

/**
 * Get the edited category for a specific video
 * @param {string} videoUrl - The video URL
 * @returns {string|null} The edited category or null if not edited
 */
export const getColorCategory = (videoUrl) => {
    const categories = loadColorCategories();
    return categories[videoUrl]?.category || null;
};

/**
 * Get the picked color for a specific video
 * @param {string} videoUrl - The video URL
 * @returns {string|null} The picked hex color or null if not picked
 */
export const getPickedColor = (videoUrl) => {
    const categories = loadColorCategories();
    return categories[videoUrl]?.hexpick || null;
};

/**
 * Get the picked home color for a specific video
 * @param {string} videoUrl - The video URL
 * @returns {string|null} The picked hex color for home or null if not picked
 */
export const getPickedHomeColor = (videoUrl) => {
    const categories = loadColorCategories();
    return categories[videoUrl]?.hexpickhome || null;
};

/**
 * Check if a video has been edited
 * @param {string} videoUrl - The video URL
 * @returns {boolean}
 */
export const hasBeenEdited = (videoUrl) => {
    const categories = loadColorCategories();
    return !!categories[videoUrl];
};

/**
 * Export all edited categories merged with original video data
 * @param {Array} videos - Original videos array
 * @returns {Object} Export data with metadata
 */
export const exportColorCategories = (videos) => {
    const categories = loadColorCategories();

    const enrichedVideos = videos.map(video => {
        const edit = categories[video.url];
        if (edit) {
            return {
                ...video,
                userCategory: edit.category,
                hexpick: edit.hexpick,
                hexpickhome: edit.hexpickhome,
                editedAt: edit.editedAt
            };
        }
        return video;
    });

    return {
        exportedAt: new Date().toISOString(),
        totalVideos: videos.length,
        editedVideos: Object.keys(categories).length,
        videos: enrichedVideos
    };
};

/**
 * Download exported data as JSON file
 * @param {Array} videos - Original videos array
 */
export const downloadColorCategories = (videos) => {
    const data = exportColorCategories(videos);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `colorsful-categories-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Import categories from a JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<number>} Number of categories imported
 */
export const importColorCategories = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const categories = loadColorCategories();
                let importCount = 0;

                // Handle both full export format and simple category map
                const videosToImport = data.videos || [];

                videosToImport.forEach(video => {
                    if (video.userCategory || video.hexpick || video.hexpickhome) {
                        categories[video.url] = {
                            category: video.userCategory,
                            hexpick: video.hexpick,
                            hexpickhome: video.hexpickhome,
                            editedAt: video.editedAt || Date.now()
                        };
                        importCount++;
                    }
                });

                localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
                resolve(importCount);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
};

/**
 * Reset all edits (clear localStorage)
 * @returns {boolean} Success status
 */
export const resetAllCategories = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error resetting categories:', error);
        return false;
    }
};

/**
 * Get statistics about edits
 * @returns {Object} Stats object
 */
export const getEditStats = () => {
    const categories = loadColorCategories();
    const edits = Object.values(categories);

    return {
        totalEdits: edits.length,
        oldestEdit: edits.length > 0 ? Math.min(...edits.map(e => e.editedAt)) : null,
        newestEdit: edits.length > 0 ? Math.max(...edits.map(e => e.editedAt)) : null
    };
};
