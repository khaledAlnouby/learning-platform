import axios from 'axios';

// Create multiple instances if we have multiple gateways, or one base instance if using an API Gateway.
// For now, let's create a generic api that points to localhost (we'll assume an API Gateway or just use the direct ports).
// Wait, since we have 4 different ports (8081, 8082, 8083, 8084), we can map them dynamically based on the URL path, or set up a proxy in vite.config.js.
// We will set up a proxy in vite.config.js to route /api/users to 8081, /api/courses to 8082, etc.

const api = axios.create({
  baseURL: '/api', // This will be proxied
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
