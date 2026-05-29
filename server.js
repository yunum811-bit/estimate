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
        fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), 'utf8');
        // Reload router database
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
