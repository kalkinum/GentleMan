require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const MASTER_SALT = process.env.SECRET_SALT || "DEFAULT_SALT_2026";
const GAME_ID = process.env.UNITY_GAME_ID;

const secureData = (data) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', 
        crypto.scryptSync(MASTER_SALT, 'salt', 32), 
        Buffer.alloc(16, 0));
    return Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]).toString('hex');
};

let stats = { connections: 0, impressions: 0, clicks: 0, startTime: Date.now() };

app.get('/app-ads.txt', (req, res) => {
    try {
        const content = fs.readFileSync('./app-ads.txt', 'utf8');
        res.type('text/plain').send(content);
    } catch (err) {
        res.status(500).send("app-ads.txt not found in root.");
    }
});

io.on('connection', (socket) => {
    stats.connections++;

    const currentCTR = stats.impressions > 0 ? (stats.clicks / stats.impressions) : 0;
    const nextTask = currentCTR < 0.02 ? "ENGAGE" : "GHOST_WATCH";

    const payload = secureData({
        gid: GAME_ID,
        p_ids: {
            v: process.env.ID_VIDEO,
            i: process.env.ID_INTERSTITIAL,
            b: process.env.ID_BANNER
        },
        task: nextTask,
        jitter: Math.floor(Math.random() * 30000) + 15000
    });

    socket.emit('cmd', payload);

    socket.on('ack', (data) => {
        if (data.type === 'imp') stats.impressions++;
        if (data.type === 'clk') stats.clicks++;
    });

    socket.on('disconnect', () => { stats.connections--; });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    const updateConsole = () => {
        process.stdout.write('\x1Bc'); 
        const ctr = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : "0.00";
        
        const active = `\x1b[36mActive:\x1b[0m \x1b[37m${stats.connections}\x1b[0m`; 
        const ing = `\x1b[32mIng:\x1b[0m \x1b[37m${stats.impressions}\x1b[0m`;       
        const clicks = `\x1b[33mClicks:\x1b[0m \x1b[37m${stats.clicks}\x1b[0m`;     
        const ctrOut = `\x1b[35mCTR:\x1b[0m \x1b[37m${ctr}%\x1b[0m`;                

        process.stdout.write(`${active}  ${ing}  ${clicks}  ${ctrOut}\n`);
    };

    setInterval(updateConsole, 2000); 
});
