export const API_BASE_URL = process.env.EXPO_PUBLIC_ENV === 'production' || !process.env.EXPO_PUBLIC_ENV
    ? process.env.EXPO_PUBLIC_API_BASE_URL
    : 'http://localhost:3000';

export const FALLBACK_API_BASE_URL = 'https://api.flalx.com';