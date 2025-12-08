import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);

    const LIMIT = 20;

    const loadRecentChats = useCallback(async () => {
        try {
            const res = await api.get('/chat/sessions?limit=5');
            setRecentChats(res.data.sessions || []);
        } catch (err) {
            console.error('Failed to load recent chats', err);
        }
    }, []);

    const loadSession = useCallback(async (sessionId) => {
        try {
            setIsLoading(true);
            const res = await api.get(`/chat/sessions/${sessionId}?limit=${LIMIT}&offset=0`);
            setMessages(res.data.messages || []);
            setCurrentSessionId(sessionId);
            setHasMore(res.data.pagination?.hasMore || false);
            setOffset(0);
            localStorage.setItem('medtutor_last_session', sessionId);
        } catch (err) {
            console.error('Failed to load session', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendMessage = async (text, exam, responseStyle, isGeneralMode) => {
        if (!text.trim()) return;

        // Optimistic update
        const userMsg = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const res = await api.post('/chat/message', {
                message: text,
                sessionId: currentSessionId,
                exam,
                response_style: responseStyle,
                mode: isGeneralMode ? 'general' : 'normal'
            });

            // Update session ID if new
            if (res.data.sessionId && res.data.sessionId !== currentSessionId) {
                setCurrentSessionId(res.data.sessionId);
                localStorage.setItem('medtutor_last_session', res.data.sessionId);
            }

            const aiMsg = {
                role: 'ai',
                content: res.data.response,
                sources: res.data.sources,
                suggestedQuestions: res.data.suggestedQuestions
            };
            setMessages(prev => [...prev, aiMsg]);

            loadRecentChats(); // Refresh sidebar
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const startNewChat = useCallback(() => {
        setCurrentSessionId(null);
        setMessages([]);
        localStorage.removeItem('medtutor_last_session');
    }, []);

    const loadMoreMessages = useCallback(async () => {
        if (!currentSessionId || isHistoryLoading || !hasMore) return;

        setIsHistoryLoading(true);
        try {
            const nextOffset = offset + LIMIT;
            const res = await api.get(`/chat/sessions/${currentSessionId}?limit=${LIMIT}&offset=${nextOffset}`);

            if (res.data.messages?.length) {
                setMessages(prev => [...res.data.messages.reverse(), ...prev]); // Prepend old messages
                setOffset(nextOffset);
                setHasMore(res.data.pagination?.hasMore || false);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsHistoryLoading(false);
        }
    }, [currentSessionId, offset, hasMore, isHistoryLoading]);

    // Initial load
    useEffect(() => {
        loadRecentChats();
        const lastSession = localStorage.getItem('medtutor_last_session');
        if (lastSession) {
            loadSession(lastSession);
        }
    }, [loadRecentChats, loadSession]);

    return {
        messages,
        recentChats,
        currentSessionId,
        isLoading,
        isHistoryLoading,
        hasMore,
        sendMessage,
        loadSession,
        startNewChat,
        loadMoreMessages,
        loadRecentChats
    };
};
