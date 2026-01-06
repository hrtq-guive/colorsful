// Asset configuration for production deployment
// Update ASSET_BASE_URL after setting up Cloudflare R2

export const ASSET_BASE_URL = import.meta.env.PROD
    ? 'https://pub-50257ec5744e409ba7e6b196bd71e679.r2.dev/'
    : '/'; // Local development uses public folder

export const getGifUrl = (videoId) => `${ASSET_BASE_URL}gifs/${videoId}.gif`;

export const getCaptureUrl = (videoId, type = 'modal1sec') =>
    `${ASSET_BASE_URL}captured_pages/${videoId}_${type}.jpg`;
