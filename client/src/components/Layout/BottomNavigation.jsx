import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNavigation = () => {
    return (
        <nav className="bottom-nav">
            <NavLink
                to="/dashboard"
                className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-icon">💬</span>
                <span className="nav-label">Chat</span>
            </NavLink>

            <NavLink
                to="/flashcards"
                className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-icon">📇</span>
                <span className="nav-label">Cards</span>
            </NavLink>

            <NavLink
                to="/qbank"
                className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-icon">📝</span>
                <span className="nav-label">QBank</span>
            </NavLink>

            <NavLink
                to="/stats"
                className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
            >
                <span className="nav-icon">📊</span>
                <span className="nav-label">Stats</span>
            </NavLink>
        </nav>
    );
};

export default BottomNavigation;
