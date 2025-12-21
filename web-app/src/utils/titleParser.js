// Utility function to parse video title
export const parseVideoTitle = (title) => {
    const parts = title.split('|')[0].trim();
    const [artist, ...songParts] = parts.split('-').map(s => s.trim());
    let songTitle = songParts.join('-');

    // Extract featuring artists from song title
    const featMatch = songTitle.match(/\(feat\.?\s+([^)]+)\)/i);
    let featuring = '';
    if (featMatch) {
        featuring = featMatch[1];
        songTitle = songTitle.replace(/\(feat\.?\s+[^)]+\)/i, '').trim();
    }

    return {
        artist,
        songTitle: songTitle || parts,
        featuring,
        fullArtist: featuring ? `${artist} (feat. ${featuring})` : artist
    };
};
