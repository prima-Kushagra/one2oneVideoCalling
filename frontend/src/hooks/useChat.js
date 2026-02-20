import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to manage chat state and room logic
 * @param {Object} socket - The socket.io client instance
 */
export const useChat = (socket) => {
    const [messages, setMessages] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null); // null means in Lobby
    const [availableRooms, setAvailableRooms] = useState([]);
    const [status, setStatus] = useState('lobby'); // 'lobby' or 'chatting'

    // Use ref to avoid stale closures in socket events
    const activeRoomRef = useRef(null);

    useEffect(() => {
        activeRoomRef.current = activeRoom;
    }, [activeRoom]);

    useEffect(() => {
        if (!socket) return;

        // Request initial rooms
        socket.emit('get-rooms');

        const handleNewMessage = (message) => {
            console.log("New message received:", message, "Active room ref:", activeRoomRef.current);
            if (message.roomId === activeRoomRef.current) {
                setMessages((prev) => [...prev, message]);
            }
        };

        const handleRoomList = (rooms) => {
            console.log("Room list updated:", rooms);
            setAvailableRooms(rooms);
        };

        const handleRoomCreated = ({ roomId }) => {
            console.log("Room created successfully, joining:", roomId);
            joinRoom(roomId);
        };

        const handleUserJoined = (data) => {
            console.log(`User ${data.username} joined room ${data.roomId}`);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('update-room-list', handleRoomList);
        socket.on('room-created', handleRoomCreated);
        socket.on('user-joined-room', handleUserJoined);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('update-room-list', handleRoomList);
            socket.off('room-created', handleRoomCreated);
            socket.off('user-joined-room', handleUserJoined);
        };
    }, [socket]); // Only depend on socket

    const sendMessage = useCallback((text) => {
        if (!socket || !text.trim() || !activeRoom) return;

        socket.emit('send-message', {
            roomId: activeRoom,
            message: text
        });
    }, [socket, activeRoom]);

    const createRoom = useCallback((name, isPrivate) => {
        if (!socket || !name.trim()) return;
        socket.emit('create-room', { name, isPrivate });
    }, [socket]);

    const joinRoom = useCallback((roomId) => {
        if (!socket) return;

        // No need to "leave" explicitly as join-room handler on server handles logic
        // but we emit it for cleanup if we want
        if (activeRoomRef.current) {
            socket.emit('leave-room', activeRoomRef.current);
        }

        socket.emit('join-room', roomId);
        setActiveRoom(roomId);
        setStatus('chatting');
        setMessages([]);
    }, [socket]);

    const leaveRoom = useCallback(() => {
        if (!socket || !activeRoom) return;

        socket.emit('leave-room', activeRoom);
        setActiveRoom(null);
        setStatus('lobby');
        setMessages([]);
        socket.emit('get-rooms');
    }, [socket, activeRoom]);

    return {
        messages,
        activeRoom,
        availableRooms,
        status,
        sendMessage,
        createRoom,
        joinRoom,
        leaveRoom
    };
};
