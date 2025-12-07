import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import qbankService from '../services/qbankService';

const SUBJECTS = [
    'General Medicine', 'Anatomy', 'Physiology', 'Biochemistry', 
    'Pathology', 'Pharmacology', 'Microbiology', 'Forensic Medicine'
];

const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function QBankScreen({ navigation }) {
    const [subject, setSubject] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [numQuestions, setNumQuestions] = useState('5');
    const [loading, setLoading] = useState(false);

    const handleStartSession = async () => {
        const selectedSubject = subject === 'Other' ? customSubject : subject;
        
        if (!selectedSubject) {
            Alert.alert('Error', 'Please select or enter a subject');
            return;
        }

        setLoading(true);
        try {
            const sessionData = await qbankService.startSession({
                subject: selectedSubject,
                difficulty,
                numQuestions: parseInt(numQuestions),
                mode: 'practice',
                examType: 'neet-pg'
            });

            navigation.navigate('Quiz', { 
                session: sessionData.session,
                questions: sessionData.questions 
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to start session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Create Practice Session</Text>
                
                <Text style={styles.label}>Subject</Text>
                <View style={styles.chipContainer}>
                    {SUBJECTS.map((sub) => (
                        <TouchableOpacity
                            key={sub}
                            style={[styles.chip, subject === sub && styles.chipSelected]}
                            onPress={() => setSubject(sub)}
                        >
                            <Text style={[styles.chipText, subject === sub && styles.chipTextSelected]}>
                                {sub}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={[styles.chip, subject === 'Other' && styles.chipSelected]}
                        onPress={() => setSubject('Other')}
                    >
                        <Text style={[styles.chipText, subject === 'Other' && styles.chipTextSelected]}>
                            Other
                        </Text>
                    </TouchableOpacity>
                </View>

                {subject === 'Other' && (
                    <TextInput
                        style={styles.input}
                        placeholder="Enter custom subject..."
                        value={customSubject}
                        onChangeText={setCustomSubject}
                    />
                )}

                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.segmentContainer}>
                    {DIFFICULTIES.map((diff) => (
                        <TouchableOpacity
                            key={diff}
                            style={[styles.segment, difficulty === diff && styles.segmentSelected]}
                            onPress={() => setDifficulty(diff)}
                        >
                            <Text style={[styles.segmentText, difficulty === diff && styles.segmentTextSelected]}>
                                {diff.charAt(0).toUpperCase() + diff.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Number of Questions</Text>
                <TextInput
                    style={styles.input}
                    value={numQuestions}
                    onChangeText={setNumQuestions}
                    keyboardType="numeric"
                    maxLength={2}
                />

                <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStartSession}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.startButtonText}>Start Quiz</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 10,
        marginTop: 10,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
    },
    chip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#e2e8f0',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    chipSelected: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    chipText: {
        color: '#64748b',
        fontSize: 14,
    },
    chipTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        fontSize: 16,
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 10,
        padding: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentSelected: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    segmentText: {
        color: '#64748b',
        fontWeight: '500',
    },
    segmentTextSelected: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    startButton: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
