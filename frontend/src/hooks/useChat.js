import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to manage chat state and room logic
 * @param {Object} socket - The socket.io client instance
 */
export const useChat = (socket) => {
    const [messages, setMessages] = useState([]);
    const [activeRoom, setActiveRoom] = useState('public');
    const [rooms, setRooms] = useState(['public']);

    useEffect(() => {
        if (!socket) return;

        // Join the initial room
        socket.emit('join-room', activeRoom);

        const handleNewMessage = (message) => {
            if (message.roomId === activeRoom) {
                setMessages((prev) => [...prev, message]);
            }
        };

        const handleUserJoined = (data) => {
            console.log(`User ${data.username} joined room ${data.roomId}`);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('user-joined-room', handleUserJoined);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('user-joined-room', handleUserJoined);
        };
    }, [socket, activeRoom]);

    const sendMessage = useCallback((text) => {
        if (!socket || !text.trim()) return;

        socket.emit('send-message', {
            roomId: activeRoom,
            message: text
        });
    }, [socket, activeRoom]);

    const joinRoom = useCallback((roomId) => {
        if (!socket) return;

        // Leave old room
        socket.emit('leave-room', activeRoom);

        // Join new room
        setActiveRoom(roomId);
        setMessages([]); // Clear messages when switching rooms (for now)
        if (!rooms.includes(roomId)) {
            setRooms(prev => [...prev, roomId]);
        }
    }, [socket, activeRoom, rooms]);

    return {
        messages,
        activeRoom,
        rooms,
        sendMessage,
        joinRoom
    };
};
