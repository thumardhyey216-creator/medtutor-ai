import api from './api';

const FlashcardAPI = {
    getDecks: async (subject = null) => {
        let url = '/flashcards/decks';
        if (subject) url += `?subject=${encodeURIComponent(subject)}`;
        const res = await api.get(url);
        return res.data.decks || [];
    },

    createDeck: async (name, subject) => {
        const res = await api.post('/flashcards/decks', { name, subject });
        return res.data;
    },

    updateDeck: async (id, name, subject) => {
        const res = await api.put(`/flashcards/decks/${id}`, { name, subject });
        return res.data;
    },

    deleteDeck: async (id) => {
        const res = await api.delete(`/flashcards/decks/${id}`);
        return res.data;
    },

    getCards: async (subject = null) => {
        let url = '/flashcards';
        if (subject) url += `?subject=${encodeURIComponent(subject)}`;
        const res = await api.get(url);
        return res.data.cards || [];
    },

    getDueCards: async () => {
        const res = await api.get('/flashcards/due-today');
        return res.data;
    },

    getNextCards: async (limit = 20, deckId = null) => {
        let url = `/flashcards/next?limit=${limit}`;
        if (deckId) url += `&deckId=${deckId}`;
        const res = await api.get(url);
        return res.data.cards || [];
    },

    createCard: async (deckId, front, back) => {
        const res = await api.post('/flashcards', { deckId, front, back });
        return res.data;
    },

    updateCard: async (id, front, back, deckId) => {
        const res = await api.put(`/flashcards/${id}`, { front, back, deckId });
        return res.data;
    },

    deleteCard: async (id) => {
        const res = await api.delete(`/flashcards/${id}`);
        return res.data;
    },

    submitReview: async (cardId, quality) => {
        const res = await api.post('/flashcards/review', { cardId, quality });
        return res.data;
    },

    generateAI: async (subject, topic, count) => {
        const res = await api.post('/flashcards/generate', { subject, topic, count });
        return res.data;
    },

    getStats: async () => {
        const res = await api.get('/flashcards/stats');
        return res.data;
    }
};

export default FlashcardAPI;
