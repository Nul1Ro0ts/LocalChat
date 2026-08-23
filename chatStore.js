const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'chat_db.json');

class ChatStore {
    constructor() {
        this.messages = [];
        this._load();
    }

    _load() {
        try {
            if (fs.existsSync(DB_PATH)) {
                this.messages = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
            } else {
                this.messages = [];
                this._save();
            }
        } catch (e) {
            console.error('Error loading chat DB:', e);
            this.messages = [];
        }
    }

    _save() {
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(this.messages, null, 2));
        } catch (e) {
            console.error('Error saving chat DB:', e);
        }
    }

    addMessage(sender, content, room = 'main') {
        const msg = {
            id: uuidv4(),
            sender,
            content,
            timestamp: Date.now(),
            room
        };
        this.messages.push(msg);
        this._save();
        return msg;
    }

    getMessages(room = 'main', limit = 100) {
        return this.messages.filter(m => m.room === room).slice(-limit);
    }
}

module.exports = new ChatStore();
