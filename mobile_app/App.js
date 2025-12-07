import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import QBankScreen from './src/screens/QBankScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import FlashcardsScreen from './src/screens/FlashcardsScreen';
import ChatScreen from './src/screens/ChatScreen';
import StatsScreen from './src/screens/StatsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'QBank') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Flashcards') {
            iconName = focused ? 'albums' : 'albums-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Dashboard', headerLeft: null }}
      />
      <Tab.Screen 
        name="QBank" 
        component={QBankScreen} 
        options={{ title: 'Question Bank' }}
      />
      <Tab.Screen 
        name="Flashcards" 
        component={FlashcardsScreen} 
        options={{ title: 'Flashcards' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ title: 'AI Tutor' }}
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{ title: 'Statistics' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('medtutor_user');
      const token = await AsyncStorage.getItem('medtutor_token');
      if (storedUser && token) {
        setInitialRoute('MainTabs');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitializing(false);
    }
  };

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Quiz" 
          component={QuizScreen} 
          options={{ title: 'Quiz', headerBackVisible: false }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen} 
          options={{ title: 'Results', headerLeft: null }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
