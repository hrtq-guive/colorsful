import React, { useMemo, useState, useEffect, useRef } from 'react';
import { parseVideoTitle } from '../utils/titleParser';
import videos from '../data/videos.json';
import {
    loadColorCategories,
    saveColorCategory,
    getPickedHomeColor,
    hasBeenEdited,
    downloadColorCategories,
    resetAllCategories,
    getEditStats
} from '../utils/colorCategoryStorage';

const ColorPickerVideoCard = ({ video, index }) => {
    const videoId = video.url.split('v=')[1]?.split('&')[0];
    const [hoveredColor, setHoveredColor] = useState(null);
    const [pickedColor, setPickedColor] = useState(null);
    const canvasRef = useRef(null);
    const imgRef = useRef(null);

    // Asset path - using modal1sec for Home Setup
    const jpgPath = `/captured_pages/${videoId}_modal1sec.jpg`;

    // Load saved picked home color on mount
    useEffect(() => {
        const savedColor = getPickedHomeColor(video.url);
        if (savedColor) {
            setPickedColor(savedColor);
        }
    }, [video.url]);

    // Load image onto canvas for color sampling
    useEffect(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');

        const handleImageLoad = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
        };

        if (img.complete) {
            handleImageLoad();
        } else {
            img.addEventListener('load', handleImageLoad);
            return () => img.removeEventListener('load', handleImageLoad);
        }
    }, []);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / rect.width * canvas.width);
        const y = Math.floor((e.clientY - rect.top) / rect.height * canvas.height);

        const ctx = canvas.getContext('2d');
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hexColor = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;

        setHoveredColor(hexColor);
    };

    const handleMouseLeave = () => {
        setHoveredColor(null);
    };

    const handleClick = () => {
        if (hoveredColor) {
            setPickedColor(hoveredColor);
            // Save as hexpickhome (4th argument)
            saveColorCategory(video.url, '', null, hoveredColor);
        }
    };

    const isEdited = hasBeenEdited(video.url);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                overflow: 'hidden',
                backgroundColor: '#1a1a1a',
                border: isEdited ? '2px solid rgba(76, 175, 80, 0.5)' : '2px solid transparent',
                cursor: 'crosshair',
                transition: 'border-color 0.3s'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            {/* Hidden canvas for color sampling */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Visible image */}
            <img
                ref={imgRef}
                src={jpgPath}
                alt=""
                crossOrigin="anonymous"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none'
                }}
                onError={(e) => {
                    e.target.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                }}
            />


            {/* Color preview overlay (top-left) - on hover */}
            {hoveredColor && (
                <div
                    style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        background: 'rgba(0,0,0,0.8)',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        pointerEvents: 'none'
                    }}
                >
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '4px',
                            backgroundColor: hoveredColor,
                            border: '2px solid white',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                    />
                    <div
                        style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '12px',
                            color: 'white',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {hoveredColor}
                    </div>
                </div>
            )}

            {/* Color comparison bar (bottom) - always visible */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    background: 'rgba(0,0,0,0.9)',
                    pointerEvents: 'none'
                }}
            >
                {/* Current color (hex1 or color) */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px',
                        gap: '4px',
                        borderRight: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '36px',
                            backgroundColor: video.hex1 || video.color,
                            borderRadius: '3px',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}
                    />
                    <div
                        style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '8px',
                            color: 'rgba(255,255,255,0.5)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}
                    >
                        Current
                    </div>
                    <div
                        style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '10px',
                            color: 'rgba(255,255,255,0.9)',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {video.hex1 || video.color}
                    </div>
                </div>

                {/* Picked color */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '10px',
                        gap: '4px',
                        background: (hoveredColor || pickedColor) ? 'rgba(76, 175, 80, 0.2)' : 'transparent'
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: '36px',
                            backgroundColor: hoveredColor || pickedColor || 'rgba(255,255,255,0.05)',
                            borderRadius: '3px',
                            border: (hoveredColor || pickedColor) ? '2px solid rgba(76, 175, 80, 0.8)' : '1px dashed rgba(255,255,255,0.2)'
                        }}
                    />
                    <div
                        style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '8px',
                            color: (hoveredColor || pickedColor) ? 'rgba(76, 175, 80, 1)' : 'rgba(255,255,255,0.3)',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}
                    >
                        {hoveredColor ? 'Preview' : (pickedColor ? 'Picked' : 'Not set')}
                    </div>
                    <div
                        style={{
                            fontFamily: 'var(--font-primary)',
                            fontSize: '10px',
                            color: (hoveredColor || pickedColor) ? 'rgba(76, 175, 80, 1)' : 'rgba(255,255,255,0.3)',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {hoveredColor || pickedColor || '—'}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HomeSetup = () => {
    const [minTileWidth, setMinTileWidth] = useState(300);
    const [stats, setStats] = useState({ totalEdits: 0 });
    const fileInputRef = useRef(null);

    // Filter to show only videos with GIFs (same as Grid.jsx) but check hex1
    const videosWithGifs = useMemo(() => {
        return videos.filter(video => {
            const videoId = video.url.split('v=')[1]?.split('&')[0];
            if (!videoId) return false;
            // For Home Setup we care about hex1 if available, but hex45/color is fallback
            return true;
        });
    }, []);

    // Use same sorting logic as Grid.jsx
    const hexToRgb = (hex) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex[1] + hex[2], 16);
            g = parseInt(hex[3] + hex[4], 16);
            b = parseInt(hex[5] + hex[6], 16);
        }
        return { r, g, b };
    };

    const rgbToHsl = (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        let h = 0;
        let s = 0;
        let l = (max + min) / 2;

        if (delta !== 0) {
            s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

            if (max === r) {
                h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
            } else if (max === g) {
                h = ((b - r) / delta + 2) / 6;
            } else {
                h = ((r - g) / delta + 4) / 6;
            }
        }

        return { h: h * 360, s, l };
    };

    // Convert RGB to LAB color space for perceptual color distance (from Grid.jsx)
    const rgbToLab = (r, g, b) => {
        // Normalize RGB to 0-1
        r = r / 255;
        g = g / 255;
        b = b / 255;

        // Convert to linear RGB
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        // Convert to XYZ
        let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        // Convert to LAB
        x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
        y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
        z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

        const L = (116 * y) - 16;
        const A = 500 * (x - y);
        const B = 200 * (y - z);

        return { L, A, B };
    };

    // Sort videos by 2D color map: hue (X) × lightness (Y) - EXACT SAME AS GRID.JSX
    const sortedVideos = useMemo(() => {
        // Convert all to HSL/LAB
        const videosWithColors = videosWithGifs.map(video => {
            const rgb = hexToRgb(video.hex1 || video.color);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
            return { ...video, hsl, lab };
        });

        // Ultra-precise 60-bucket approach (6° per bucket)
        const numBuckets = 60;
        const buckets = Array.from({ length: numBuckets }, () => []);

        // Assign to buckets by hue
        videosWithColors.forEach(video => {
            const bucketIdx = Math.floor(video.hsl.h / 6) % numBuckets;
            buckets[bucketIdx].push(video);
        });

        // Process each bucket with sub-clustering
        const sorted = [];

        buckets.forEach(bucket => {
            if (bucket.length === 0) return;

            // Sub-divide by saturation
            const vibrant = bucket.filter(v => v.hsl.s >= 0.4);
            const muted = bucket.filter(v => v.hsl.s >= 0.15 && v.hsl.s < 0.4);
            const neutral = bucket.filter(v => v.hsl.s < 0.15);

            // Nearest-neighbor LAB clustering within each sub-group
            const clusterSubGroup = (group) => {
                if (group.length === 0) return [];
                if (group.length === 1) return group;

                const clustered = [];
                const remaining = [...group];

                // Start with most saturated
                let current = remaining.reduce((best, v) =>
                    v.hsl.s > best.hsl.s ? v : best
                );

                clustered.push(current);
                remaining.splice(remaining.indexOf(current), 1);

                // Greedy nearest neighbor by LAB
                while (remaining.length > 0) {
                    let nearest = remaining[0];
                    let minDist = Infinity;

                    for (const video of remaining) {
                        const dL = current.lab.L - video.lab.L;
                        const dA = current.lab.A - video.lab.A;
                        const dB = current.lab.B - video.lab.B;
                        const dist = Math.sqrt(dL * dL + dA * dA + dB * dB);

                        if (dist < minDist) {
                            minDist = dist;
                            nearest = video;
                        }
                    }

                    clustered.push(nearest);
                    remaining.splice(remaining.indexOf(nearest), 1);
                    current = nearest;
                }

                return clustered;
            };

            // Cluster and combine
            sorted.push(...clusterSubGroup(vibrant));
            sorted.push(...clusterSubGroup(muted));
            sorted.push(...clusterSubGroup(neutral));
        });

        return sorted;
    }, [videosWithGifs]);

    // Update stats periodically
    useEffect(() => {
        const updateStats = () => {
            setStats(getEditStats());
        };

        updateStats();
        const interval = setInterval(updateStats, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleExport = () => {
        downloadColorCategories(videos);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all edits? This cannot be undone.')) {
            resetAllCategories();
            setStats({ totalEdits: 0 });
            window.location.reload();
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const { importColorCategories } = await import('../utils/colorCategoryStorage');
                const count = await importColorCategories(file);
                alert(`Successfully imported ${count} categories`);
                window.location.reload();
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            overflow: 'auto',
            background: '#0a0a0a'
        }}>
            <div style={{ position: 'relative', width: '100%', minHeight: '100vh', paddingTop: '80px', paddingBottom: '100px' }}>
                {/* Header */}
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 200,
                    background: 'rgba(10,10,10,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    padding: '20px 30px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-primary)',
                                fontSize: '14px',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                color: 'rgba(255,255,255,0.9)',
                                marginBottom: '4px'
                            }}>
                                Home Setup — Color Picker
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-primary)',
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.5)'
                            }}>
                                Using modal1sec captures • Pick #hexpickhome colors • {stats.totalEdits} saved
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleImportClick}
                                style={{
                                    padding: '8px 16px',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
                                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                Import
                            </button>
                            <button
                                onClick={handleExport}
                                style={{
                                    padding: '8px 16px',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    background: 'rgba(76, 175, 80, 0.2)',
                                    border: '1px solid rgba(76, 175, 80, 0.4)',
                                    borderRadius: '4px',
                                    color: '#4CAF50',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.target.style.background = 'rgba(76, 175, 80, 0.3)'}
                                onMouseLeave={e => e.target.style.background = 'rgba(76, 175, 80, 0.2)'}
                            >
                                Export JSON
                            </button>
                            <button
                                onClick={handleReset}
                                style={{
                                    padding: '8px 16px',
                                    fontFamily: 'var(--font-primary)',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    background: 'rgba(244, 67, 54, 0.2)',
                                    border: '1px solid rgba(244, 67, 54, 0.4)',
                                    borderRadius: '4px',
                                    color: '#F44336',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.target.style.background = 'rgba(244, 67, 54, 0.3)'}
                                onMouseLeave={e => e.target.style.background = 'rgba(244, 67, 54, 0.2)'}
                            >
                                Reset All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hidden file input for import */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`,
                    gap: '0px',
                    width: '100%',
                    transition: 'all 0.3s ease'
                }}>
                    {sortedVideos.map((video, index) => (
                        <ColorPickerVideoCard key={video.url} video={video} index={index} />
                    ))}
                </div>

                {/* Tile Size Controls */}
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    display: 'flex',
                    gap: '10px',
                    zIndex: 100
                }}>
                    <button
                        onClick={() => setMinTileWidth(prev => Math.min(2000, prev + 100))}
                        title="Bigger tiles"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            transition: 'background 0.2s',
                            fontFamily: 'var(--font-primary)'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        -
                    </button>
                    <button
                        onClick={() => setMinTileWidth(prev => Math.max(50, prev - 100))}
                        title="Smaller tiles"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '20px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            transition: 'background 0.2s',
                            fontFamily: 'var(--font-primary)'
                        }}
                        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeSetup;
