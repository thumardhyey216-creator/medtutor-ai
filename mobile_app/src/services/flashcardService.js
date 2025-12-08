import api from './api';

const flashcardService = {
    getDecks: async (subject = null) => {
        try {
            let url = '/flashcards/decks';
            if (subject) url += `?subject=${encodeURIComponent(subject)}`;
            const res = await api.get(url);
            return res.data.decks || [];
        } catch (error) {
            console.error('Error fetching decks:', error);
            return [];
        }
    },

    getCards: async (subject = null) => {
        try {
            let url = '/flashcards';
            if (subject) url += `?subject=${encodeURIComponent(subject)}`;
            const res = await api.get(url);
            return res.data.cards || [];
        } catch (error) {
            console.error('Error fetching cards:', error);
            return [];
        }
    },

    getNextCards: async (limit = 20, deckId = null) => {
        try {
            let url = `/flashcards/next?limit=${limit}`;
            if (deckId) url += `&deckId=${deckId}`;
            const res = await api.get(url);
            return res.data.cards || [];
        } catch (error) {
            console.error('Error fetching next cards:', error);
            return [];
        }
    },

    submitReview: async (cardId, quality) => {
        try {
            const res = await api.post('/flashcards/review', { cardId, quality });
            return res.data;
        } catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
    },

    getStats: async () => {
        try {
            const res = await api.get('/flashcards/stats');
            return res.data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return { totalCards: 0, mastered: 0, learning: 0, streak: 0 };
        }
    }
};

export default flashcardService;
