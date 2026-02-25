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
        const roomId = isPrivate
            ? Math.random().toString(36).substring(7)
            : name.toLowerCase().replace(/\s+/g, '-');

        if (!isPrivate && roomsMap.has(roomId)) {
            return socket.emit('error-message', 'Room already exists');
        }

        if (!roomsMap.has(roomId)) {
            roomsMap.set(roomId, {
                name,
                isPrivate,
                members: new Set()
            });
        }

        socket.join(roomId);
        roomsMap.get(roomId).members.add(userId);

        console.log(`Room created and joined: ${roomId} by ${username}`);

        socket.emit('room-created', { roomId, name, isPrivate });

        if (!isPrivate) {
            io.emit('update-room-list', getPublicRooms());
        }
    });

    socket.on('join-room', (roomId) => {
        const room = roomsMap.get(roomId);

        if (!room) {
            return socket.emit('error-message', 'Room does not exist');
        }

        socket.join(roomId);
        room.members.add(userId);

        console.log(`User ${username} joined room: ${roomId}`);

        const systemMessage = {
            id: Date.now().toString(),
            senderId: 'system',
            senderName: 'System',
            text: `${username} joined the room`,
            timestamp: new Date().toISOString(),
            roomId,
            type: 'system'
        };

        io.to(roomId).emit('new-message', systemMessage);

        io.emit('update-room-list', getPublicRooms());
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        const room = roomsMap.get(roomId);

        if (room) {
            room.members.delete(userId);
            console.log(`User ${username} left room: ${roomId}`);

            const systemMessage = {
                id: Date.now().toString(),
                senderId: 'system',
                senderName: 'System',
                text: `${username} left the room`,
                timestamp: new Date().toISOString(),
                roomId,
                type: 'system'
            };

            io.to(roomId).emit('new-message', systemMessage);

            if (room.members.size === 0) {
                roomsMap.delete(roomId);
            }

            io.emit('update-room-list', getPublicRooms());
        }
    });

    socket.on('send-message', ({ roomId, message }) => {
        if (!roomId || !message.trim()) return;

        console.log("Room members:", io.sockets.adapter.rooms.get(roomId));

        const messageData = {
            id: Date.now().toString() + Math.random().toString(36).substring(5),
            senderId: userId,
            senderName: username,
            text: message,
            timestamp: new Date().toISOString(),
            roomId,
            type: 'user'  
        };

        console.log(`[CHAT] ${roomId} | ${username}: ${message}`);

        io.to(roomId).emit('new-message', messageData);
    });

    const cleanupUserFromRooms = () => {
        roomsMap.forEach((room, roomId) => {
            if (room.members.has(userId)) {
                room.members.delete(userId);
                socket.leave(roomId);

                if (room.members.size === 0) {
                    room.expiryTimer = setTimeout(() => {
                        roomsMap.delete(roomId);
                        console.log(`Room ${roomId} expired`);
                    }, 5 * 60 * 1000);
                }
            }
        });

        io.emit('update-room-list', getPublicRooms());
    };

    return { cleanupUserFromRooms };
};