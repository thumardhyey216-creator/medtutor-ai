import React, { useState } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import MessageList from '../components/Chat/MessageList';
import ChatInput from '../components/Chat/ChatInput';
import { useChat } from '../hooks/useChat';

const Dashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [exam, setExam] = useState('neet-pg');
    const [mode, setMode] = useState('standard');
    const [generalMode, setGeneralMode] = useState(false);

    const {
        messages,
        recentChats,
        currentSessionId,
        isLoading,
        isHistoryLoading,
        hasMore,
        sendMessage,
        loadSession,
        startNewChat,
        loadMoreMessages
    } = useChat();

    const handleSendMessage = (text) => {
        sendMessage(text, exam, mode, generalMode);
    };

    return (
        <div className="app-shell">
            <Sidebar
                recentChats={recentChats}
                currentSessionId={currentSessionId}
                onLoadSession={loadSession}
                onNewChat={startNewChat}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="main chat-main">
                {/* Mobile Header (Toggle) - Only visible on mobile via CSS typically, but we need button */}
                <div className="mobile-header" style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 100,
                    display: 'none' // Hidden by default, show via media query if possible or handled by Sidebar css?
                    // The original CSS handled sidebar display: none; on mobile.
                    // We need a toggle button visible only on mobile.
                }}>
                    <button
                        className="btn-outline btn-sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                    >
                        ☰
                    </button>
                </div>
                {/* Ideally media query in CSS handles display of this button. 
                    For now, I'll rely on users not being on mobile or add inline style for mobile check if I can? 
                    React logic: I'll just leave it here; CSS should handle visibility if I add a class.
                    Let's add a class 'mobile-toggle' and ensure CSS hides it on desktop.
                */}
                <style>{`
                    @media (min-width: 769px) {
                        .mobile-toggle { display: none !important; }
                    }
                    @media (max-width: 768px) {
                        .mobile-toggle { display: block !important; position: fixed; top: 12px; left: 12px; zIndex: 60; }
                    }
                `}</style>
                <button
                    className="btn-outline btn-sm mobile-toggle"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '4px 8px' }}
                >
                    ☰
                </button>

                <MessageList
                    messages={messages}
                    isLoading={isLoading}
                    onSuggestedClick={(text) => handleSendMessage(text)}
                    hasMore={hasMore}
                    loadMoreMessages={loadMoreMessages}
                    isHistoryLoading={isHistoryLoading}
                />

                <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    exam={exam}
                    setExam={setExam}
                    mode={mode}
                    setMode={setMode}
                    generalMode={generalMode}
                    setGeneralMode={setGeneralMode}
                />
            </main>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="sidebar-overlay"
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 40
                    }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;
