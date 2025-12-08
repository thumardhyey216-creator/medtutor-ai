import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, SafeAreaView, Dimensions, StatusBar, Platform } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import qbankService from '../services/qbankService';

const { width } = Dimensions.get('window');

export default function QuizScreen({ route, navigation }) {
    const { session, questions } = route.params;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState({});
    
    // Deep Dive State
    const [deepDiveVisible, setDeepDiveVisible] = useState(false);
    const [deepDiveLoading, setDeepDiveLoading] = useState(false);
    const [deepDiveContent, setDeepDiveContent] = useState('');
    
    const scrollViewRef = useRef(null);

    const currentQuestion = questions[currentIndex];
    const currentResult = results[currentQuestion.id];
    
    // Parse options if they are strings (JSON)
    const options = typeof currentQuestion.options === 'string' 
        ? JSON.parse(currentQuestion.options) 
        : currentQuestion.options;

    // Reset scroll when question changes
    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
    }, [currentIndex]);

    const handleOptionSelect = (index) => {
        if (results[currentQuestion.id]) return; // Prevent changing after submit
        setSelectedOption(index);
    };

    const handleSubmitAnswer = async () => {
        if (selectedOption === null) return;

        setIsSubmitting(true);
        try {
            const result = await qbankService.submitAnswer({
                sessionId: session.id,
                questionId: currentQuestion.id,
                selectedOption,
                timeSpent: 0 // TODO: Implement timer
            });

            setResults({
                ...results,
                [currentQuestion.id]: {
                    selected: selectedOption,
                    isCorrect: result.isCorrect,
                    correctOption: result.correctOption,
                    explanation: result.explanation
                }
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit answer. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeepDive = async () => {
        setDeepDiveVisible(true);
        if (deepDiveContent && deepDiveContent !== '') return; // Already loaded

        setDeepDiveLoading(true);
        try {
            console.log('Requesting Deep Dive for:', {
                questionId: currentQuestion.id,
                selectedOption: currentResult.selected,
                correctOption: currentResult.correctOption,
            });

            const result = await qbankService.getDeepDive({
                questionId: currentQuestion.id,
                selectedOption: currentResult.selected,
                correctOption: currentResult.correctOption,
                stem: currentQuestion.stem,
                subject: currentQuestion.subject
            });
            
            if (result && result.content) {
                setDeepDiveContent(result.content);
            } else {
                throw new Error('No content received');
            }
        } catch (error) {
            console.error('Deep dive error:', error);
            Alert.alert('Error', 'Failed to generate deep dive. Please try again.');
            setDeepDiveVisible(false);
        } finally {
            setDeepDiveLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
            setDeepDiveContent(''); // Reset deep dive
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setIsSubmitting(true);
        try {
            const result = await qbankService.completeSession(session.id);
            navigation.replace('Result', { result, session });
        } catch (error) {
            Alert.alert('Error', 'Failed to complete quiz');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getOptionStyle = (index) => {
        const baseStyle = styles.optionCard;
        const isSelected = selectedOption === index;
        
        if (!currentResult) {
            // Not submitted yet
            return isSelected 
                ? [baseStyle, styles.optionCardSelected] 
                : baseStyle;
        }

        // Result available
        const isCorrectOption = index === parseInt(currentResult.correctOption);
        const isSelectedWrong = isSelected && !currentResult.isCorrect;

        if (isCorrectOption) return [baseStyle, styles.optionCardCorrect];
        if (isSelectedWrong) return [baseStyle, styles.optionCardWrong];
        
        return [baseStyle, styles.optionCardDisabled];
    };

    const getMarkerStyle = (index) => {
        const baseStyle = styles.optionMarker;
        const isSelected = selectedOption === index;

        if (!currentResult) {
            return isSelected 
                ? [baseStyle, styles.optionMarkerSelected] 
                : baseStyle;
        }

        const isCorrectOption = index === parseInt(currentResult.correctOption);
        const isSelectedWrong = isSelected && !currentResult.isCorrect;

        if (isCorrectOption) return [baseStyle, styles.optionMarkerCorrect];
        if (isSelectedWrong) return [baseStyle, styles.optionMarkerWrong];

        return baseStyle;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <LinearGradient
                colors={['#4f46e5', '#3730a3']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.headerContent}>
                        <View>
                            <View style={styles.subjectBadge}>
                                <Text style={styles.subjectText}>{currentQuestion.subject || 'General'}</Text>
                            </View>
                            <Text style={styles.progressText}>
                                Question {currentIndex + 1}
                                <Text style={styles.progressTotal}> / {questions.length}</Text>
                            </Text>
                        </View>
                        <View style={styles.difficultyContainer}>
                            <View style={[styles.difficultyDot, { 
                                backgroundColor: (currentQuestion.difficulty || 'Medium') === 'Hard' ? '#ef4444' : 
                                               (currentQuestion.difficulty || 'Medium') === 'Medium' ? '#eab308' : '#22c55e' 
                            }]} />
                            <Text style={styles.difficultyText}>{currentQuestion.difficulty || 'Medium'}</Text>
                        </View>
                    </View>
                    
                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View 
                                style={[
                                    styles.progressFill, 
                                    { width: `${((currentIndex + 1) / questions.length) * 100}%` }
                                ]} 
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView 
                ref={scrollViewRef}
                style={styles.content} 
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Question Stem */}
                <View style={styles.questionCard}>
                    <Text style={styles.stem}>{currentQuestion.stem}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={getOptionStyle(index)}
                            onPress={() => handleOptionSelect(index)}
                            disabled={!!currentResult}
                            activeOpacity={0.8}
                        >
                            <View style={getMarkerStyle(index)}>
                                <Text style={[
                                    styles.optionMarkerText,
                                    (selectedOption === index || (currentResult && index === parseInt(currentResult.correctOption))) && styles.optionMarkerTextActive
                                ]}>
                                    {String.fromCharCode(65 + index)}
                                </Text>
                            </View>
                            <Text style={[
                                styles.optionText,
                                (selectedOption === index && !currentResult) && styles.optionTextSelected,
                                (currentResult && index === parseInt(currentResult.correctOption)) && styles.optionTextCorrect,
                                (currentResult && selectedOption === index && !currentResult.isCorrect) && styles.optionTextWrong
                            ]}>
                                {option}
                            </Text>
                            
                            {currentResult && index === parseInt(currentResult.correctOption) && (
                                <Ionicons name="checkmark-circle" size={24} color="#16a34a" style={styles.resultIcon} />
                            )}
                            {currentResult && selectedOption === index && !currentResult.isCorrect && (
                                <Ionicons name="close-circle" size={24} color="#dc2626" style={styles.resultIcon} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Explanation & Deep Dive */}
                {currentResult && (
                    <View style={styles.explanationCard}>
                        <LinearGradient
                            colors={['#f8fafc', '#f1f5f9']}
                            style={styles.explanationGradient}
                        >
                            <View style={styles.explanationHeader}>
                                <View style={styles.bulbIconContainer}>
                                    <Ionicons name="bulb" size={20} color="#eab308" />
                                </View>
                                <Text style={styles.explanationTitle}>Explanation</Text>
                            </View>
                            
                            <Text style={styles.explanationText}>
                                {currentResult.explanation.replace(/<[^>]+>/g, '')}
                            </Text>
                            
                            <TouchableOpacity 
                                style={styles.deepDiveButton}
                                onPress={handleDeepDive}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#8b5cf6', '#6d28d9']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.deepDiveGradient}
                                >
                                    <View style={styles.sparklesContainer}>
                                        <Ionicons name="sparkles" size={18} color="#fff" />
                                    </View>
                                    <View>
                                        <Text style={styles.deepDiveText}>AI Deep Dive</Text>
                                        <Text style={styles.deepDiveSubText}>Get comprehensive analysis</Text>
                                    </View>
                                    <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.6)" style={{marginLeft: 'auto'}} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                )}
                
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={styles.footer}>
                {!currentResult ? (
                    <TouchableOpacity
                        style={[styles.actionButton, (!selectedOption && selectedOption !== 0) && styles.actionButtonDisabled]}
                        onPress={handleSubmitAnswer}
                        disabled={selectedOption === null || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.actionButtonText}>Submit Answer</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.nextButton]}
                        onPress={handleNext}
                    >
                        <Text style={styles.actionButtonText}>
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 8}} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Deep Dive Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={deepDiveVisible}
                onRequestClose={() => setDeepDiveVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <LinearGradient
                            colors={['#fff', '#f8fafc']}
                            style={styles.modalContent}
                        >
                            <View style={styles.modalHeader}>
                                <View style={styles.modalTitleRow}>
                                    <LinearGradient
                                        colors={['#8b5cf6', '#6d28d9']}
                                        style={styles.modalIconBg}
                                    >
                                        <Ionicons name="school" size={20} color="#fff" />
                                    </LinearGradient>
                                    <View>
                                        <Text style={styles.modalTitle}>Deep Dive</Text>
                                        <Text style={styles.modalSubtitle}>AI-Powered Analysis</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setDeepDiveVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color="#64748b" />
                                </TouchableOpacity>
                            </View>
                            
                            {deepDiveLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#8b5cf6" />
                                    <Text style={styles.loadingText}>Analyzing question context...</Text>
                                    <Text style={styles.loadingSubText}>Generating comprehensive explanation</Text>
                                </View>
                            ) : (
                                <ScrollView style={styles.modalScroll} contentContainerStyle={{paddingBottom: 40}}>
                                    <Markdown style={markdownStyles}>
                                        {deepDiveContent}
                                    </Markdown>
                                </ScrollView>
                            )}
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        marginTop: 10,
    },
    subjectBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    subjectText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    progressText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
    },
    progressTotal: {
        fontSize: 16,
        fontWeight: '500',
        opacity: 0.7,
    },
    difficultyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    difficultyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    difficultyText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    progressContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarBg: {
        width: '100%',
        height: '100%',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: 3,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 120,
    },
    questionCard: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    stem: {
        fontSize: 18,
        lineHeight: 28,
        color: '#0f172a',
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    optionsContainer: {
        gap: 14,
    },
    optionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    optionCardSelected: {
        borderColor: '#4f46e5',
        backgroundColor: '#eef2ff',
    },
    optionCardCorrect: {
        borderColor: '#22c55e',
        backgroundColor: '#f0fdf4',
    },
    optionCardWrong: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    optionCardDisabled: {
        opacity: 0.8,
        backgroundColor: '#f8fafc',
    },
    optionMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionMarkerSelected: {
        backgroundColor: '#4f46e5',
    },
    optionMarkerCorrect: {
        backgroundColor: '#22c55e',
    },
    optionMarkerWrong: {
        backgroundColor: '#ef4444',
    },
    optionMarkerText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748b',
    },
    optionMarkerTextActive: {
        color: '#fff',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#3730a3',
        fontWeight: '600',
    },
    optionTextCorrect: {
        color: '#15803d',
        fontWeight: '600',
    },
    optionTextWrong: {
        color: '#b91c1c',
    },
    resultIcon: {
        marginLeft: 8,
    },
    explanationCard: {
        marginTop: 32,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    explanationGradient: {
        padding: 24,
    },
    explanationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    bulbIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fef9c3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    explanationTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    explanationText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#475569',
        marginBottom: 24,
    },
    deepDiveButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    deepDiveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    sparklesContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deepDiveText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    deepDiveSubText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 20,
    },
    actionButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    nextButton: {
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    actionButtonDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0,
        elevation: 0,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    bottomSpacer: {
        height: 40,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '85%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    modalContent: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#fff',
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        lineHeight: 24,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 24,
        fontSize: 18,
        fontWeight: '600',
        color: '#334155',
    },
    loadingSubText: {
        marginTop: 8,
        fontSize: 14,
        color: '#64748b',
    },
    modalScroll: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
    },
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: 16,
        lineHeight: 28,
        color: '#334155',
    },
    heading1: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 20,
        marginTop: 10,
    },
    heading2: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 16,
        marginTop: 24,
    },
    heading3: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 12,
        marginTop: 20,
    },
    paragraph: {
        marginBottom: 20,
    },
    list_item: {
        marginBottom: 10,
    },
    strong: {
        fontWeight: '700',
        color: '#0f172a',
    },
    em: {
        fontStyle: 'italic',
        color: '#475569',
    },
    blockquote: {
        backgroundColor: '#f8fafc',
        borderLeftColor: '#8b5cf6',
        borderLeftWidth: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
    },
});
