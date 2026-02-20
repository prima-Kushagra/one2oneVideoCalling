import React, { useState, useEffect, useRef } from 'react';
import '../styles/chat.css';

const Chat = ({ user, messages, activeRoom, availableRooms, status, sendMessage, createRoom, joinRoom, leaveRoom }) => {
    const [inputText, setInputText] = useState('');
    const [roomName, setRoomName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [privateId, setPrivateId] = useState('');
    const [view, setView] = useState('browse'); // 'browse', 'create', 'private'
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (status === 'chatting') {
            scrollToBottom();
        }
    }, [messages, status]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText);
            setInputText('');
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (roomName.trim()) {
            createRoom(roomName.trim(), isPrivate);
            setRoomName('');
        }
    };

    const handleJoinPrivate = (e) => {
        e.preventDefault();
        if (privateId.trim()) {
            joinRoom(privateId.trim());
            setPrivateId('');
        }
    };

    if (status === 'lobby') {
        return (
            <div className="chat-container lobby-view glass">
                <div className="chat-header">
                    <h3>Chat Lobby</h3>
                    <div className="lobby-tabs">
                        <button className={view === 'browse' ? 'active' : ''} onClick={() => setView('browse')}>Public</button>
                        <button className={view === 'private' ? 'active' : ''} onClick={() => setView('private')}>Private</button>
                        <button className={view === 'create' ? 'active' : ''} onClick={() => setView('create')}>Create</button>
                    </div>
                </div>

                <div className="lobby-content">
                    {view === 'browse' && (
                        <div className="room-list">
                            <h4>Available Public Rooms</h4>
                            {availableRooms.length === 0 ? (
                                <p className="no-rooms">No public rooms yet. Create one!</p>
                            ) : (
                                availableRooms.map(room => (
                                    <div key={room.id} className="room-item">
                                        <div className="room-info">
                                            <span className="name">{room.name}</span>
                                            <span className="count">{room.membersCount} online</span>
                                        </div>
                                        <button onClick={() => joinRoom(room.id)}>Join</button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {view === 'private' && (
                        <form onSubmit={handleJoinPrivate} className="lobby-form">
                            <h4>Join Private Room</h4>
                            <p>Enter the unique Room ID shared with you.</p>
                            <input
                                type="text"
                                placeholder="Room ID..."
                                value={privateId}
                                onChange={(e) => setPrivateId(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="primary-btn">Join Room</button>
                        </form>
                    )}

                    {view === 'create' && (
                        <form onSubmit={handleCreate} className="lobby-form">
                            <h4>Create New Room</h4>
                            <input
                                type="text"
                                placeholder="Room name..."
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                autoFocus
                            />
                            <div className="checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isPrivate}
                                        onChange={(e) => setIsPrivate(e.target.checked)}
                                    />
                                    Private (ID only)
                                </label>
                            </div>
                            <button type="submit" className="primary-btn">Create Room</button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container chatting-view glass">
            <div className="chat-header">
                <div className="chat-header-top">
                    <button className="leave-btn" onClick={leaveRoom} title="Leave Chat Room">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                        Leave Room
                    </button>
                    <div className="room-badge" title="Room ID">{activeRoom}</div>
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>Welcome to {activeRoom}!</p>
                        <span>Send a message to start conversing.</span>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                            <div className="message-info">
                                <span className="sender">{msg.senderName}</span>
                                <span className="time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="message-text">{msg.text}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSend}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" disabled={!inputText.trim()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default Chat;
