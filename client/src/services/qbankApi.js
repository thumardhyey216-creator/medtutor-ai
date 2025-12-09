import api from './api';

const QBankAPI = {
    startSession: async (mode, numQuestions, timed, filters = {}) => {
        const payload = { mode, numQuestions, timed, ...filters };
        const res = await api.post('/qbank/start-session', payload);
        return res.data;
    },

    submitAnswer: async (sessionId, questionId, selectedOption, timeSpent) => {
        const res = await api.post('/qbank/answer', {
            sessionId,
            questionId,
            selectedOption,
            timeSpent
        });
        return res.data;
    },

    completeSession: async (sessionId) => {
        const res = await api.post(`/qbank/session/${sessionId}/complete`);
        return res.data;
    },

    getSession: async (sessionId) => { // If needed for resuming
        const res = await api.get(`/qbank/session/${sessionId}`);
        return res.data;
    },

    getActiveSession: async () => {
        const res = await api.get('/qbank/active-session');
        return res.data;
    },

    getDeepDive: async (data) => {
        const res = await api.post('/qbank/deep-dive', data);
        return res.data;
    },

    sendChat: async (message, history, context) => {
        const res = await api.post('/qbank/chat', { message, history, context });
        return res.data;
    }
};

export default QBankAPI;
