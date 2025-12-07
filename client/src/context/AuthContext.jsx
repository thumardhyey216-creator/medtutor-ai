import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('medtutor_token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('medtutor_user');
        const storedToken = localStorage.getItem('medtutor_token');

        if (storedToken && storedUser) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            localStorage.setItem('medtutor_token', token);
            localStorage.setItem('medtutor_user', JSON.stringify(user));

            setToken(token);
            setUser(user);
            return user;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (name, email, password, exam) => {
        try {
            const response = await api.post('/auth/register', { name, email, password, exam });
            const { token, user } = response.data;

            localStorage.setItem('medtutor_token', token);
            localStorage.setItem('medtutor_user', JSON.stringify(user));

            setToken(token);
            setUser(user);
            return user;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // limit logout errors
        } finally {
            localStorage.removeItem('medtutor_token');
            localStorage.removeItem('medtutor_user');
            setToken(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!token }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
