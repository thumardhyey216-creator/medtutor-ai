import api from './api';

const chatService = {
    sendMessage: async (message, sessionId = null, context = {}) => {
        try {
            const res = await api.post('/chat/message', {
                message,
                sessionId,
                ...context
            });
            return res.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    // Optional: Clear chat history or start new session if backend supports it
    startNewSession: async () => {
        // Implementation depends on backend session management
        return null;
    }
};

export default chatService;
