export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

export function getDistance(rgb1, rgb2) {
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

// Weighted HSL distance for more intuitive "closest color" matching
export function getWeightedHslDistance(hsl1, hsl2) {
    let dh = Math.abs(hsl1.h - hsl2.h);
    if (dh > 180) dh = 360 - dh;

    // Normalize weights: Hue is most important for a color wheel
    // But Saturation and Lightness allow access to different "depths"
    const wh = 2.0;
    const ws = 0.5;
    const wl = 0.5;

    // Normalize values to 0-1 for distance calculation
    const hDist = (dh / 180) * wh;
    const sDist = (Math.abs(hsl1.s - hsl2.s) / 100) * ws;
    const lDist = (Math.abs(hsl1.l - hsl2.l) / 100) * wl;

    return Math.sqrt(hDist * hDist + sDist * sDist + lDist * lDist);
}

export function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return {
        r: Math.round(255 * f(0)),
        g: Math.round(255 * f(8)),
        b: Math.round(255 * f(4))
    };
}
