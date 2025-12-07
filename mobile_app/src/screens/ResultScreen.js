import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';

export default function ResultScreen({ route, navigation }) {
    const { result } = route.params;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreTitle}>Quiz Completed!</Text>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreText}>{result.score}%</Text>
                    </View>
                    <Text style={styles.scoreSubtitle}>Your Score</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{result.correct}</Text>
                        <Text style={styles.statLabel}>Correct</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{result.incorrect}</Text>
                        <Text style={styles.statLabel}>Incorrect</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{Math.round(result.timeTaken / 60)}m</Text>
                        <Text style={styles.statLabel}>Time</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
                >
                    <Text style={styles.buttonText}>Back to Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'QBank' })}
                >
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Start New Quiz</Text>
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
        alignItems: 'center',
    },
    scoreCard: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 8,
        borderColor: '#2563eb',
        marginBottom: 15,
    },
    scoreText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    scoreSubtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    statsGrid: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 5,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statLabel: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 5,
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#2563eb',
    },
    secondaryButtonText: {
        color: '#2563eb',
    },
});
