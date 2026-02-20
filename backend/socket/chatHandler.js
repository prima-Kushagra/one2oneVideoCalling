
const roomsMap = new Map();

module.exports = (io, socket, { onlineUsers }) => {
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    const getPublicRooms = () => {
        return Array.from(roomsMap.entries())
            .filter(([id, data]) => !data.isPrivate)
            .map(([id, data]) => ({
                id,
                name: data.name,
                membersCount: data.members.size
            }));
    };

    socket.on('get-rooms', () => {
        socket.emit('update-room-list', getPublicRooms());
    });

    socket.on('create-room', ({ name, isPrivate }) => {
        const roomId = isPrivate ? Math.random().toString(36).substring(7) : name.toLowerCase().replace(/\s+/g, '-');

        if (!roomsMap.has(roomId)) {
            roomsMap.set(roomId, {
                name,
                isPrivate,
                members: new Set()
            });
            console.log(`Room created: ${name} (${roomId}) - Private: ${isPrivate}`);
        }

        // Notify creator to join
        socket.emit('room-created', { roomId, name, isPrivate });

        // Broadcast list update to EVERYONE immediately if public
        if (!isPrivate) {
            io.emit('update-room-list', getPublicRooms());
        }
    });

    socket.on('join-room', (roomId) => {
        socket.join(roomId);

        if (!roomsMap.has(roomId)) {
            roomsMap.set(roomId, {
                name: roomId,
                isPrivate: false,
                members: new Set()
            });
        }

        const room = roomsMap.get(roomId);
        room.members.add(userId);

        console.log(`User ${username} joined room: ${roomId}`);
        // Notify others in room
        socket.to(roomId).emit('user-joined-room', { userId, username, roomId });

        // Always broadcast update to everyone to refresh member counts
        io.emit('update-room-list', getPublicRooms());
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        const room = roomsMap.get(roomId);
        if (room) {
            room.members.delete(userId);
            console.log(`User ${username} left room: ${roomId}`);

            // Cleanup empty rooms
            if (room.members.size === 0) {
                roomsMap.delete(roomId);
            }

            io.emit('update-room-list', getPublicRooms());
        }
    });

    socket.on('send-message', ({ roomId, message }) => {
        if (!roomId || !message.trim()) return;

        const messageData = {
            id: Date.now().toString() + Math.random().toString(36).substring(5),
            senderId: userId,
            senderName: username,
            text: message,
            timestamp: new Date().toISOString(),
            roomId
        };

        console.log(`[CHAT] ${roomId} | ${username}: ${message}`);
        // Emit to EVERYONE in the room including sender
        io.to(roomId).emit('new-message', messageData);
    });

    // Helper to cleanup user from all rooms on disconnect
    const cleanupUserFromRooms = () => {
        roomsMap.forEach((room, roomId) => {
            if (room.members.has(userId)) {
                room.members.delete(userId);
                if (room.members.size === 0 && roomId !== 'public') {
                    roomsMap.delete(roomId);
                }
            }
        });
        io.emit('update-room-list', getPublicRooms());
    };

    return { cleanupUserFromRooms };
};
