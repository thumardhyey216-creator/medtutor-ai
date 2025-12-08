import React, { useState, useEffect } from 'react';
import FlashcardAPI from '../../services/flashcardApi';

const CreateTab = () => {
    const [decks, setDecks] = useState([]);
    const [manualForm, setManualForm] = useState({ front: '', back: '', deckId: '' });
    const [aiForm, setAiForm] = useState({ subject: 'Anatomy', topic: '', count: 5 });
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadDecks();
    }, []);

    const loadDecks = async () => {
        try {
            const data = await FlashcardAPI.getDecks();
            setDecks(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            await FlashcardAPI.createCard(manualForm.deckId, manualForm.front, manualForm.back);
            alert('Card created!');
            setManualForm({ ...manualForm, front: '', back: '' });
        } catch (err) {
            alert('Failed to create card');
        }
    };

    const handleAiSubmit = async (e) => {
        e.preventDefault();
        setIsGenerating(true);
        try {
            const res = await FlashcardAPI.generateAI(aiForm.subject, aiForm.topic, aiForm.count);
            alert(`Generated ${res.count} cards!`);
            // Optionally redirect to decks or show success
        } catch (err) {
            alert('Failed to generate cards');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div id="create-tab">
            <div className="grid-2-cols">
                <div className="card">
                    <h3 className="card-header">Manual Card Creation</h3>
                    <p className="card-subtitle">Create a flashcard manually</p>
                    <form onSubmit={handleManualSubmit}>
                        <div className="field">
                            <label>Front</label>
                            <textarea
                                className="textarea"
                                placeholder="Question or term..."
                                value={manualForm.front}
                                onChange={e => setManualForm({ ...manualForm, front: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div className="field">
                            <label>Back</label>
                            <textarea
                                className="textarea"
                                placeholder="Answer or definition..."
                                value={manualForm.back}
                                onChange={e => setManualForm({ ...manualForm, back: e.target.value })}
                                required
                            ></textarea>
                        </div>
                        <div className="field">
                            <label>Deck</label>
                            <select
                                className="select"
                                value={manualForm.deckId}
                                onChange={e => setManualForm({ ...manualForm, deckId: e.target.value })}
                                required
                            >
                                <option value="">Select a deck...</option>
                                {decks.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary">Create Card</button>
                    </form>
                </div>

                <div className="card">
                    <h3 className="card-header">AI Generation</h3>
                    <p className="card-subtitle">Generate cards from your notes using AI</p>
                    <form onSubmit={handleAiSubmit}>
                        <div className="field">
                            <label>Subject</label>
                            <select
                                className="select"
                                value={aiForm.subject}
                                onChange={e => setAiForm({ ...aiForm, subject: e.target.value })}
                            >
                                <option value="Anatomy">Anatomy</option>
                                <option value="Physiology">Physiology</option>
                                <option value="Biochemistry">Biochemistry</option>
                                <option value="Pathology">Pathology</option>
                                <option value="Pharmacology">Pharmacology</option>
                                <option value="Microbiology">Microbiology</option>
                                <option value="Forensic Medicine">Forensic Medicine</option>
                                <option value="Community Medicine">Community Medicine</option>
                                <option value="ENT">ENT</option>
                                <option value="Ophthalmology">Ophthalmology</option>
                                <option value="General Medicine">General Medicine</option>
                                <option value="General Surgery">General Surgery</option>
                                <option value="Obstetrics & Gynaecology">Obstetrics & Gynaecology</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Psychiatry">Psychiatry</option>
                                <option value="Dermatology">Dermatology</option>
                                <option value="Anesthesia">Anesthesia</option>
                                <option value="Radiology">Radiology</option>
                            </select>
                        </div>
                        <div className="field">
                            <label>Topic</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Beta Blockers"
                                value={aiForm.topic}
                                onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                                required
                            />
                        </div>
                        <div className="field">
                            <label>Number of Cards</label>
                            <input
                                type="number"
                                className="input"
                                min="1"
                                max="20"
                                value={aiForm.count}
                                onChange={e => setAiForm({ ...aiForm, count: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Generate with AI'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTab;
