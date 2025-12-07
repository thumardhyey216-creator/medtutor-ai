import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('medtutor_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401/403 (Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Clear storage and redirect to login
            localStorage.removeItem('medtutor_token');
            localStorage.removeItem('medtutor_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
