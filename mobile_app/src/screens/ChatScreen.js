import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChatScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>AI Tutor Chat Coming Soon</Text>
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