import { useState, useRef, useEffect, useCallback } from 'react';
import QBankAPI from '../services/qbankApi';
import { useNavigate } from 'react-router-dom';

const useQBank = () => {
    // Session State
    const [status, setStatus] = useState('dashboard'); // dashboard, test, results
    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { [questionId]: { selected: number, timeSpent: number, isSubmitted: bool, isCorrect: bool, explanation: string, isFlagged: bool } }
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Timer State
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    const startTest = async (config) => {
        setLoading(true);
        setError(null);
        try {
            const data = await QBankAPI.startSession(
                config.mode,
                config.numQuestions,
                config.timed,
                config.filters
            );

            setSession(data.session);
            setQuestions(data.questions || []);
            setAnswers({});
            setCurrentQuestionIndex(0);
            setStatus('test');

            // Start Timer
            setElapsedTime(0);
            startTimeRef.current = Date.now();
            startTimer();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start test');
        } finally {
            setLoading(false);
        }
    };

    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            if (startTimeRef.current) {
                setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const selectOption = (questionId, optionIndex) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                selected: optionIndex,
                timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000) // Rough estimate
            }
        }));
    };

    const checkAnswer = async (questionId) => {
        const answer = answers[questionId];
        if (!answer || answer.selected === undefined) return;

        try {
            const data = await QBankAPI.submitAnswer(
                session.id,
                questionId,
                answer.selected,
                answer.timeSpent || 0
            );

            setAnswers(prev => ({
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    isSubmitted: true,
                    isCorrect: data.isCorrect,
                    correctOption: data.correctOption,
                    explanation: data.explanation
                }
            }));

            return data;
        } catch (err) {
            console.error('Failed to submit answer', err);
            // Optionally set error state
        }
    };

    const toggleFlag = (questionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                isFlagged: !prev[questionId]?.isFlagged
            }
        }));
    };

    const submitTest = async () => {
        stopTimer();
        setLoading(true);
        try {
            // Auto submit unsubmitted answers for Exam Mode logic if needed
            // For now assuming backend handles "complete" calculates score based on submitted or we submit all

            // Logic from legacy: submit pending answers
            const pending = questions.filter(q => {
                const ans = answers[q.id];
                return ans && ans.selected !== undefined && !ans.isSubmitted;
            });

            await Promise.all(pending.map(q => {
                const ans = answers[q.id];
                return QBankAPI.submitAnswer(session.id, q.id, ans.selected, ans.timeSpent || 0);
            }));

            const data = await QBankAPI.completeSession(session.id);
            setResults(data);
            setStatus('results');
        } catch (err) {
            console.error(err);
            setError('Failed to submit test');
        } finally {
            setLoading(false);
        }
    };

    const navigateQuestion = (index) => {
        if (index >= 0 && index < questions.length) {
            setCurrentQuestionIndex(index);
        }
    };

    const reset = () => {
        setStatus('dashboard');
        setSession(null);
        setQuestions([]);
        setAnswers({});
        setResults(null);
        setError(null);
        stopTimer();
    };

    const checkActiveSession = useCallback(async () => {
        try {
            setLoading(true);
            const data = await QBankAPI.getActiveSession();
            
            if (data && data.session) {
                setSession(data.session);
                setQuestions(data.questions || []);
                setAnswers(data.answers || {});
                setElapsedTime(data.elapsedTime || 0);
                
                // Find first unanswered question
                const firstUnanswered = (data.questions || []).findIndex(q => !data.answers[q.id]);
                setCurrentQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
                
                setStatus('test');
                startTimeRef.current = Date.now() - ((data.elapsedTime || 0) * 1000);
                startTimer();
            }
        } catch (err) {
            console.error('Failed to restore session:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkActiveSession();
        return () => stopTimer();
    }, [checkActiveSession]);

    return {
        status,
        session,
        questions,
        currentQuestionIndex,
        currentQuestion: questions[currentQuestionIndex],
        answers,
        results,
        loading,
        error,
        elapsedTime,
        startTest,
        selectOption,
        checkAnswer,
        toggleFlag,
        submitTest,
        navigateQuestion,
        reset
    };
};

export default useQBank;
