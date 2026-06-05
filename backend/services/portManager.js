// backend/src/services/portManager.js
class PortManager {
    constructor() {
        this.minPort = parseInt(process.env.MIN_PORT) || 9000;
        this.maxPort = parseInt(process.env.MAX_PORT) || 9999;
        this.usedPorts = new Set();
        this.portUserMap = new Map();
    }

    getAvailablePort() {
        for (let port = this.minPort; port <= this.maxPort; port++) {
            if (!this.usedPorts.has(port)) {
                return port;
            }
        }
        throw new Error('No available ports');
    }

    assignPort(userId) {
        // Check if user already has port
        for (let [port, user] of this.portUserMap.entries()) {
            if (user === userId) {
                return port;
            }
        }

        const port = this.getAvailablePort();
        this.usedPorts.add(port);
        this.portUserMap.set(port, userId);
        console.log(`✅ Port ${port} assigned to ${userId}`);
        return port;
    }

    releasePort(port) {
        this.usedPorts.delete(port);
        this.portUserMap.delete(port);
    }

    getUserPort(userId) {
        for (let [port, user] of this.portUserMap.entries()) {
            if (user === userId) {
                return port;
            }
        }
        return null;
    }

    getStats() {
        return {
            total: this.maxPort - this.minPort + 1,
            used: this.usedPorts.size,
            available: (this.maxPort - this.minPort + 1) - this.usedPorts.size,
            range: `${this.minPort}-${this.maxPort}`
        };
    }
}

module.exports = new PortManager();
