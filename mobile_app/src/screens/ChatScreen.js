import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import chatService from '../services/chatService';

export default function ChatScreen() {
    const [messages, setMessages] = useState([
        {
            id: '1',
            text: "Hello! I'm Dr. Stark, your AI Medical Tutor. Ask me anything about your medical studies!",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [generalMode, setGeneralMode] = useState(false);
    const flatListRef = useRef(null);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMsgText = inputText.trim();
        const userMessage = {
            id: Date.now().toString(),
            text: userMsgText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setLoading(true);

        try {
            // Scroll to bottom immediately
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

            const response = await chatService.sendMessage(userMsgText, null, { mode: generalMode ? 'general' : 'normal' });
            
            const aiMessage = {
                id: (Date.now() + 1).toString(),
                text: response.message || "I'm sorry, I didn't get a response.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting to the server. Please check your connection.",
                sender: 'ai',
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.aiMessageContainer
            ]}>
                {!isUser && (
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={['#4F46E5', '#06B6D4']}
                            style={styles.avatar}
                        >
                            <Ionicons name="medical" size={16} color="white" />
                        </LinearGradient>
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.aiBubble,
                    item.isError && styles.errorBubble
                ]}>
                    {isUser ? (
                        <Text style={styles.userText}>{item.text}</Text>
                    ) : (
                        <Markdown style={markdownStyles}>
                            {item.text}
                        </Markdown>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#4F46E5', '#06B6D4']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Dr. Stark AI Tutor</Text>
            </LinearGradient>

            <View style={styles.modeToggleContainer}>
                <Text style={styles.modeLabel}>
                    {generalMode ? '🌍 General Knowledge Mode' : '📚 Exam Focused Mode'}
                </Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={generalMode ? "#4F46E5" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={() => setGeneralMode(prev => !prev)}
                    value={generalMode}
                />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text style={styles.loadingText}>Dr. Stark is thinking...</Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.inputWrapper}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={generalMode ? "Ask anything (General Knowledge)..." : "Ask a medical question (Exam Focus)..."}
                        placeholderTextColor="#94a3b8"
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || loading}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const markdownStyles = StyleSheet.create({
    body: {
        color: '#1e293b',
        fontSize: 16,
    },
    heading1: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 10,
        marginBottom: 5,
    },
    heading2: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 10,
        marginBottom: 5,
    },
    paragraph: {
        marginTop: 0,
        marginBottom: 10,
    },
    list_item: {
        marginBottom: 5,
    },
    code_inline: {
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        paddingHorizontal: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});

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
    modeToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        maxWidth: '100%',
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    aiMessageContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: 8,
        justifyContent: 'flex-end',
        paddingBottom: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '80%',
    },
    userBubble: {
        backgroundColor: '#4F46E5',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    errorBubble: {
        backgroundColor: '#fee2e2',
        borderColor: '#ef4444',
    },
    userText: {
        color: 'white',
        fontSize: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    loadingText: {
        marginLeft: 8,
        color: '#64748b',
        fontSize: 14,
    },
    inputWrapper: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        maxHeight: 100,
        fontSize: 16,
        color: '#1e293b',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    sendButtonDisabled: {
        backgroundColor: '#cbd5e1',
    },
});
