import React, { useState, useEffect, useCallback, useRef } from 'react';

export const useChat = (socket) => {
    const [messages, setMessages] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [status, setStatus] = useState('lobby');
    const [error, setError] = useState(null);

    const activeRoomRef = useRef(null);

    useEffect(() => {
        activeRoomRef.current = activeRoom;
    }, [activeRoom]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('get-rooms');

        const handleNewMessage = (message) => {
            setMessages((prev) => {
                if (message.roomId !== activeRoomRef.current) return prev;
                return [...prev, message];
            });
        };

        const handleRoomList = (rooms) => {
            setAvailableRooms(rooms);
        };

        const handleRoomCreated = ({ roomId }) => {
            setActiveRoom(roomId);
            activeRoomRef.current = roomId;
            setStatus('chatting');
            setMessages([]);
        };


        const handleErrorMessage = (msg) => {
            setError(msg);
        };

        const handleConnectError = (err) => {
            console.log("Socket auth error:", err.message);
        };

        socket.on('new-message', handleNewMessage);
        socket.on('update-room-list', handleRoomList);
        socket.on('room-created', handleRoomCreated);
        socket.on('error-message', handleErrorMessage);
        socket.on('connect_error', handleConnectError);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('update-room-list', handleRoomList);
            socket.off('room-created', handleRoomCreated);
            socket.off('error-message', handleErrorMessage);
            socket.off('connect_error', handleConnectError);
        };
    }, [socket]);

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

        const cleanId = roomId.trim();

        if (activeRoomRef.current && activeRoomRef.current !== cleanId) {
            socket.emit('leave-room', activeRoomRef.current);
        }

        socket.emit('join-room', cleanId);


        setActiveRoom(cleanId);
        setStatus('chatting');
        setMessages([]);
        setError(null);
    }, [socket]);

    const leaveRoom = useCallback(() => {
        if (!socket || !activeRoom) return;

        socket.emit('leave-room', activeRoom);
        setActiveRoom(null);
        activeRoomRef.current = null;
        setStatus('lobby');
        setMessages([]);
        socket.emit('get-rooms');
    }, [socket, activeRoom]);

    return {
        messages,
        activeRoom,
        availableRooms,
        status,
        error,
        sendMessage,
        createRoom,
        joinRoom,
        leaveRoom
    };
};