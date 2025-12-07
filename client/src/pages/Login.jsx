import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await login(email, password);
            navigate('/dashboard'); // or home
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-root">
            {/* Hero Section */}
            <div className="auth-hero">
                <div className="brand">
                    <div className="brand-logo">M</div>
                    <div className="brand-text">
                        <h1>MedTutor AI</h1>
                        <p>Personalized medical tutor for NEET PG, INI CET & MBBS.</p>
                    </div>
                </div>

                <div className="hero-stats">
                    <div className="hero-card">
                        <span className="hero-label">Questions Practiced</span>
                        <span className="hero-value">1,50,000+</span>
                        <span className="hero-sub">Across all subjects</span>
                    </div>
                    <div className="hero-card">
                        <span className="hero-label">Average Score Boost</span>
                        <span className="hero-value">+23%</span>
                        <span className="hero-sub">After 4 weeks of use</span>
                    </div>
                </div>

                <p className="hero-footer">
                    Log in to continue with your chat tutor, flashcards, QBank & performance analytics.
                </p>
            </div>

            {/* Auth Panel */}
            <div className="auth-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Welcome back 👋</h2>
                        <p>Log in to your MedTutor AI account</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input"
                                placeholder="you@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                            {isSubmitting ? 'Logging in...' : 'Log In'}
                        </button>

                        {error && (
                            <p className="error-message" style={{ display: 'block' }}>
                                {error}
                            </p>
                        )}
                    </form>

                    <div className="auth-footer">
                        <span>Don't have an account?</span>
                        <Link to="/register" className="link-accent">Create one</Link>
                    </div>
                </div>

                <p className="terms">
                    For educational use only. Not a substitute for professional medical training or clinical judgment.
                </p>
            </div>
        </div>
    );
};

export default Login;
