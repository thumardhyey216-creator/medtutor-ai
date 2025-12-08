import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    RefreshControl, 
    SafeAreaView, 
    StatusBar, 
    Dimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import flashcardService from '../services/flashcardService';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
    const [stats, setStats] = useState({
        totalCards: 0,
        mastered: 0,
        learning: 0,
        streak: 0
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = async () => {
        // Only set loading on initial load, not refresh
        if (!refreshing && stats.totalCards === 0) setLoading(true);
        
        const data = await flashcardService.getStats();
        if (data) {
            setStats(prev => ({ ...prev, ...data }));
        }
        setLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    const StatCard = ({ title, value, icon, color }) => (
        <View style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </View>
    );

    const masteryPercentage = stats.totalCards > 0 
        ? Math.round((stats.mastered / stats.totalCards) * 100) 
        : 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#4F46E5', '#06B6D4']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Your Progress</Text>
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
                }
            >
                <View style={styles.streakContainer}>
                    <LinearGradient
                        colors={['#FF6B6B', '#FF8E53']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.streakCard}
                    >
                        <View style={styles.streakContent}>
                            <Ionicons name="flame" size={32} color="white" />
                            <View style={styles.streakTextContainer}>
                                <Text style={styles.streakValue}>{stats.streak || 0} Days</Text>
                                <Text style={styles.streakLabel}>Current Streak</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.grid}>
                    <StatCard 
                        title="Total Cards" 
                        value={stats.totalCards || 0} 
                        icon="albums" 
                        color="#4F46E5" 
                    />
                    <StatCard 
                        title="Mastered" 
                        value={stats.mastered || 0} 
                        icon="checkmark-circle" 
                        color="#10B981" 
                    />
                    <StatCard 
                        title="Learning" 
                        value={stats.learning || 0} 
                        icon="school" 
                        color="#F59E0B" 
                    />
                    <StatCard 
                        title="Accuracy" 
                        value="N/A" 
                        icon="stats-chart" 
                        color="#06B6D4" 
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mastery Progress</Text>
                    <View style={styles.progressBarBg}>
                        <LinearGradient
                            colors={['#10B981', '#34D399']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${masteryPercentage}%` }]}
                        />
                    </View>
                    <Text style={styles.progressText}>{masteryPercentage}% of your cards mastered</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
        paddingBottom: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
    },
    streakContainer: {
        marginBottom: 20,
    },
    streakCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    streakContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakTextContainer: {
        marginLeft: 16,
    },
    streakValue: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    streakLabel: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: (width - 48) / 2, // (width - padding*2 - gap) / 2
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statTitle: {
        fontSize: 12,
        color: '#64748b',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    progressBarBg: {
        height: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 6,
    },
    progressText: {
        color: '#64748b',
        fontSize: 14,
        textAlign: 'right',
    },
});
