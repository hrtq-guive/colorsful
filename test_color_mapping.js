
const colors = [
    { hex: '#ff0000', label: 'Pure Red' },
    { hex: '#800000', label: 'Dark Red' },
    { hex: '#ff8080', label: 'Light Red' },
    { hex: '#000000', label: 'Black' },
    { hex: '#ffffff', label: 'White' },
    { hex: '#808080', label: 'Gray' },
    { hex: '#ffff00', label: 'Pure Yellow' },
    { hex: '#808000', label: 'Olive (Dark Yellow)' }
];

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
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

console.log('--- Current Mapping (S-only) ---');
colors.forEach(c => {
    const rgb = hexToRgb(c.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const radius = hsl.s;
    console.log(`${c.label.padEnd(15)} | H:${hsl.h.toFixed(0).padStart(3)} S:${hsl.s.toFixed(0).padStart(3)} L:${hsl.l.toFixed(0).padStart(3)} | Radius: ${radius.toFixed(0)}`);
});

console.log('\n--- Proposed Mapping (Vibrancy-based) ---');
colors.forEach(c => {
    const rgb = hexToRgb(c.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    // Vibrancy formula: S * (1 - |L-50|/50)
    const intensity = hsl.s * (1 - Math.abs(hsl.l - 50) / 50);
    console.log(`${c.label.padEnd(15)} | H:${hsl.h.toFixed(0).padStart(3)} S:${hsl.s.toFixed(0).padStart(3)} L:${hsl.l.toFixed(0).padStart(3)} | Radius: ${intensity.toFixed(0)}`);
});
