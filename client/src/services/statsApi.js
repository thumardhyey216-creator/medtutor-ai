import api from './api';

const StatsAPI = {
    getOverview: async (range = '7d') => {
        const res = await api.get(`/stats/overview?range=${range}`);
        return res.data;
    },

    getActivity: async (range = '7d') => {
        const res = await api.get(`/stats/activity?range=${range}`);
        return res.data;
    },

    getAccuracy: async (range = '7d') => {
        const res = await api.get(`/stats/accuracy?range=${range}`);
        return res.data;
    },

    getTodayPlan: async () => {
        const res = await api.get('/stats/today-plan');
        return res.data;
    },

    getUsage: async (range = '7d') => {
        const res = await api.get(`/stats/usage?range=${range}`);
        return res.data;
    }
};

export default StatsAPI;
