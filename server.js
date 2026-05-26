const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
    static: __dirname  // serve index.html, style.css, app.js from same folder
});

// Use default middlewares (CORS, static files, etc.)
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom: make "id" field work as string (json-server defaults to numeric id)
router.db._.id = 'id';

server.use(router);

const PORT = 3000;
const os = require('os');

// Get local IP for LAN access
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
