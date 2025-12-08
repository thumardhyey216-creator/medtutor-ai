import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import flashcardService from '../services/flashcardService';

const { width } = Dimensions.get('window');

export default function FlashcardsScreen() {
    const [viewMode, setViewMode] = useState('library'); // 'library' or 'study'
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDeck, setSelectedDeck] = useState(null);
    
    // Study Mode State
    const [studyCards, setStudyCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });

    useEffect(() => {
        if (viewMode === 'library') {
            loadDecks();
        }
    }, [viewMode]);

    const loadDecks = async () => {
        setLoading(true);
        try {
            const data = await flashcardService.getDecks();
            setDecks(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load decks');
        } finally {
            setLoading(false);
        }
    };

    const startStudy = async (deck = null) => {
        setLoading(true);
        try {
            // Get due cards or new cards
            const cards = await flashcardService.getNextCards(20, deck?.id);
            if (cards && cards.length > 0) {
                setStudyCards(cards);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setSessionStats({ reviewed: 0, correct: 0 });
                setSelectedDeck(deck);
                setViewMode('study');
            } else {
                Alert.alert('All Caught Up!', 'No cards due for review in this deck.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load cards');
        } finally {
            setLoading(false);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleRate = async (quality) => {
        const currentCard = studyCards[currentCardIndex];
        
        try {
            // quality: 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
            await flashcardService.submitReview(currentCard.id, quality);
            
            setSessionStats(prev => ({
                reviewed: prev.reviewed + 1,
                correct: quality >= 3 ? prev.correct + 1 : prev.correct
            }));

            if (currentCardIndex < studyCards.length - 1) {
                setCurrentCardIndex(prev => prev + 1);
                setIsFlipped(false);
            } else {
                Alert.alert(
                    'Session Complete!',
                    `You reviewed ${studyCards.length} cards.`,
                    [{ text: 'Back to Library', onPress: () => setViewMode('library') }]
                );
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save progress');
        }
    };

    const renderLibrary = () => (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.header}>
                <Text style={styles.title}>Flashcard Library</Text>
                <Text style={styles.subtitle}>Select a deck to start studying</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
            ) : (
                <View style={styles.grid}>
                    {/* Quick Start Card */}
                    <TouchableOpacity 
                        style={styles.deckCard} 
                        onPress={() => startStudy(null)}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#4f46e5', '#3b82f6']}
                            style={styles.deckCardGradient}
                        >
                            <View style={styles.deckIconBg}>
                                <Ionicons name="play" size={24} color="#4f46e5" />
                            </View>
                            <View>
                                <Text style={[styles.deckTitle, { color: '#fff' }]}>Study All Due</Text>
                                <Text style={[styles.deckSubtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                                    Mix of all subjects
                                </Text>
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {decks.map((deck) => (
                        <TouchableOpacity 
                            key={deck.id} 
                            style={styles.deckCard}
                            onPress={() => startStudy(deck)}
                        >
                            <View style={styles.deckCardContent}>
                                <View style={[styles.deckIconContainer, { backgroundColor: '#f0fdf4' }]}>
                                    <Ionicons name="albums-outline" size={24} color="#16a34a" />
                                </View>
                                <View style={styles.deckInfo}>
                                    <Text style={styles.deckTitle}>{deck.name}</Text>
                                    <Text style={styles.deckSubtitle}>{deck.count || 0} cards • {deck.subject}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                            </View>
                        </TouchableOpacity>
                    ))}
                    
                    {decks.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No decks found.</Text>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );

    const renderStudy = () => {
        const currentCard = studyCards[currentCardIndex];
        
        return (
            <View style={styles.container}>
                <View style={styles.studyHeader}>
                    <TouchableOpacity onPress={() => setViewMode('library')} style={styles.backButton}>
                        <Ionicons name="close" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressFill, 
                                { width: `${((currentCardIndex + 1) / studyCards.length) * 100}%` }
                            ]} 
                        />
                    </View>
                    <Text style={styles.progressText}>{currentCardIndex + 1}/{studyCards.length}</Text>
                </View>

                <View style={styles.cardContainer}>
                    <TouchableOpacity 
                        style={styles.flashcard} 
                        activeOpacity={1} 
                        onPress={handleFlip}
                    >
                        <View style={styles.cardContent}>
                            <Text style={styles.cardLabel}>{isFlipped ? 'ANSWER' : 'QUESTION'}</Text>
                            <ScrollView contentContainerStyle={styles.cardScroll}>
                                <Text style={styles.cardText}>
                                    {isFlipped ? currentCard.back : currentCard.front}
                                </Text>
                            </ScrollView>
                            <Text style={styles.flipHint}>Tap to flip</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {isFlipped ? (
                    <View style={styles.controlsContainer}>
                        <Text style={styles.rateLabel}>How well did you know this?</Text>
                        <View style={styles.ratingButtons}>
                            <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#fee2e2' }]} onPress={() => handleRate(1)}>
                                <Text style={[styles.rateBtnText, { color: '#dc2626' }]}>Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#ffedd5' }]} onPress={() => handleRate(2)}>
                                <Text style={[styles.rateBtnText, { color: '#ea580c' }]}>Hard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#dbeafe' }]} onPress={() => handleRate(3)}>
                                <Text style={[styles.rateBtnText, { color: '#2563eb' }]}>Good</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.rateBtn, { backgroundColor: '#dcfce7' }]} onPress={() => handleRate(4)}>
                                <Text style={[styles.rateBtnText, { color: '#16a34a' }]}>Easy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.controlsContainer}>
                        <TouchableOpacity style={styles.flipButton} onPress={handleFlip}>
                            <Text style={styles.flipButtonText}>Show Answer</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.mainContainer}>
            {viewMode === 'library' ? renderLibrary() : renderStudy()}
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    grid: {
        padding: 20,
    },
    deckCard: {
        marginBottom: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    deckCardGradient: {
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    deckCardContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    deckIconBg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    deckIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    deckInfo: {
        flex: 1,
    },
    deckTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 2,
    },
    deckSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 16,
    },
    // Study Mode Styles
    studyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        marginRight: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4f46e5',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
    },
    cardContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    flashcard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 20,
    },
    cardContent: {
        flex: 1,
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
    },
    cardScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardText: {
        fontSize: 22,
        color: '#1e293b',
        textAlign: 'center',
        lineHeight: 32,
    },
    flipHint: {
        marginTop: 20,
        fontSize: 12,
        color: '#cbd5e1',
    },
    controlsContainer: {
        padding: 20,
        paddingBottom: 40,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    flipButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    flipButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rateLabel: {
        textAlign: 'center',
        color: '#64748b',
        marginBottom: 16,
        fontSize: 14,
    },
    ratingButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    rateBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    rateBtnText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
});
