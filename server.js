const jsonServer = require('json-server');
const path = require('path');
const fs = require('fs');

const server = jsonServer.create();
const dbPath = path.join(__dirname, 'db.json');
const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults({
    static: __dirname
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom endpoint: save entire database at once (prevents duplication)
server.post('/save-all', function(req, res) {
    try {
        var newDb = req.body;

        // Auto backup before overwrite
        var backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        var backupFile = path.join(backupDir, 'db-' + timestamp + '.json');
        // Keep only last 50 backups
        var existingBackups = fs.readdirSync(backupDir).filter(function(f){return f.endsWith('.json');}).sort();
        if (existingBackups.length >= 50) {
            fs.unlinkSync(path.join(backupDir, existingBackups[0]));
        }
        fs.copyFileSync(dbPath, backupFile);

        // Write new data
        fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), 'utf8');
        router.db.setState(newDb);
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

server.use(router);

const PORT = 3000;
const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

server.listen(PORT, '0.0.0.0', function() {
    const ip = getLocalIP();
    console.log('');
    console.log('==========================================');
    console.log('  ระบบประเมินพนักงาน - Server Started');
    console.log('==========================================');
    console.log('');
    console.log('  เปิดในเครื่องนี้:');
    console.log('  http://localhost:' + PORT);
    console.log('');
    console.log('  ให้คนอื่นในองค์กรเข้าผ่าน:');
    console.log('  http://' + ip + ':' + PORT);
    console.log('');
    console.log('  (ทุกคนต้องอยู่ WiFi/LAN เดียวกัน)');
    console.log('==========================================');
    console.log('');
});
