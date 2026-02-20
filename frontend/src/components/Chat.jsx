import React, { useState, useEffect, useRef } from 'react';
import '../styles/chat.css';

const Chat = ({ user, messages, activeRoom, rooms, sendMessage, joinRoom }) => {
    const [inputText, setInputText] = useState('');
    const [newRoomId, setNewRoomId] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText);
            setInputText('');
        }
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (newRoomId.trim()) {
            joinRoom(newRoomId.trim().toLowerCase());
            setNewRoomId('');
        }
    };

    return (
        <div className="chat-container glass">
            <div className="chat-header">
                <h3>Chat Rooms</h3>
                <div className="room-selector">
                    {rooms.map(room => (
                        <button
                            key={room}
                            className={`room-btn ${activeRoom === room ? 'active' : ''}`}
                            onClick={() => joinRoom(room)}
                        >
                            {room.charAt(0).toUpperCase() + room.slice(1)}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleJoinRoom} className="join-room-form">
                    <input
                        type="text"
                        placeholder="Join private room ID..."
                        value={newRoomId}
                        onChange={(e) => setNewRoomId(e.target.value)}
                    />
                    <button type="submit">+</button>
                </form>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages in {activeRoom} yet.</p>
                        <span>Start the conversation!</span>
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
                    placeholder={`Message ${activeRoom}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" disabled={!inputText.trim()}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default Chat;
