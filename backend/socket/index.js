const callHandler = require('./callHandler');
const chatHandler = require('./chatHandler');

const onlineUsers = new Map();

module.exports = (io) => {
    const getOnlineUsers = () => {
        return Array.from(onlineUsers.entries()).map(([userId, data]) => ({
            userId,
            username: data.username,
            status: data.status
        }));
    };

    const broadcastUserList = () => {
        io.emit('update-user-list', getOnlineUsers());
    };

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        const username = socket.user.username;

        console.log(`User connected: ${username} (${userId}) - ${socket.id}`);

        const existingUser = onlineUsers.get(userId);
        if (existingUser) {
            existingUser.socketId = socket.id;
            existingUser.status = 'online';
            existingUser.partnerId = null;
            onlineUsers.set(userId, existingUser);
        } else {
            onlineUsers.set(userId, {
                socketId: socket.id,
                username,
                status: 'online',
                partnerId: null
            });
        }

        broadcastUserList();
  
        callHandler(io, socket, { onlineUsers, broadcastUserList });
        const { cleanupUserFromRooms } = chatHandler(io, socket, { onlineUsers });

        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${username} (${reason})`);

            setTimeout(() => {
                const userData = onlineUsers.get(userId);
                if (!userData || userData.socketId !== socket.id) return;

                if (userData.partnerId) {
                    const partner = onlineUsers.get(userData.partnerId);
                    if (partner) {
                        partner.status = 'online';
                        partner.partnerId = null;
                        io.to(partner.socketId).emit('call-ended', { fromId: userId });
                    }
                }

                cleanupUserFromRooms();
                onlineUsers.delete(userId);
                broadcastUserList();
            }, 3000);
        });
    });
};
