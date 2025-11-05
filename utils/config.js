// export const API_BASE_URL = "http://localhost:3000";
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').replace(/\/+$/, '');
// export const API_BASE_URL = ('https://41fbcda0fb9e.ngrok-free.app' || '').replace(/\/+$/, '');
