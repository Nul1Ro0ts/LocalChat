const USER = 'NS(Member)';
let socket = null;
let connected = false;
let connecting = false;
let currentRoom = 'main';

const splash = document.getElementById('splash-screen');
const chat = document.getElementById('chat-screen');
const onionBtn = document.getElementById('onion-start-btn');
const onionStatus = document.getElementById('onion-status');
const vpnStatus = document.getElementById('vpn-status');
const progress = document.getElementById('loading-progress');
const loadText = document.getElementById('loading-text');
const userDisplay = document.getElementById('user-display');
const userBadge = document.getElementById('user-badge');
const connBadge = document.getElementById('conn-badge');
const messages = document.getElementById('chat-messages');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const disconnectBtn = document.getElementById('disconnect-btn');

userDisplay.textContent = USER;
userBadge.textContent = USER;

console.log('🚀 OnionChat client started');

function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function renderMessage(msg) {
    const isOwn = msg.sender === USER;
    const div = document.createElement('div');
    div.className = `message ${isOwn ? 'own' : 'other'}`;
    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = isOwn ? 'You' : msg.sender;
    const content = document.createElement('span');
    content.className = 'content';
    content.textContent = msg.content;
    const time = document.createElement('span');
    time.className = 'timestamp';
    time.textContent = new Date(msg.timestamp).toLocaleTimeString();
    div.append(sender, content, time);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

async function startOnionRouting() {
    if (connecting) return;
    connecting = true;
    onionBtn.disabled = true;
    onionBtn.innerHTML = '<span class="button-icon">⏳</span> Connecting...';
    loadText.textContent = 'Establishing secure tunnel...';
    progress.style.width = '30%';
    onionStatus.className = 'status-indicator connecting';
    vpnStatus.className = 'status-indicator connecting';
    try {
        console.log('📡 Sending /api/connect request...');
        const resp = await fetch('/api/connect', { method: 'POST' });
        console.log('📡 Response status:', resp.status);
        if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`Server error (${resp.status}): ${errorText}`);
        }
        const data = await resp.json();
        console.log('✅ Connect response:', data);
        progress.style.width = '70%';
        loadText.textContent = 'Secure tunnel established!';
        onionStatus.className = 'status-indicator online';
        vpnStatus.className = 'status-indicator online';
        progress.style.width = '100%';
        await new Promise(r => setTimeout(r, 300));
        connectSocket();
        splash.style.opacity = '0';
        splash.style.transform = 'scale(0.95)';
        setTimeout(() => {
            splash.classList.add('hidden');
            chat.classList.remove('hidden');
            chat.style.opacity = '1';
            input.focus();
            connecting = false;
        }, 400);
    } catch (error) {
        console.error('❌ Connect error:', error);
        loadText.textContent = `❌ ${error.message}`;
        progress.style.width = '0%';
        onionStatus.className = 'status-indicator offline';
        vpnStatus.className = 'status-indicator offline';
        onionBtn.disabled = false;
        onionBtn.innerHTML = '<span class="button-icon">🧅</span> Retry';
        connecting = false;
    }
}

function connectSocket() {
    console.log('🔌 Connecting Socket.IO...');
    if (socket) { socket.disconnect(); socket = null; }
    // Use the same host as the page
    socket = io({
        query: { userId: USER }
    });
    socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        connected = true;
        connBadge.textContent = '🔒 Secure';
        connBadge.style.color = '#4ade80';
        onionBtn.textContent = '✅ Connected';
    });
    socket.on('history', (data) => {
        console.log('📜 History received:', data.messages.length);
        messages.innerHTML = '';
        if (data.messages && data.messages.length) {
            data.messages.forEach(renderMessage);
        }
        if (data.room) {
            currentRoom = data.room;
            addSystemMessage(`Joined room: ${data.room}`);
        }
    });
    socket.on('message', (data) => {
        console.log('💬 Message received:', data.message);
        renderMessage(data.message);
    });
    socket.on('disconnect', () => {
        console.log('⚠️ Socket.IO disconnected');
        connected = false;
        connBadge.textContent = '⚠️ Disconnected';
        connBadge.style.color = '#f87171';
        onionBtn.disabled = false;
        onionBtn.innerHTML = '<span class="button-icon">🧅</span> Reconnect';
    });
    socket.on('connect_error', (err) => {
        console.error('❌ Socket.IO connection error:', err);
        addSystemMessage(`❌ Connection error: ${err.message}`);
    });
}

function sendMessage() {
    const content = input.value.trim();
    if (!content) return;
    if (!connected) {
        input.placeholder = '⛔ Not connected...';
        setTimeout(() => { input.placeholder = 'Type a message...'; }, 2000);
        return;
    }
    console.log('📤 Sending message:', content);
    socket.emit('message', { content, room: currentRoom });
    input.value = '';
    input.focus();
}

onionBtn.addEventListener('click', startOnionRouting);
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });
disconnectBtn.addEventListener('click', () => {
    if (socket) { socket.disconnect(); socket = null; connected = false; }
    chat.classList.add('hidden');
    splash.classList.remove('hidden');
    splash.style.opacity = '1';
    splash.style.transform = 'scale(1)';
    onionBtn.disabled = false;
    onionBtn.innerHTML = '<span class="button-icon">🧅</span> Connect Securely';
    progress.style.width = '0%';
    loadText.textContent = 'Ready';
    onionStatus.className = 'status-indicator offline';
    vpnStatus.className = 'status-indicator offline';
    messages.innerHTML = '';
    connecting = false;
});
