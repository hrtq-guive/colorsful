import { useState } from 'react';
import { videos } from '../data/videos';
import { hexToRgb, rgbToHsl, hslToRgb } from '../utils/color';


const getLogoMaxRadiusAtAngle = (angleDeg) => {
    const angle = Math.floor(((angleDeg % 360) + 360) % 360);
    const radiusLookup360 = [
        32.1, 32.4, 32.1, 32.2, 32.2, 32.2, 32.3, 32.3, 32.4, 32.3,
        32.3, 32.2, 32.3, 32.2, 32.3, 32.2, 32.1, 32.1, 32.2, 32.1,
        32.3, 32.3, 32.2, 32.2, 32.2, 32.2, 32.2, 32.2, 32.4, 32.4,
        32.5, 32.5, 32.6, 32.6, 32.7, 32.8, 32.9, 33.0, 32.8, 33.0,
        33.1, 33.3, 33.4, 33.3, 33.5, 33.7, 33.9, 33.9, 34.1, 34.1,
        34.4, 34.4, 34.7, 34.7, 34.7, 34.9, 35.1, 35.0, 35.1, 35.1,
        34.8, 34.7, 34.7, 34.4, 34.4, 34.1, 34.1, 33.8, 33.6, 33.3,
        33.4, 33.2, 33.0, 32.8, 32.6, 32.5, 32.3, 32.2, 32.1, 32.0,
        31.8, 31.8, 31.7, 31.6, 31.5, 31.5, 31.4, 31.2, 31.1, 31.1,
        31.1, 30.9, 30.9, 30.9, 30.7, 30.7, 30.8, 30.8, 30.7, 30.7,
        30.6, 30.7, 30.6, 30.6, 30.5, 30.7, 30.5, 30.7, 30.6, 30.8,
        30.7, 30.6, 30.9, 30.8, 30.8, 30.7, 31.0, 31.0, 31.0, 31.0,
        31.0, 31.1, 31.1, 31.1, 31.2, 31.3, 31.3, 31.4, 31.5, 31.7,
        31.8, 31.8, 31.9, 32.1, 32.1, 32.3, 32.5, 32.4, 32.7, 33.0,
        32.9, 33.2, 33.4, 33.4, 33.5, 33.7, 33.7, 33.8, 33.7, 33.7,
        33.6, 33.6, 33.3, 33.2, 33.2, 33.0, 33.0, 32.7, 32.7, 32.8,
        32.6, 32.6, 32.7, 32.5, 32.6, 32.7, 32.6, 32.7, 32.8, 32.7,
        32.6, 32.5, 32.4, 32.6, 32.5, 32.5, 32.4, 32.4, 32.4, 32.4,
        32.1, 32.1, 32.1, 32.2, 32.2, 32.2, 32.0, 32.1, 32.2, 32.0,
        32.1, 32.1, 32.1, 32.2, 32.1, 32.2, 32.1, 32.1, 32.2, 32.1,
        32.1, 32.3, 32.2, 32.2, 32.3, 32.2, 32.4, 32.4, 32.4, 32.4,
        32.2, 32.3, 32.3, 32.3, 32.4, 32.5, 32.3, 32.4, 32.3, 32.3,
        32.1, 32.2, 32.1, 32.1, 32.1, 32.0, 32.1, 32.0, 31.9, 32.0,
        31.8, 32.0, 31.9, 31.8, 32.0, 31.9, 32.0, 31.9, 32.0, 31.9,
        31.9, 32.2, 32.1, 32.1, 32.1, 32.1, 32.2, 32.3, 32.3, 32.3,
        32.3, 32.4, 32.4, 32.5, 32.6, 32.7, 32.6, 32.8, 32.8, 33.0,
        33.1, 33.0, 33.2, 33.3, 33.5, 33.5, 33.7, 33.7, 33.9, 33.9,
        33.9, 33.9, 33.9, 33.9, 33.7, 33.7, 33.8, 33.9, 33.9, 33.8,
        33.9, 33.7, 33.6, 33.7, 33.6, 33.5, 33.4, 33.3, 33.5, 33.4,
        33.3, 33.1, 33.0, 33.0, 33.0, 33.0, 32.8, 32.8, 32.7, 32.7,
        32.7, 32.5, 32.6, 32.3, 32.4, 32.5, 32.3, 32.2, 32.2, 32.0,
        32.1, 32.0, 31.9, 32.0, 31.8, 32.0, 31.8, 31.7, 31.8, 31.6,
        31.7, 31.7, 31.5, 31.8, 31.7, 31.6, 31.5, 31.4, 31.4, 31.6,
        31.6, 31.6, 31.6, 31.5, 31.6, 31.6, 31.6, 31.6, 31.7, 31.4,
        31.5, 31.6, 31.7, 31.5, 31.6, 31.7, 31.8, 31.7, 31.8, 32.0,
        31.8, 32.0, 31.9, 32.1, 32.0, 32.2, 32.2, 32.2, 32.1, 32.1
    ];
    return radiusLookup360[angle] || 32;
};

const OptionsComparison = () => {
    // Process videos (same as LogoPage)
    const processedVideos = videos.map((v, i) => {
        const angleDeg = (i / videos.length) * 360;
        const angleRad = ((angleDeg - 90) * Math.PI) / 180;
        const maxRadius = getLogoMaxRadiusAtAngle(angleDeg);
        const radius = Math.random() * maxRadius * 0.9;

        return {
            ...v,
            angleDeg,
            radius,
            wheelX: 50 + radius * Math.cos(angleRad),
            wheelY: 50 + radius * Math.sin(angleRad)
        };
    });

    // Generate islands for a specific blend method
    const generateIslands = (blendMethod, blendCount) => {
        const islands = [];
        const GRID_SIZE = 1;

        for (let x = 0; x <= 100; x += GRID_SIZE) {
            for (let y = 0; y <= 100; y += GRID_SIZE) {
                const dx = x - 50;
                const dy = y - 50;
                const radius = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
                const maxRadiusAtAngle = getLogoMaxRadiusAtAngle(angle);

                if (radius > maxRadiusAtAngle) continue;

                const cellAngle = angle;
                const videoDistances = processedVideos.map(v => {
                    const distX = x - v.wheelX;
                    const distY = y - v.wheelY;
                    const euclideanDist = Math.sqrt(distX * distX + distY * distY);

                    let angleDiff = Math.abs(cellAngle - v.angleDeg);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;

                    let angleWeight = 1;
                    if (angleDiff > 45) angleWeight = 50;
                    else if (angleDiff > 30) angleWeight = 10;
                    else if (angleDiff > 15) angleWeight = 3;

                    return { video: v, dist: euclideanDist * angleWeight };
                });

                videoDistances.sort((a, b) => a.dist - b.dist);
                const nearestVideos = videoDistances.slice(0, blendCount);

                let totalWeight = 0;
                let r = 0, g = 0, b = 0;

                nearestVideos.forEach(({ video, dist }) => {
                    // Option 1: squared inverse, Option 5: linear inverse
                    const weight = blendMethod === 1 ? 1 / ((dist * dist) + 0.1) : 1 / (dist + 0.1);
                    totalWeight += weight;

                    const rgb = hexToRgb(video.color);
                    if (rgb) {
                        r += rgb.r * weight;
                        g += rgb.g * weight;
                        b += rgb.b * weight;
                    }
                });

                if (totalWeight > 0) {
                    r = Math.round(r / totalWeight);
                    g = Math.round(g / totalWeight);
                    b = Math.round(b / totalWeight);

                    const hsl = rgbToHsl(r, g, b);
                    hsl.s = Math.min(hsl.s * 2.0, 100);
                    hsl.l = Math.max(hsl.l, 15);
                    hsl.l = Math.min(hsl.l, 90);
                    const boosted = hslToRgb(hsl.h, hsl.s, hsl.l);

                    islands.push({
                        x,
                        y,
                        color: `rgb(${boosted.r}, ${boosted.g}, ${boosted.b})`,
                        size: GRID_SIZE * 1.5
                    });
                }
            }
        }

        return islands;
    };

    const option1Islands = generateIslands(1, 3);
    const option5Islands = generateIslands(5, 4);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: '#000',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                fontSize: '24px',
                fontWeight: '600',
                textAlign: 'center',
                borderBottom: '1px solid #333'
            }}>
                Blending Options Comparison
            </div>

            {/* Split View */}
            <div style={{ display: 'flex', flex: 1 }}>
                {/* Option 1 */}
                <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #333' }}>
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.5)',
                        padding: '10px 15px',
                        borderRadius: '8px'
                    }}>
                        <strong>Option 1:</strong> Gradient Interpolation<br />
                        <small>Squared inverse distance (3 neighbors)</small>
                    </div>

                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '80%',
                            paddingBottom: '80%',
                            position: 'relative',
                            maskImage: 'url(/logo-mask.svg)',
                            WebkitMaskImage: 'url(/logo-mask.svg)',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center'
                        }}>
                            <div style={{ position: 'absolute', inset: 0 }}>
                                {option1Islands.map((island, i) => (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        left: `${island.x}%`,
                                        top: `${island.y}%`,
                                        width: `${island.size}%`,
                                        height: `${island.size}%`,
                                        background: island.color,
                                        transform: 'translate(-50%, -50%)',
                                        borderRadius: '50%'
                                    }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Option 5 */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.5)',
                        padding: '10px 15px',
                        borderRadius: '8px'
                    }}>
                        <strong>Option 5:</strong> Distance-Weighted Blend<br />
                        <small>Linear inverse distance (4 neighbors)</small>
                    </div>

                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '80%',
                            paddingBottom: '80%',
                            position: 'relative',
                            maskImage: 'url(/logo-mask.svg)',
                            WebkitMaskImage: 'url(/logo-mask.svg)',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center'
                        }}>
                            <div style={{ position: 'absolute', inset: 0 }}>
                                {option5Islands.map((island, i) => (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        left: `${island.x}%`,
                                        top: `${island.y}%`,
                                        width: `${island.size}%`,
                                        height: `${island.size}%`,
                                        background: island.color,
                                        transform: 'translate(-50%, -50%)',
                                        borderRadius: '50%'
                                    }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OptionsComparison;
