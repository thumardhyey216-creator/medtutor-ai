import React, { useState, useEffect } from 'react';
import FlashcardAPI from '../../services/flashcardApi';

const DecksTab = ({ onStartReview, onManageDeck }) => {
    const [decks, setDecks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadDecks();
    }, []);

    const loadDecks = async () => {
        setIsLoading(true);
        try {
            const data = await FlashcardAPI.getDecks();
            setDecks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-4 text-center">Loading decks...</div>;

    return (
        <div id="decks-tab">
            <div className="quick-actions" id="decks-grid">
                <div className="action-card" onClick={() => onManageDeck('create')}>
                    <div className="action-icon">＋</div>
                    <h3 className="action-title">New Deck</h3>
                    <p className="action-desc">Create a new collection</p>
                </div>

                {decks.map(deck => (
                    <div key={deck.id} className="card deck-card">
                        <div className="flex justify-between items-start mb-sm">
                            <h3 className="font-bold text-lg">{deck.name}</h3>
                            <div className="dropdown">
                                <button className="btn-icon" onClick={() => onManageDeck('options', deck)}>⋮</button>
                            </div>
                        </div>
                        <p className="text-sm text-muted mb-md uppercase tracking-wide">{deck.subject || 'General'}</p>
                        <div className="flex justify-between items-center mt-auto">
                            <span className="text-sm font-medium">{deck.cardCount || 0} cards</span>
                            <button className="btn btn-sm btn-secondary" onClick={() => onStartReview(deck.id)}>Study</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DecksTab;
