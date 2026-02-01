import React from 'react';

const Dashboard = ({ onlineUsers, startCall, user }) => {
    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Welcome, {user.username}</h2>
                <p>Status: Online 🟢</p>
            </div>

            <div className="online-users-section">
                <h3>Online Users ({onlineUsers.length})</h3>
                {onlineUsers.length === 0 ? (
                    <p className="no-users">No other users online right now.</p>
                ) : (
                    <ul className="user-list">
                        {onlineUsers.map((u) => (
                            <li key={u.userId} className="user-item">
                                <div className="user-status-wrapper">
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
                                    {u.status === 'busy' ? 'Busy' : '📞 Call'}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
