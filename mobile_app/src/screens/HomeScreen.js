import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl, Dimensions, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import flashcardService from '../services/flashcardService';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ streak: 0, totalCards: 0 });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await AsyncStorage.getItem('medtutor_user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
            const statsData = await flashcardService.getStats();
            setStats(statsData);
        } catch (error) {
            console.error(error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
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

    const ActionCard = ({ title, subtitle, icon, color, gradientColors, onPress }) => (
        <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.9}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCardGradient}
            >
                <View style={styles.actionCardContent}>
                    <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name={icon} size={28} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.actionTitle}>{title}</Text>
                        <Text style={styles.actionSubtitle}>{subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#4f46e5', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.name}>{user?.name || 'Student'}</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Quick Stats in Header */}
                <View style={styles.headerStats}>
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>🔥 {stats.streak || 0}</Text>
                        <Text style={styles.headerStatLabel}>Day Streak</Text>
                    </View>
                    <View style={styles.headerStatDivider} />
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>{stats.totalCards || 0}</Text>
                        <Text style={styles.headerStatLabel}>Cards Learned</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Start Learning</Text>
                    
                    <ActionCard 
                        title="Question Bank" 
                        subtitle="Practice with AI-generated questions"
                        icon="document-text"
                        gradientColors={['#2563eb', '#3b82f6']}
                        onPress={() => navigation.navigate('QBank')}
                    />

                    <ActionCard 
                        title="Flashcards" 
                        subtitle="Master concepts with spaced repetition"
                        icon="albums"
                        gradientColors={['#059669', '#10b981']}
                        onPress={() => navigation.navigate('Flashcards')}
                    />

                    <ActionCard 
                        title="AI Tutor" 
                        subtitle="Chat with your personal medical tutor"
                        icon="chatbubbles"
                        gradientColors={['#7c3aed', '#8b5cf6']}
                        onPress={() => navigation.navigate('Chat')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance</Text>
                    <TouchableOpacity 
                        style={styles.statsCard}
                        onPress={() => navigation.navigate('Stats')}
                    >
                        <View style={styles.statsRow}>
                            <View style={styles.statsInfo}>
                                <Text style={styles.statsTitle}>Weekly Progress</Text>
                                <Text style={styles.statsSubtitle}>View your learning analytics</Text>
                            </View>
                            <Ionicons name="bar-chart" size={24} color="#64748b" />
                        </View>
                        {/* Placeholder for a mini-chart or progress bar */}
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: '65%' }]} />
                        </View>
                        <Text style={styles.progressText}>65% of weekly goal</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    greeting: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 15,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    headerStatItem: {
        alignItems: 'center',
    },
    headerStatValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    headerStatLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    headerStatDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    content: {
        flex: 1,
        padding: 20,
        marginTop: -10,
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 15,
    },
    actionCard: {
        marginBottom: 15,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    actionCardGradient: {
        borderRadius: 20,
        padding: 20,
    },
    actionCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
    },
    statsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statsSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4f46e5',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'right',
    },
});
