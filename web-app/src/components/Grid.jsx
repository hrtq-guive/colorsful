import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseVideoTitle } from '../utils/titleParser';
import { useVideo } from '../contexts/VideoContext';
import { ASSET_BASE_URL } from '../config/assets';
import videos from '../data/videos.json';

const VideoCard = ({ video, index, loadedBatches }) => {
    const { openVideo, setOriginRoute } = useVideo();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [gifPreloaded, setGifPreloaded] = useState(false);
    const videoId = video.url.split('v=')[1]?.split('&')[0];
    const { fullArtist, songTitle } = parseVideoTitle(video.title);

    // Asset paths
    const jpgPath = `${ASSET_BASE_URL}captures/${videoId}_45s.jpg`;
    const gifPath = `${ASSET_BASE_URL}captures/${videoId}_45s.gif`;

    // Sequential batch loading - only load if this tile's batch is active
    useEffect(() => {
        const batchSize = 16;
        const myBatch = Math.floor(index / batchSize);

        // Only load if my batch number is <= current loaded batches
        if (myBatch <= loadedBatches && !gifPreloaded) {
            const img = new Image();
            img.src = gifPath;
            img.onload = () => setGifPreloaded(true);
        }
    }, [gifPath, index, loadedBatches, gifPreloaded]);

    const handleClick = () => {
        setOriginRoute('/grid'); // Explicitly set origin before opening
        openVideo(video); // Backdrop handled by VideoContext (uses hexpickhome)

        // Update URL to match color (hexpickhome or historical)
        const slug = (video.hexpickhome || video.color).replace('#', '');
        navigate(`/${slug}`);
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                cursor: 'pointer',
                overflow: 'hidden',
                borderRadius: '0px',
                backgroundColor: '#1a1a1a' // Placeholder color
            }}
        >
            {/* Image/GIF Layer */}
            <img
                src={isHovered ? gifPath : jpgPath}
                alt={`${fullArtist} - ${songTitle}`}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'opacity 0.2s',
                    opacity: 1,
                    transform: index % 2 === 0 ? 'scaleX(-1)' : 'none' // Flip even-indexed videos horizontally
                }}
                onError={(e) => {
                    // Fallback to youtube thumb if local asset missing
                    if (e.target.src !== `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`) {
                        e.target.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    }
                }}
            />
        </div>
    );
};

const Grid = () => {
    // State for Tile Size (inverse of "Number of Tiles")
    // Default 300px.
    const [minTileWidth, setMinTileWidth] = useState(300);
    const { currentVideo } = useVideo();
    const grid1Ref = useRef(null);

    // Sequential batch loading state
    const [loadedBatches, setLoadedBatches] = useState(0);

    // Branding state
    const [isBrandingHovered, setIsBrandingHovered] = useState(false);
    const [showCredit, setShowCredit] = useState(false);
    const creditTimeoutRef = useRef(null);



    // Filter to show only videos with GIFs (531 videos)
    const videosWithGifs = useMemo(() => {
        return videos.filter(video => {
            const videoId = video.url.split('v=')[1]?.split('&')[0];
            if (!videoId) return false;
            // Check if GIF file exists by checking hexpick (user-picked or hex45 fallback)
            return video.hexpick; // Videos with hexpick have color data
        });
    }, []);

    // Sequential batch loading - increment batch every 2 seconds
    useEffect(() => {
        const totalVideos = videosWithGifs.length;
        const batchSize = 16;
        const totalBatches = Math.ceil(totalVideos / batchSize);

        if (loadedBatches < totalBatches) {
            const timer = setTimeout(() => {
                setLoadedBatches(prev => prev + 1);
            }, 2000); // Wait 2 seconds before loading next batch

            return () => clearTimeout(timer);
        }
    }, [loadedBatches, videosWithGifs.length]);

    // Convert hex to RGB
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

    // Convert RGB to LAB color space for perceptual color distance
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

    // Convert RGB to HSL
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

    // Sort videos by color spectrum with alternating luminosity
    const sortedVideos = useMemo(() => {
        // Convert all to HSL/LAB
        const videosWithColors = videosWithGifs.map(video => {
            const rgb = hexToRgb(video.hexpick || video.color);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
            return { ...video, hsl, lab };
        });

        // Custom color order: pink → red → brown → orange → yellow → green → light blue → dark blue → purple
        // Define 10 buckets with specific hue ranges
        const colorBuckets = [
            { name: 'pink', hueMin: 330, hueMax: 360 },      // Pink (330-360°)
            { name: 'pink2', hueMin: 0, hueMax: 10 },        // Pink continuation (0-10°)
            { name: 'red', hueMin: 10, hueMax: 25 },         // Red (10-25°)
            { name: 'brown', hueMin: 25, hueMax: 45 },       // Brown/dark orange (25-45°)
            { name: 'orange', hueMin: 45, hueMax: 60 },      // Orange (45-60°)
            { name: 'yellow', hueMin: 60, hueMax: 90 },      // Yellow (60-90°)
            { name: 'green', hueMin: 90, hueMax: 180 },      // Green (90-180°)
            { name: 'lightBlue', hueMin: 180, hueMax: 240 }, // Light blue/cyan (180-240°)
            { name: 'darkBlue', hueMin: 240, hueMax: 270 },  // Dark blue (240-270°)
            { name: 'purple', hueMin: 270, hueMax: 330 }     // Purple/magenta (270-330°)
        ];

        const buckets = colorBuckets.map(() => []);

        // Assign videos to buckets based on hue ranges
        videosWithColors.forEach(video => {
            const hue = video.hsl.h;
            for (let i = 0; i < colorBuckets.length; i++) {
                const { hueMin, hueMax } = colorBuckets[i];
                if (hue >= hueMin && hue < hueMax) {
                    buckets[i].push(video);
                    break;
                }
            }
        });

        // Process each bucket with two-pass sorting:
        // Pass 1: Group by saturation
        // Pass 2: LAB clustering within each saturation group
        const sorted = [];

        buckets.forEach((bucket, bucketIndex) => {
            if (bucket.length === 0) return;
            if (bucket.length === 1) {
                sorted.push(...bucket);
                return;
            }

            // Pass 1: Divide into saturation groups
            const vibrant = bucket.filter(v => v.hsl.s >= 0.5);
            const saturated = bucket.filter(v => v.hsl.s >= 0.25 && v.hsl.s < 0.5);
            const muted = bucket.filter(v => v.hsl.s >= 0.1 && v.hsl.s < 0.25);
            const grey = bucket.filter(v => v.hsl.s < 0.1);

            // Pass 2: LAB clustering within each group
            const clusterGroup = (group) => {
                if (group.length === 0) return [];
                if (group.length === 1) return group;

                const clustered = [];
                const remaining = [...group];

                // Start with first color in group
                let current = remaining[0];
                clustered.push(current);
                remaining.splice(0, 1);

                // Nearest neighbor by LAB distance (within same saturation range)
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

            // Cluster each saturation group separately
            const clusteredVibrant = clusterGroup(vibrant);
            const clusteredSaturated = clusterGroup(saturated);
            const clusteredMuted = clusterGroup(muted);
            const clusteredGrey = clusterGroup(grey);

            // Combine groups in order
            const combined = [
                ...clusteredVibrant,
                ...clusteredSaturated,
                ...clusteredMuted,
                ...clusteredGrey
            ];

            // Apply alternating direction
            if (bucketIndex % 2 === 0) {
                sorted.push(...combined.reverse());
            } else {
                sorted.push(...combined);
            }
        });

        // Post-processing: LAB-based outlier correction
        // DISABLED - the two-pass sorting works better without post-processing
        /*
        for (let pass = 0; pass < 5; pass++) {
            for (let i = 5; i < sorted.length - 5; i++) {
                const current = sorted[i];

                // Get local neighborhood
                const neighbors = [
                    ...sorted.slice(i - 5, i),
                    ...sorted.slice(i + 1, i + 6)
                ];

                // Calculate average LAB distance to neighbors
                let avgDist = 0;
                neighbors.forEach(n => {
                    const dL = current.lab.L - n.lab.L;
                    const dA = current.lab.A - n.lab.A;
                    const dB = current.lab.B - n.lab.B;
                    avgDist += Math.sqrt(dL * dL + dA * dA + dB * dB);
                });
                avgDist /= neighbors.length;

                // If average distance is high (outlier), try to find a better position
                // Stricter threshold (20) to catch more outliers
                if (avgDist > 20) {
                    let bestPos = i;
                    let minAvgDist = avgDist;

                    for (let j = 0; j < sorted.length; j++) {
                        if (Math.abs(j - i) < 10) continue; // Skip nearby positions

                        const testNeighbors = [
                            ...sorted.slice(Math.max(0, j - 5), j),
                            ...sorted.slice(j + 1, Math.min(sorted.length, j + 6))
                        ];

                        let testAvgDist = 0;
                        testNeighbors.forEach(n => {
                            const dL = current.lab.L - n.lab.L;
                            const dA = current.lab.A - n.lab.A;
                            const dB = current.lab.B - n.lab.B;
                            testAvgDist += Math.sqrt(dL * dL + dA * dA + dB * dB);
                        });
                        testAvgDist /= testNeighbors.length;

                        if (testAvgDist < minAvgDist) {
                            minAvgDist = testAvgDist;
                            bestPos = j;
                        }
                    }

                    // Relocate if we found a significantly better position (30% improvement)
                    if (bestPos !== i && minAvgDist < avgDist * 0.7) {
                        const outlier = sorted.splice(i, 1)[0];
                        sorted.splice(bestPos, 0, outlier);
                    }
                }
            }
        }
        */

        // Rotate grid to start with "MARO - oxalá"
        const pivotIndex = sorted.findIndex(v => v.title.toLowerCase().includes('maro - oxal'));
        if (pivotIndex !== -1) {
            const part1 = sorted.slice(pivotIndex);
            const part2 = sorted.slice(0, pivotIndex);
            return [...part1, ...part2];
        }

        return sorted;
    }, [videosWithGifs]);

    // Infinite scroll REMOVED per user request

    const handleIncreaseTiles = () => {
        // Smaller tiles = More tiles (zoom out to see all)
        // Restricted to 150 (was 50) to prevent "last zoom out"
        setMinTileWidth(prev => Math.max(150, prev - 100));
    };

    const handleDecreaseTiles = () => {
        // Bigger tiles = Fewer tiles (zoom in to single video)
        setMinTileWidth(prev => Math.min(2000, prev + 100));
    };

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            background: 'transparent',
            opacity: currentVideo ? 0 : 1,
            transition: 'opacity 0.4s ease'
        }}>
            {/* COLORSFUL Branding - Aligned with menu */}
            <div
                onMouseEnter={() => {
                    setIsBrandingHovered(true);
                    setShowCredit(true);
                    clearTimeout(creditTimeoutRef.current);
                    creditTimeoutRef.current = setTimeout(() => setShowCredit(false), 3000);
                }}
                onMouseLeave={() => setIsBrandingHovered(false)}
                onClick={() => {
                    setShowCredit(true);
                    clearTimeout(creditTimeoutRef.current);
                    creditTimeoutRef.current = setTimeout(() => setShowCredit(false), 3000);
                }}
                style={{
                    position: 'fixed',
                    top: '36px',
                    left: '30px',
                    color: isBrandingHovered ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3rem',
                    zIndex: 100,
                    opacity: currentVideo ? 0 : 1,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                }}
            >COLORSFUL</div>

            <div style={{
                position: 'fixed',
                top: '64px',
                left: '30px',
                zIndex: 100,
                opacity: (showCredit && !currentVideo) ? 1 : 0,
                pointerEvents: showCredit ? 'auto' : 'none',
                transition: 'opacity 0.4s ease',
                transform: showCredit ? 'translateY(0)' : 'translateY(-10px)'
            }}>
                <a href="https://www.heretique.fr" target="_blank" rel="noopener noreferrer" style={{
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '0.6rem',
                    fontWeight: '600',
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2rem',
                    display: 'block'
                }}>created by hérétique</a>
                <div style={{
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: '600',
                    opacity: 0.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2rem',
                    marginTop: '4px'
                }}>on top of COLORSxSTUDIOS' catalog</div>
            </div>

            {/* Single Grid Set */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`,
                    gap: '0px',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    background: 'transparent'
                }}
            >
                {sortedVideos.map((video, index) => (
                    <VideoCard key={video.url} video={video} index={index} loadedBatches={loadedBatches} />
                ))}
            </div>

            {/* Controls */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                zIndex: 100
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50px',
                    padding: '0',
                    backdropFilter: 'blur(10px)',
                    overflow: 'hidden'
                }}>
                    <div
                        onClick={handleDecreaseTiles}
                        style={{
                            padding: '12px 24px',
                            cursor: 'pointer',
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15rem',
                            fontFamily: 'var(--font-primary)',
                            transition: 'all 0.2s',
                            borderRight: '1px solid rgba(255,255,255,0.2)'
                        }}
                        onMouseEnter={e => {
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'rgba(255, 255, 255, 0.4)';
                        }}
                    >
                        LESS
                    </div>
                    <div
                        onClick={handleIncreaseTiles}
                        style={{
                            padding: '12px 24px',
                            cursor: 'pointer',
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15rem',
                            fontFamily: 'var(--font-primary)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                            e.target.style.background = 'rgba(255,255,255,0.1)';
                            e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                        }}
                        onMouseLeave={e => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = 'rgba(255, 255, 255, 0.4)';
                        }}
                    >
                        MORE
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Grid;
