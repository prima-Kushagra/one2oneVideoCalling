// Backend handler for WebRTC signaling
module.exports = (io, socket, { onlineUsers, broadcastUserList }) => {
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    socket.on('call-user', ({ toId, offer }) => {
        const target = onlineUsers.get(toId);
        if (!target) return socket.emit('error', { message: 'User offline' });

        if (target.status === 'busy') {
            return socket.emit('user-busy');
        }

        onlineUsers.get(userId).status = 'busy';
        onlineUsers.get(userId).partnerId = toId;

        target.status = 'busy';
        target.partnerId = userId;

        broadcastUserList();

        io.to(target.socketId).emit('incoming-call', {
            fromId: userId,
            fromName: username,
            offer
        });
    });

    socket.on('answer-call', ({ toId, answer }) => {
        const target = onlineUsers.get(toId);
        if (target) {
            io.to(target.socketId).emit('call-answered', {
                fromId: userId,
                answer
            });
        }
    });

    socket.on('ice-candidate', ({ toId, candidate }) => {
        const target = onlineUsers.get(toId);
        if (target) {
            io.to(target.socketId).emit('ice-candidate', {
                fromId: userId,
                candidate
            });
        }
    });

    socket.on('end-call', ({ toId }) => {
        if (onlineUsers.has(userId)) {
            onlineUsers.get(userId).status = 'online';
            onlineUsers.get(userId).partnerId = null;
        }

        if (onlineUsers.has(toId)) {
            onlineUsers.get(toId).status = 'online';
            onlineUsers.get(toId).partnerId = null;
            io.to(onlineUsers.get(toId).socketId).emit('call-ended', { fromId: userId });
        }

        broadcastUserList();
    });
};
