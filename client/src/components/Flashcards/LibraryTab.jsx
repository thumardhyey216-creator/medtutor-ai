import React, { useState, useEffect } from 'react';
import FlashcardAPI from '../../services/flashcardApi';

const LibraryTab = () => {
    const [cards, setCards] = useState([]);
    const [decks, setDecks] = useState([]);
    const [filters, setFilters] = useState({ subject: '', deck: '' });
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, [filters.subject]); // Reload when subject changes (backend filter usually)

    const loadData = async () => {
        try {
            const [cardsData, decksData] = await Promise.all([
                FlashcardAPI.getCards(filters.subject),
                FlashcardAPI.getDecks()
            ]);
            setCards(cardsData);
            setDecks(decksData);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await FlashcardAPI.deleteCard(id);
            setCards(cards.filter(c => c.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete');
        }
    };

    // Client-side filtering for Search and Deck (backend only supports subject mostly per legacy code analysis, or we can add more)
    const filteredCards = cards.filter(card => {
        const matchSearch = (card.front?.toLowerCase().includes(search.toLowerCase()) || card.back?.toLowerCase().includes(search.toLowerCase()));
        const matchDeck = filters.deck ? String(card.deckId) === String(filters.deck) : true;
        return matchSearch && matchDeck;
    });

    return (
        <div id="library-tab">
            <div className="card">
                <div className="flex justify-between items-center mb-md flex-wrap gap-md">
                    <input
                        type="search"
                        placeholder="Search cards..."
                        className="input search-input-wrapper"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <div className="flex gap-sm">
                        <select
                            className="select"
                            value={filters.subject}
                            onChange={e => setFilters({ ...filters, subject: e.target.value })}
                        >
                            <option value="">All Subjects</option>
                            <option value="anatomy">Anatomy</option>
                            <option value="physiology">Physiology</option>
                            {/* Add other subjects as needed */}
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

                <div id="cards-table">
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr className="border-b border-subtle">
                                <th className="p-sm text-sm text-muted">Front</th>
                                <th className="p-sm text-sm text-muted">Back</th>
                                <th className="p-sm text-sm text-muted">Deck</th>
                                <th className="p-sm text-sm text-muted text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCards.map(card => (
                                <tr key={card.id} className="border-b border-subtle hover:bg-hover">
                                    <td className="p-sm text-sm">
                                        <div className="truncate" style={{ maxWidth: '200px' }}>{card.front}</div>
                                    </td>
                                    <td className="p-sm text-sm">
                                        <div className="truncate" style={{ maxWidth: '200px' }}>{card.back}</div>
                                    </td>
                                    <td className="p-sm text-sm text-muted">{card.deckName || 'Unknown'}</td>
                                    <td className="p-sm text-right">
                                        <button className="btn-icon text-error" onClick={() => handleDelete(card.id)}>🗑</button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCards.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center p-lg text-muted">No cards found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LibraryTab;
