import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API URL - Using the production Render URL
// For local development on Android Emulator use: 'http://10.0.2.2:3000/api'
// For local development on Physical Device use: 'http://YOUR_LOCAL_IP:3000/api'
const API_URL = 'https://medtutor-ai.onrender.com/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('medtutor_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error retrieving token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 (Logout)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Token expired or invalid
            await AsyncStorage.removeItem('medtutor_token');
            await AsyncStorage.removeItem('medtutor_user');
            // In a real app, you might want to navigate to login screen here
            // or emit an event that the App component listens to
        }
        return Promise.reject(error);
    }
);

export default api;
