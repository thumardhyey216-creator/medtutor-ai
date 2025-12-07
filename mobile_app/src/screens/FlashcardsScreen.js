import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FlashcardsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Flashcards Feature Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    text: {
        fontSize: 18,
        color: '#64748b',
    },
});
