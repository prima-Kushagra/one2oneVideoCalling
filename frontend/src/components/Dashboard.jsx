import React from 'react';
import Chat from './Chat';
import { useChat } from '../hooks/useChat';

const Dashboard = ({ onlineUsers, startCall, user, socket }) => {
    const chatProps = useChat(socket);

    return (
        <div className="dashboard-layout">
            <div className="dashboard-main">
                <div className="dashboard-header">
                    <div>
                        <h2>Welcome, {user.username}</h2>
                        <p>You're online and ready for calls</p>
                    </div>
                    <div className="status-tag online">Active</div>
                </div>

                <div className="online-users-section">
                    <h3>Online Users ({onlineUsers.length})</h3>
                    {onlineUsers.length === 0 ? (
                        <div className="no-users">
                            <p>No other users online right now.</p>
                            <span>Others might join soon!</span>
                        </div>
                    ) : (
                        <ul className="user-list">
                            {onlineUsers.map((u) => (
                                <li key={u.userId} className="user-item">
                                    <div className="user-status-wrapper">
                                        <div className="user-avatar">
                                            {u.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="username">{u.username}</span>
                                        <span className={`status-tag ${u.status === 'busy' ? 'busy' : 'online'}`}>
                                            {u.status === 'busy' ? 'In Call' : 'Online'}
                                        </span>
                                    </div>
                                    <button
                                        className="call-btn"
                                        onClick={() => startCall(u.userId)}
                                        disabled={u.status === 'busy'}
                                    >
                                        {u.status === 'busy' ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                                            </svg>
                                        )}
                                        {u.status === 'busy' ? 'Busy' : 'Start Call'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="dashboard-sidebar">
                <Chat user={user} {...chatProps} />
            </div>
        </div>
    );
};

export default Dashboard;
