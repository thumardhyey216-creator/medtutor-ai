import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({
    recentChats = [],
    currentSessionId,
    onLoadSession,
    onNewChat,
    isOpen,
    onClose
}) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Helper for initials
    const getInitials = (name) => {
        return (name || 'MT')
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div className="brand-inline">
                    <div className="brand-logo-sm">M</div>
                    <span className="brand-name">MedTutor AI</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={onClose}>
                    <span className="nav-icon">💬</span>
                    <span>Chat Tutor</span>
                </Link>
                <Link to="/flashcards" className={`nav-item ${location.pathname === '/flashcards' ? 'active' : ''}`} onClick={onClose}>
                    <span className="nav-icon">📇</span>
                    <span>Flashcards</span>
                </Link>
                <Link to="/qbank" className={`nav-item ${location.pathname === '/qbank' ? 'active' : ''}`} onClick={onClose}>
                    <span className="nav-icon">📝</span>
                    <span>QBank</span>
                </Link>
                <Link to="/stats" className={`nav-item ${location.pathname === '/stats' ? 'active' : ''}`} onClick={onClose}>
                    <span className="nav-icon">📊</span>
                    <span>Performance</span>
                </Link>
            </nav>

            <div className="sidebar-section">
                <button
                    id="new-chat-btn"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--space-md)' }}
                    onClick={onNewChat}
                >
                    <span>+</span> New Chat
                </button>
                <h4 className="sidebar-title">Recent Chats</h4>
                <div id="recent-chats" className="recent-chats">
                    {recentChats.length === 0 ? (
                        <p className="text-soft" style={{ fontSize: '0.75rem', padding: '8px' }}>No recent chats</p>
                    ) : (
                        recentChats.map(session => (
                            <div
                                key={session.id}
                                className={`recent-chat-item ${currentSessionId === session.id ? 'active' : ''}`}
                                style={currentSessionId === session.id ? { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' } : {}}
                                onClick={() => {
                                    onLoadSession(session.id);
                                    if (onClose) onClose();
                                }}
                            >
                                <div className="recent-chat-title">{session.title || 'Untitled Chat'}</div>
                                <div className="recent-chat-preview">{session.preview || ''}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar" id="user-avatar">
                        {user ? getInitials(user.name) : 'U'}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.name || 'MedTutor User'}</div>
                        <div className="user-subtitle">{user?.exam || 'Exam not set'}</div>
                    </div>
                </div>
                <button id="logout-btn" className="btn-logout" onClick={logout}>Logout</button>
            </div>
        </aside>
    );
};

export default Sidebar;
