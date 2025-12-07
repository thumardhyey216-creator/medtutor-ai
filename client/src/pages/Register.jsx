import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [exam, setExam] = useState('neet-pg');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await register(name, email, password, exam);
            navigate('/dashboard');
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-root">
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
                        <span className="hero-label">Active Students</span>
                        <span className="hero-value">5,000+</span>
                        <span className="hero-sub">Join our community</span>
                    </div>
                    <div className="hero-card">
                        <span className="hero-label">Success Rate</span>
                        <span className="hero-value">94%</span>
                        <span className="hero-sub">Students improved</span>
                    </div>
                </div>

                <p className="hero-footer">
                    AI-powered chat tutor, flashcards, QBank & performance analytics in one place.
                </p>
            </div>

            <div className="auth-panel">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Create Your Account 🎓</h2>
                        <p>Start your medical exam preparation journey</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="field">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="input"
                                placeholder="Dr. John Doe"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

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
                                minLength="6"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="exam">Preparing For</label>
                            <select
                                id="exam"
                                name="exam"
                                className="select"
                                value={exam}
                                onChange={(e) => setExam(e.target.value)}
                            >
                                <option value="neet-pg">NEET PG</option>
                                <option value="ini-cet">INI CET</option>
                                <option value="mbbs">MBBS</option>
                                <option value="fmge">FMGE</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating account...' : 'Create Account'}
                        </button>

                        {error && (
                            <p className="error-message" style={{ display: 'block' }}>
                                {error}
                            </p>
                        )}
                    </form>

                    <div className="auth-footer">
                        <span>Already have an account?</span>
                        <Link to="/login" className="link-accent">Log in</Link>
                    </div>
                </div>

                <p className="terms">
                    By creating an account, you agree this is for educational use only and not a substitute for clinical judgment.
                </p>
            </div>
        </div>
    );
};

export default Register;
