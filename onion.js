const { SocksProxyAgent } = require('socks-proxy-agent');
const axios = require('axios');

class OnionRouter {
    constructor() {
        this.torHost = '127.0.0.1';
        this.torPort = 9050;
        this.agent = null;
        this.isAvailable = false;
        // Check Tor availability on startup (non-blocking)
        this._checkTor();
    }

    async _checkTor() {
        try {
            const agent = new SocksProxyAgent(`socks5h://${this.torHost}:${this.torPort}`);
            const resp = await axios.get('https://check.torproject.org/api/ip', {
                httpAgent: agent,
                timeout: 5000
            });
            if (resp.data && resp.data.IsTor) {
                this.agent = agent;
                this.isAvailable = true;
                console.log('✅ Tor is available and routing through it.');
            } else {
                console.warn('⚠️ Tor check failed – not routing via Tor.');
                this.isAvailable = false;
            }
        } catch (e) {
            console.warn('⚠️ Tor not available:', e.message);
            this.isAvailable = false;
        }
    }

    // Returns the SOCKS agent for outbound requests
    getAgent() {
        return this.isAvailable ? this.agent : null;
    }

    // For UI – creates a simulated circuit
    createCircuit() {
        return { circuitId: Date.now(), hops: ['tor1', 'tor2', 'tor3'] };
    }
}

module.exports = new OnionRouter();
