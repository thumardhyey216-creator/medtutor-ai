import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import qbankService from '../services/qbankService';

export default function QuizScreen({ route, navigation }) {
    const { session, questions } = route.params;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [results, setResults] = useState({}); // Store results for each question
    const [completed, setCompleted] = useState(false);
    
    const currentQuestion = questions[currentIndex];
    
    // Parse options if they are strings
    const options = typeof currentQuestion.options === 'string' 
        ? JSON.parse(currentQuestion.options) 
        : currentQuestion.options;

    const handleOptionSelect = (index) => {
        if (results[currentQuestion.id]) return; // Already answered
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
                timeSpent: 0 // TODO: Track time
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
            Alert.alert('Error', 'Failed to submit answer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedOption(null);
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

    const currentResult = results[currentQuestion.id];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.progress}>Question {currentIndex + 1} of {questions.length}</Text>
                <Text style={styles.difficulty}>{currentQuestion.difficulty}</Text>
            </View>

            <View style={styles.questionContainer}>
                <Text style={styles.stem}>{currentQuestion.stem}</Text>
            </View>

            <View style={styles.optionsContainer}>
                {options.map((option, index) => {
                    let optionStyle = styles.option;
                    let textStyle = styles.optionText;

                    if (selectedOption === index) {
                        optionStyle = [styles.option, styles.optionSelected];
                        textStyle = [styles.optionText, styles.optionTextSelected];
                    }

                    if (currentResult) {
                        if (index === parseInt(currentResult.correctOption)) {
                            optionStyle = [styles.option, styles.optionCorrect];
                            textStyle = [styles.optionText, styles.optionTextCorrect];
                        } else if (index === currentResult.selected && !currentResult.isCorrect) {
                            optionStyle = [styles.option, styles.optionWrong];
                            textStyle = [styles.optionText, styles.optionTextWrong];
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            style={optionStyle}
                            onPress={() => handleOptionSelect(index)}
                            disabled={!!currentResult}
                        >
                            <View style={styles.optionMarker}>
                                <Text style={styles.optionMarkerText}>{String.fromCharCode(65 + index)}</Text>
                            </View>
                            <Text style={textStyle}>{option}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {currentResult && (
                <View style={styles.explanationContainer}>
                    <Text style={styles.explanationTitle}>Explanation</Text>
                    <Text style={styles.explanationText}>{currentResult.explanation}</Text>
                </View>
            )}

            <View style={styles.footer}>
                {!currentResult ? (
                    <TouchableOpacity
                        style={[styles.button, !selectedOption && selectedOption !== 0 && styles.buttonDisabled]}
                        onPress={handleSubmitAnswer}
                        disabled={selectedOption === null || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Submit Answer</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleNext}
                    >
                        <Text style={styles.buttonText}>
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    progress: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
    },
    difficulty: {
        fontSize: 14,
        color: '#f59e0b',
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    questionContainer: {
        padding: 20,
        backgroundColor: '#fff',
    },
    stem: {
        fontSize: 18,
        color: '#1e293b',
        lineHeight: 28,
    },
    optionsContainer: {
        padding: 20,
        gap: 15,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    optionSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    optionCorrect: {
        borderColor: '#16a34a',
        backgroundColor: '#dcfce7',
    },
    optionWrong: {
        borderColor: '#ef4444',
        backgroundColor: '#fee2e2',
    },
    optionMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionMarkerText: {
        fontWeight: 'bold',
        color: '#64748b',
    },
    optionText: {
        flex: 1,
        fontSize: 16,
        color: '#334155',
    },
    optionTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
    optionTextCorrect: {
        color: '#166534',
        fontWeight: '600',
    },
    optionTextWrong: {
        color: '#991b1b',
        fontWeight: '600',
    },
    explanationContainer: {
        margin: 20,
        padding: 15,
        backgroundColor: '#f0f9ff',
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#0ea5e9',
    },
    explanationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0369a1',
        marginBottom: 5,
    },
    explanationText: {
        color: '#334155',
        lineHeight: 24,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#94a3b8',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
