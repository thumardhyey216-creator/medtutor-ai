import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Pagination } from 'swiper/modules';
import ReactMarkdown from 'react-markdown';
import FlashcardAPI from '../../services/flashcardApi';

import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';

const PracticeTab = () => {
    const [stats, setStats] = useState({ dueToday: 0, reviewedToday: 0, accuracy: 0 });
    const [isReviewing, setIsReviewing] = useState(false);
    const [cards, setCards] = useState([]);
    const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
    const swiperRef = useRef(null);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await FlashcardAPI.getDueCards();
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const startReview = async () => {
        try {
            const nextCards = await FlashcardAPI.getNextCards(20);
            if (nextCards.length > 0) {
                setCards(nextCards);
                setIsReviewing(true);
                setIsFinished(false);
                setSessionStats({ reviewed: 0, correct: 0 });
            } else {
                alert('No cards due for review!');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to start review');
        }
    };

    const handleRating = async (cardId, quality) => {
        try {
            await FlashcardAPI.submitReview(cardId, quality);
            setSessionStats(prev => ({
                reviewed: prev.reviewed + 1,
                correct: quality >= 3 ? prev.correct + 1 : prev.correct
            }));

            if (swiperRef.current && swiperRef.current.swiper) {
                if (swiperRef.current.swiper.isEnd) {
                    finishSession();
                } else {
                    swiperRef.current.swiper.slideNext();
                }
            }
        } catch (err) {
            console.error('Rating failed', err);
        }
    };

    const finishSession = () => {
        setIsReviewing(false);
        setIsFinished(true);
        loadStats(); // Refresh stats
    };

    if (isFinished) {
        return (
            <div className="card empty-state-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
                <h3 className="mb-md">Session Complete! 🎉</h3>
                <p className="text-muted mb-lg">
                    You reviewed <span className="text-accent">{sessionStats.reviewed}</span> cards.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary btn-lg" onClick={() => setIsFinished(false)}>Back to Dashboard</button>
                    <button className="btn btn-primary btn-lg" onClick={startReview}>Review More</button>
                </div>
            </div>
        );
    }

    if (isReviewing) {
        return (
            <div id="flashcard-viewport" style={{ maxWidth: '600px', margin: '0 auto', height: '500px' }}>
                <Swiper
                    ref={swiperRef}
                    effect={'cards'}
                    grabCursor={true}
                    modules={[EffectCards, Pagination]}
                    className="flashcard-swiper"
                    allowTouchMove={false}
                    pagination={{ type: 'progressbar' }}
                >
                    {cards.map((card, index) => (
                        <SwiperSlide key={card.id}>
                            <FlashcardItem card={card} onRate={handleRating} />
                        </SwiperSlide>
                    ))}
                </Swiper>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setIsReviewing(false)}>Exit Review</button>
                </div>
            </div>
        );
    }

    return (
        <div id="practice-tab">
            <div className="kpi-grid grid-3-cols">
                <div className="kpi-card">
                    <span className="kpi-label">Due Today</span>
                    <span className="kpi-value">{stats.dueToday}</span>
                    <span className="kpi-change">Cards to review</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Reviewed Today</span>
                    <span className="kpi-value">{stats.reviewedToday}</span>
                    <span className="kpi-change">Keep going!</span>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Accuracy</span>
                    <span className="kpi-value">{stats.accuracy}%</span>
                    <span className="kpi-change">Good / Easy rate</span>
                </div>
            </div>

            <div id="practice-container">
                <div className="card empty-state-card">
                    <h3 className="mb-md">Ready to review?</h3>
                    <p className="text-muted mb-lg">
                        You have <span className="text-accent">{stats.dueToday}</span> cards due for review today
                    </p>
                    <button onClick={startReview} className="btn btn-primary btn-lg">Start Review Session</button>
                </div>
            </div>
        </div>
    );
};

const FlashcardItem = ({ card, onRate }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <div
            className={`flashcard-container ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
        >
            <div className="flashcard-inner">
                <div className="flashcard-front">
                    <div className="flashcard-content markdown-body">
                        <ReactMarkdown>{card.front}</ReactMarkdown>
                    </div>
                    <div className="flashcard-hint">Tap to flip</div>
                </div>
                <div className="flashcard-back">
                    <div className="flashcard-content markdown-body">
                        <ReactMarkdown>{card.back}</ReactMarkdown>
                    </div>
                    <div className="flashcard-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="rating-label">How well did you know this?</div>
                        <div className="rating-buttons">
                            <button className="btn btn-danger rate-btn" onClick={() => onRate(card.id, 1)}>Again</button>
                            <button className="btn btn-secondary rate-btn" onClick={() => onRate(card.id, 2)}>Hard</button>
                            <button className="btn btn-primary rate-btn" onClick={() => onRate(card.id, 3)}>Good</button>
                            <button className="btn btn-success rate-btn" onClick={() => onRate(card.id, 4)}>Easy</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticeTab;
