import axios from 'axios';

/**
 * Custom Axios instance for KrishiLink.
 * This automatically uses the URL from your .env.local file.
 */
const api = axios.create({
  // process.env is how Next.js reads your .env.local file
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;