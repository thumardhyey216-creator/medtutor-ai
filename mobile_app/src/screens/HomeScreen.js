import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('medtutor_user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('medtutor_token');
            await AsyncStorage.removeItem('medtutor_user');
            navigation.replace('Login');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hello,</Text>
                    <Text style={styles.name}>{user?.name || 'Student'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Tests Taken</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>0%</Text>
                    <Text style={styles.statLabel}>Avg Score</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>What would you like to do?</Text>

            <View style={styles.grid}>
                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => navigation.navigate('QBank')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
                        <Text style={styles.icon}>📝</Text>
                    </View>
                    <Text style={styles.cardTitle}>QBank</Text>
                    <Text style={styles.cardDescription}>Practice with AI-generated questions</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => navigation.navigate('Chat')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
                        <Text style={styles.icon}>💬</Text>
                    </View>
                    <Text style={styles.cardTitle}>AI Tutor</Text>
                    <Text style={styles.cardDescription}>Chat with your medical AI assistant</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.card}
                    onPress={() => navigation.navigate('Flashcards')}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                        <Text style={styles.icon}>🎴</Text>
                    </View>
                    <Text style={styles.cardTitle}>Flashcards</Text>
                    <Text style={styles.cardDescription}>Review key concepts quickly</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    greeting: {
        fontSize: 16,
        color: '#64748b',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    statLabel: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 20,
        marginTop: 10,
        marginBottom: 15,
    },
    grid: {
        padding: 20,
        gap: 15,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    icon: {
        fontSize: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#64748b',
    },
});
