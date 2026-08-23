const crypto = require('crypto');

class VPNProxy {
    constructor() {
        this.tunnels = {};
        this.activeTunnel = null;
    }

    createTunnel() {
        const id = `tun-${Date.now()}`;
        const key = crypto.randomBytes(32);
        this.tunnels[id] = { id, key, created: Date.now() };
        this.activeTunnel = this.tunnels[id];
        return this.activeTunnel;
    }

    // Encrypt a message using AES-256-CBC
    encrypt(data) {
        if (!this.activeTunnel) this.createTunnel();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.activeTunnel.key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { iv: iv.toString('hex'), encrypted };
    }

    // Decrypt (not used in broadcast, but available)
    decrypt(encryptedData) {
        if (!this.activeTunnel) return null;
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.activeTunnel.key, iv);
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    maskIP(original) {
        return `10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
    }
}

module.exports = new VPNProxy();
