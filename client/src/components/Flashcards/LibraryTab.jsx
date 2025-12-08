import React, { useState, useEffect } from 'react';
import FlashcardAPI from '../../services/flashcardApi';

const LibraryTab = () => {
    const [cards, setCards] = useState([]);
    const [decks, setDecks] = useState([]);
    const [filters, setFilters] = useState({ subject: '', deck: '' });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [filters.subject]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cardsData, decksData] = await Promise.all([
                FlashcardAPI.getCards(filters.subject),
                FlashcardAPI.getDecks()
            ]);
            setCards(cardsData || []);
            setDecks(decksData || []);
        } catch (err) {
            console.error("Failed to load library data:", err);
            // Ideally show a toast or error message here
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this card?')) return;
        try {
            await FlashcardAPI.deleteCard(id);
            setCards(cards.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete card.');
        }
    };

    const filteredCards = cards.filter(card => {
        const term = search.toLowerCase();
        const matchSearch = (
            (card.front && card.front.toLowerCase().includes(term)) || 
            (card.back && card.back.toLowerCase().includes(term))
        );
        const matchDeck = filters.deck ? String(card.deckId) === String(filters.deck) : true;
        return matchSearch && matchDeck;
    });

    return (
        <div id="library-tab">
            <div className="card">
                <div className="flex justify-between items-center mb-md flex-wrap gap-md">
                    <div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
                        <span className="search-icon">🔍</span>
                        <input
                            type="search"
                            placeholder="Search cards by front or back..."
                            className="input"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                        />
                    </div>
                    
                    <div className="flex gap-sm flex-wrap">
                        <select
                            className="select"
                            value={filters.subject}
                            onChange={e => setFilters({ ...filters, subject: e.target.value })}
                        >
                            <option value="">All Subjects</option>
                            <option value="anatomy">Anatomy</option>
                            <option value="physiology">Physiology</option>
                            <option value="pathology">Pathology</option>
                            <option value="pharmacology">Pharmacology</option>
                            <option value="microbiology">Microbiology</option>
                        </select>
                        <select
                            className="select"
                            value={filters.deck}
                            onChange={e => setFilters({ ...filters, deck: e.target.value })}
                        >
                            <option value="">All Decks</option>
                            {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>

                <div id="cards-table" style={{ overflowX: 'auto' }}>
                    <table className="w-full text-left" style={{ borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr className="bg-subtle text-muted">
                                <th className="p-md text-sm font-semibold border-b border-subtle first:rounded-tl-lg">Front</th>
                                <th className="p-md text-sm font-semibold border-b border-subtle">Back</th>
                                <th className="p-md text-sm font-semibold border-b border-subtle">Deck</th>
                                <th className="p-md text-sm font-semibold border-b border-subtle text-right last:rounded-tr-lg">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="text-center p-xl">
                                        <div className="flex justify-center items-center gap-sm text-muted">
                                            <span className="spinner"></span> Loading cards...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCards.length > 0 ? (
                                filteredCards.map(card => (
                                    <tr key={card.id} className="hover:bg-hover transition-colors">
                                        <td className="p-md text-sm border-b border-subtle">
                                            <div className="truncate font-medium" style={{ maxWidth: '250px' }} title={card.front}>
                                                {card.front}
                                            </div>
                                        </td>
                                        <td className="p-md text-sm border-b border-subtle">
                                            <div className="truncate text-secondary" style={{ maxWidth: '250px' }} title={card.back}>
                                                {card.back}
                                            </div>
                                        </td>
                                        <td className="p-md text-sm border-b border-subtle text-muted">
                                            <span className="tag tag-outline">{card.deckName || 'General'}</span>
                                        </td>
                                        <td className="p-md text-right border-b border-subtle">
                                            <button 
                                                className="btn-icon text-error hover:bg-error-subtle rounded p-xs" 
                                                onClick={() => handleDelete(card.id)}
                                                title="Delete Card"
                                            >
                                                🗑
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center p-xl text-muted">
                                        <div className="flex flex-col items-center gap-sm">
                                            <span style={{ fontSize: '2rem' }}>📭</span>
                                            <p>No cards found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {!loading && filteredCards.length > 0 && (
                    <div className="p-md text-xs text-muted text-center border-t border-subtle">
                        Showing {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryTab;
