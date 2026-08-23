const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const chatStore = require('./chatStore');
const onionRouter = require('./onion');
const vpnProxy = require('./vpn');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 8000;
const USER_DEFAULT = 'NS(Member)';

app.use(express.static(path.join(__dirname, 'public')));

// Health/status
app.get('/api/status', (req, res) => {
    res.json({
        onionAvailable: onionRouter.isAvailable,
        vpnActive: !!vpnProxy.activeTunnel,
        messages: chatStore.messages.length,
        users: io.engine.clientsCount
    });
});

// Connect endpoint – always succeeds, with logging
app.post('/api/connect', (req, res) => {
    try {
        console.log('📡 /api/connect called');
        const circuit = onionRouter.createCircuit();
        const tunnel = vpnProxy.createTunnel();
        const response = {
            onion: true,
            vpn: true,
            circuitId: circuit.circuitId,
            tunnelId: tunnel.id,
            maskedIP: vpnProxy.maskIP('0.0.0.0'),
            onionAvailable: onionRouter.isAvailable
        };
        console.log('✅ Connect success:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ /api/connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Socket.io
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId || USER_DEFAULT;
    console.log(`🔌 User ${userId} connected`);

    const history = chatStore.getMessages('main', 100);
    socket.emit('history', { messages: history, room: 'main' });

    socket.on('message', (data) => {
        const content = data.content.trim();
        if (!content) return;
        const stored = chatStore.addMessage(userId, content, 'main');
        io.emit('message', { message: stored, delivered: true });
    });

    socket.on('disconnect', () => {
        console.log(`🔌 User ${userId} disconnected`);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 OnionChat running on port ${PORT}`);
});
