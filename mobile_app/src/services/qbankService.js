import api from './api';

const qbankService = {
    // Start a new test session
    startSession: async (sessionConfig) => {
        try {
            const response = await api.post('/qbank/start-session', sessionConfig);
            return response.data;
        } catch (error) {
            console.error('Error starting session:', error);
            throw error;
        }
    },

    // Submit an answer
    submitAnswer: async (answerData) => {
        try {
            const response = await api.post('/qbank/answer', answerData);
            return response.data;
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    },

    // Complete a session
    completeSession: async (sessionId) => {
        try {
            const response = await api.post(`/qbank/session/${sessionId}/complete`);
            return response.data;
        } catch (error) {
            console.error('Error completing session:', error);
            throw error;
        }
    },

    // Get session details
    getSession: async (sessionId) => {
        try {
            const response = await api.get(`/qbank/session/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching session:', error);
            throw error;
        }
    },

    // Generate questions
    generateQuestions: async (generateConfig) => {
        try {
            const response = await api.post('/qbank/generate', generateConfig);
            return response.data;
        } catch (error) {
            console.error('Error generating questions:', error);
            throw error;
        }
    },

    // Get questions list (browsing)
    getQuestions: async (params) => {
        try {
            const response = await api.get('/qbank/questions', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching questions:', error);
            throw error;
        }
    },

    // Get deep dive explanation
    getDeepDive: async (data) => {
        try {
            const response = await api.post('/qbank/deep-dive', data);
            return response.data;
        } catch (error) {
            console.error('Error getting deep dive:', error);
            throw error;
        }
    }
};

export default qbankService;
