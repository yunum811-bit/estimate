// ==================== API Configuration ====================
var API_URL = window.location.origin;

// ==================== Data Store ====================
const Store = {
    // Users: admin, md, managers, employees
    users: [],
    questions: [],
    evaluations: [],
    gradeRules: [],

    // Load all data from server
    async loadAll() {
        try {
            var res = await Promise.all([
                fetch(API_URL + '/users').then(function(r){return r.json();}),
                fetch(API_URL + '/questions').then(function(r){return r.json();}),
                fetch(API_URL + '/evaluations').then(function(r){return r.json();}),
                fetch(API_URL + '/gradeRules').then(function(r){return r.json();})
            ]);
            this.users = res[0];
            this.questions = res[1];
            this.evaluations = res[2];
            this.gradeRules = res[3];
        } catch(e) {
            console.warn('Server not available, using localStorage fallback');
            this.users = JSON.parse(localStorage.getItem('users')) || this._defaultUsers();
            this.questions = JSON.parse(localStorage.getItem('questions')) || [];
            this.evaluations = JSON.parse(localStorage.getItem('evaluations')) || [];
            this.gradeRules = JSON.parse(localStorage.getItem('gradeRules')) || this._defaultGrades();
        }
    },

    // Save all data to server (full replace)
    async save() {
        // Also save to localStorage as backup
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('questions', JSON.stringify(this.questions));
        localStorage.setItem('evaluations', JSON.stringify(this.evaluations));
        localStorage.setItem('gradeRules', JSON.stringify(this.gradeRules));

        try {
            // Sync each collection to server
            await this._syncCollection('users', this.users);
            await this._syncCollection('questions', this.questions);
            await this._syncCollection('evaluations', this.evaluations);
            await this._syncCollection('gradeRules', this.gradeRules);
        } catch(e) {
            console.warn('Could not save to server:', e.message);
        }
    },

    async _syncCollection(name, data) {
        // Get current server data
        var serverData = await fetch(API_URL + '/' + name).then(function(r){return r.json();});
        var serverIds = serverData.map(function(item){return item.id;});
        var localIds = data.map(function(item){return item.id;});

        // Delete items not in local
        for (var i=0; i<serverData.length; i++) {
            if (localIds.indexOf(serverData[i].id) === -1) {
                await fetch(API_URL + '/' + name + '/' + serverData[i].id, {method:'DELETE'});
            }
        }
        // Add or update items
        for (var j=0; j<data.length; j++) {
            if (serverIds.indexOf(data[j].id) === -1) {
                await fetch(API_URL + '/' + name, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data[j])});
            } else {
                await fetch(API_URL + '/' + name + '/' + data[j].id, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data[j])});
            }
        }
    },

    _defaultUsers() {
        return [
            { id: 'admin', name: 'ผู้ดูแลระบบ', role: 'admin', password: '1234' },
            { id: 'md', name: 'คุณประเสริฐ (MD)', role: 'md', password: '1234' },
            { id: 'MGR001', name: 'สุภาพร หัวหน้า IT', role: 'manager', department: 'IT', password: '1234' },
            { id: 'MGR002', name: 'วรรณา หัวหน้า HR', role: 'manager', department: 'HR', password: '1234' },
            { id: 'MGR003', name: 'ประยุทธ หัวหน้า Marketing', role: 'manager', department: 'Marketing', password: '1234' },
            { id: 'EMP001', name: 'สมชาย ใจดี', role: 'employee', department: 'IT', position: 'โปรแกรมเมอร์', password: '1234' },
            { id: 'EMP002', name: 'สมหญิง รักงาน', role: 'employee', department: 'HR', position: 'เจ้าหน้าที่ HR', password: '1234' },
            { id: 'EMP003', name: 'วิชัย เก่งกาจ', role: 'employee', department: 'Marketing', position: 'นักการตลาด', password: '1234' },
            { id: 'EMP004', name: 'นภา สว่างจิต', role: 'employee', department: 'IT', position: 'นักพัฒนา', password: '1234' },
            { id: 'EMP005', name: 'ธนา พัฒนดี', role: 'employee', department: 'HR', position: 'เจ้าหน้าที่สรรหา', password: '1234' }
        ];
    },

    _defaultGrades() {
        return [
            { id: '1', grade: 'A', label: 'ดีเยี่ยม', min: 4.5, max: 5.0, color: '#43a047' },
            { id: '2', grade: 'B+', label: 'ดีมาก', min: 4.0, max: 4.49, color: '#66bb6a' },
            { id: '3', grade: 'B', label: 'ดี', min: 3.5, max: 3.99, color: '#7cb342' },
            { id: '4', grade: 'C+', label: 'ค่อนข้างดี', min: 3.0, max: 3.49, color: '#fdd835' },
            { id: '5', grade: 'C', label: 'ปานกลาง', min: 2.5, max: 2.99, color: '#ffb300' },
            { id: '6', grade: 'D', label: 'ต้องปรับปรุง', min: 1.5, max: 2.49, color: '#fb8c00' },
            { id: '7', grade: 'F', label: 'ไม่ผ่าน', min: 0, max: 1.49, color: '#e53935' }
        ];
    },

    getNextId(prefix) {
        var ids = this.users.filter(function(u) { return u.id.startsWith(prefix); })
            .map(function(u) { return parseInt(u.id.replace(prefix, '')); });
        var maxId = ids.length > 0 ? Math.max.apply(null, ids) : 0;
        return prefix + String(maxId + 1).padStart(3, '0');
    },

    getEmployees() { return this.users.filter(function(u) { return u.role === 'employee'; }); },
    getManagers() { return this.users.filter(function(u) { return u.role === 'manager'; }); },

    getQuestionsForEmployee(empId) {
        return this.questions.filter(function(q) { return q.target === 'all' || q.target === empId; });
    },

    getGrade(avgScore) {
        if (avgScore === null || avgScore === undefined || isNaN(avgScore)) return { grade: '-', label: 'ไม่มีข้อมูล', color: '#999' };
        var rule = this.gradeRules.find(function(r) { return avgScore >= r.min && avgScore <= r.max; });
        return rule || { grade: '-', label: 'ไม่อยู่ในเกณฑ์', color: '#999' };
    },

    getManagerForDept(dept) {
        return this.users.find(function(u) { return u.role === 'manager' && u.department === dept; });
    }
};

// ==================== App Controller ====================
var App = {
    currentUser: null,

    init: async function() {
        await Store.loadAll();
        this.bindLoginEvents();
        this.checkAuth();
    },

    bindLoginEvents: function() {
        document.getElementById('login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            App.login();
        });
        document.getElementById('logout-btn').addEventListener('click', function() { App.logout(); });
    },

    checkAuth: function() {
        var user = sessionStorage.getItem('currentUser');
        if (user) { this.currentUser = JSON.parse(user); this.showMainApp(); }
    },

    login: function() {
        var username = document.getElementById('username').value.trim();
        var password = document.getElementById('password').value;
        var user = Store.users.find(function(u) {
            return (u.id.toLowerCase() === username.toLowerCase() || u.name === username) && (u.password || '1234') === password;
        });
        if (user) {
            this.currentUser = user;
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.showMainApp();
            showToast('เข้าสู่ระบบสำเร็จ (' + user.name + ')', 'success');
        } else {
            showToast('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
        }
    },

    logout: function() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        document.getElementById('login-page').classList.add('active');
        document.getElementById('main-app').classList.remove('active');
    },

    showMainApp: function() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        document.getElementById('nav-username').textContent = this.currentUser.name;
        var roleLabels = { admin: 'Admin', md: 'MD', manager: 'หัวหน้าแผนก', employee: 'พนักงาน' };
        document.getElementById('nav-role').textContent = roleLabels[this.currentUser.role] || '';
        this.buildNav();
        this.navigateTo(this.getDefaultPage());
    },

    getDefaultPage: function() {
        switch (this.currentUser.role) {
            case 'admin': return 'admin-dashboard';
            case 'md': return 'md-dashboard';
            case 'manager': return 'mgr-dashboard';
            case 'employee': return 'emp-evaluate';
        }
    },

    buildNav: function() {
        var navLinks = document.getElementById('nav-links');
        var links = [];
        var role = this.currentUser.role;
        if (role === 'admin') {
            links = [
                { page: 'admin-dashboard', label: 'แดชบอร์ด' },
                { page: 'admin-users', label: 'จัดการผู้ใช้' },
                { page: 'admin-questions', label: 'จัดการคำถาม' },
                { page: 'admin-grading', label: 'ตั้งค่าเกรด' }
            ];
        } else if (role === 'md') {
            links = [
                { page: 'md-dashboard', label: 'แดชบอร์ด' },
                { page: 'md-approve', label: 'อนุมัติประเมิน' },
                { page: 'md-results', label: 'ผลประเมิน' }
            ];
        } else if (role === 'manager') {
            links = [
                { page: 'mgr-dashboard', label: 'แดชบอร์ด' },
                { page: 'mgr-evaluate', label: 'ทำแบบประเมิน' },
                { page: 'mgr-review', label: 'ตรวจสอบ/ส่ง MD' },
                { page: 'mgr-results', label: 'ผลประเมินแผนก' }
            ];
        } else {
            links = [
                { page: 'emp-evaluate', label: 'ทำแบบประเมิน' },
                { page: 'emp-results', label: 'ผลประเมินของฉัน' }
            ];
        }
        navLinks.innerHTML = links.map(function(l) {
            return '<a href="#" class="nav-link" data-page="' + l.page + '">' + l.label + '</a>';
        }).join('');
        navLinks.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                App.navigateTo(e.target.dataset.page);
            });
        });
    },

    navigateTo: async function(page) {
        document.querySelectorAll('.nav-link').forEach(function(l) {
            l.classList.toggle('active', l.dataset.page === page);
        });
        this.currentPage = page;
        // Reload data from server to see changes from other users
        try { await Store.loadAll(); } catch(e) {}
        this.render(page);
    },

    // Render without reloading from server (used after local save)
    renderCurrent: function() {
        this.render(this.currentPage);
    },

    render: function(page) {
        var content = document.getElementById('main-content');
        switch (page) {
            case 'admin-dashboard': content.innerHTML = this.renderAdminDashboard(); break;
            case 'admin-users': content.innerHTML = this.renderMdUsers(); this.bindMdUsers(); break;
            case 'admin-questions': content.innerHTML = this.renderMdQuestions(); this.bindMdQuestions(); break;
            case 'admin-grading': content.innerHTML = this.renderAdminGrading(); this.bindMdGrading(); break;
            case 'md-dashboard': content.innerHTML = this.renderMdDashboard(); break;
            case 'md-approve': content.innerHTML = this.renderMdApprove(); this.bindMdApprove(); break;
            case 'md-results': content.innerHTML = this.renderMdResults(); break;
            case 'mgr-dashboard': content.innerHTML = this.renderMgrDashboard(); break;
            case 'mgr-evaluate': content.innerHTML = this.renderMgrEvaluate(); this.bindMgrEvaluate(); break;
            case 'mgr-review': content.innerHTML = this.renderMgrReview(); this.bindMgrReview(); break;
            case 'mgr-results': content.innerHTML = this.renderMgrResults(); break;
            case 'emp-evaluate': content.innerHTML = this.renderEmpEvaluate(); this.bindEmpEvaluate(); break;
            case 'emp-results': content.innerHTML = this.renderEmpResults(); break;
        }
    },

    // ==================== Admin: Dashboard ====================
    renderAdminDashboard: function() {
        var emps = Store.getEmployees();
        var mgrs = Store.getManagers();
        var totalQ = Store.questions.length;
        return '<div class="section active"><div class="container">' +
            '<h2 class="section-title">แดชบอร์ด Admin</h2>' +
            '<div class="workflow-info"><h4>📋 หน้าที่ของ Admin</h4><p>จัดการผู้ใช้, ตั้งคำถามประเมิน, กำหนดเกณฑ์ตัดเกรด (ไม่สามารถดูคะแนนประเมินได้)</p></div>' +
            '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon">👥</div><div class="stat-info"><h3>' + emps.length + '</h3><p>พนักงาน</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">👔</div><div class="stat-info"><h3>' + mgrs.length + '</h3><p>หัวหน้าแผนก</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">❓</div><div class="stat-info"><h3>' + totalQ + '</h3><p>คำถามทั้งหมด</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">📊</div><div class="stat-info"><h3>' + Store.gradeRules.length + '</h3><p>เกณฑ์ตัดเกรด</p></div></div>' +
            '</div></div></div>';
    },

    // ==================== Admin: Grading (no scores shown) ====================
    renderAdminGrading: function() {
        var html = '<div class="section active"><div class="container"><h2 class="section-title">⚙️ ตั้งค่าเกณฑ์ตัดเกรด</h2>';
        html += '<div class="grading-section"><h3>เกณฑ์ปัจจุบัน</h3><p class="section-desc">ระบบจะตัดเกรดอัตโนมัติตามคะแนนเฉลี่ย (เต็ม 5)</p><table class="data-table"><thead><tr><th>เกรด</th><th>ระดับ</th><th>ต่ำสุด</th><th>สูงสุด</th><th>สี</th><th>จัดการ</th></tr></thead><tbody>';
        Store.gradeRules.forEach(function(r, i) {
            html += '<tr><td><strong>'+r.grade+'</strong></td><td>'+r.label+'</td><td>'+r.min.toFixed(2)+'</td><td>'+r.max.toFixed(2)+'</td><td><span class="color-dot" style="background:'+r.color+'"></span></td><td class="actions"><button class="btn-edit" onclick="App.editGradeRule('+i+')">แก้ไข</button> <button class="btn-delete" onclick="App.deleteGradeRule('+i+')">ลบ</button></td></tr>';
        });
        html += '</tbody></table></div>';
        // Edit form (hidden by default)
        html += '<div id="gr-edit-section" class="grading-section" style="display:none;"><h3>✏️ แก้ไขเกณฑ์</h3><form id="gr-edit-form"><input type="hidden" id="gr-edit-idx"><div class="grade-form-row">' +
            '<div class="form-group"><label>เกรด</label><input type="text" id="gr-edit-grade" required></div>' +
            '<div class="form-group"><label>ระดับ</label><input type="text" id="gr-edit-label" required></div>' +
            '<div class="form-group"><label>ต่ำสุด</label><input type="number" id="gr-edit-min" step="0.01" min="0" max="5" required></div>' +
            '<div class="form-group"><label>สูงสุด</label><input type="number" id="gr-edit-max" step="0.01" min="0" max="5" required></div>' +
            '<div class="form-group"><label>สี</label><input type="color" id="gr-edit-color"></div>' +
            '</div><div class="form-actions"><button type="submit" class="btn btn-primary">บันทึกการแก้ไข</button><button type="button" class="btn btn-secondary" onclick="document.getElementById(\'gr-edit-section\').style.display=\'none\'">ยกเลิก</button></div></form></div>';
        // Add form
        html += '<div class="grading-section"><h3>เพิ่มเกณฑ์ใหม่</h3><form id="gr-form"><div class="grade-form-row">' +
            '<div class="form-group"><label>เกรด</label><input type="text" id="gr-grade" required placeholder="A"></div>' +
            '<div class="form-group"><label>ระดับ</label><input type="text" id="gr-label" required placeholder="ดีเยี่ยม"></div>' +
            '<div class="form-group"><label>ต่ำสุด</label><input type="number" id="gr-min" step="0.01" min="0" max="5" required></div>' +
            '<div class="form-group"><label>สูงสุด</label><input type="number" id="gr-max" step="0.01" min="0" max="5" required></div>' +
            '<div class="form-group"><label>สี</label><input type="color" id="gr-color" value="#3f51b5"></div>' +
            '</div><button type="submit" class="btn btn-primary">เพิ่ม</button></form></div>';
        html += '</div></div>';
        return html;
    },

    // ==================== MD: Dashboard ====================
    renderMdDashboard: function() {
        var emps = Store.getEmployees();
        var totalEvals = Store.evaluations.length;
        var pending = Store.evaluations.filter(function(e) { return e.status === 'reviewed'; }).length;
        var approved = Store.evaluations.filter(function(e) { return e.status === 'approved'; }).length;
        var ratingEvals = Store.evaluations.filter(function(e) { return e.status === 'approved' && e.type === 'rating'; });
        var avg = ratingEvals.length > 0 ? (ratingEvals.reduce(function(s,e){return s+e.score;},0)/ratingEvals.length).toFixed(1) : '-';

        return '<div class="section active"><div class="container">' +
            '<h2 class="section-title">แดชบอร์ด MD</h2>' +
            '<div class="workflow-info"><h4>📋 หน้าที่ของ MD</h4><p>ตรวจสอบผลประเมินที่หัวหน้าแผนกส่งมา แล้วอนุมัติหรือส่งกลับ</p><div class="workflow-steps">' +
            '<div class="step"><span class="step-num">1</span><span>พนักงานทำแบบประเมิน</span></div>' +
            '<div class="step-arrow">→</div>' +
            '<div class="step"><span class="step-num">2</span><span>หัวหน้าแผนกตรวจสอบ</span></div>' +
            '<div class="step-arrow">→</div>' +
            '<div class="step"><span class="step-num">3</span><span>MD อนุมัติ + ตัดเกรด</span></div>' +
            '</div></div>' +
            '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon">👥</div><div class="stat-info"><h3>' + emps.length + '</h3><p>พนักงาน</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">📝</div><div class="stat-info"><h3>' + totalEvals + '</h3><p>ประเมินทั้งหมด</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">⏳</div><div class="stat-info"><h3>' + pending + '</h3><p>รออนุมัติ</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">✅</div><div class="stat-info"><h3>' + approved + '</h3><p>อนุมัติแล้ว</p></div></div>' +
            '</div></div></div>';
    },

    // ==================== MD: Users ====================
    renderMdUsers: function() {
        var html = '<div class="section active"><div class="container">' +
            '<div class="section-header"><h2 class="section-title">จัดการผู้ใช้</h2>' +
            '<button id="add-user-btn" class="btn btn-primary">+ เพิ่มผู้ใช้</button></div>' +
            '<div class="table-container"><table class="data-table"><thead><tr>' +
            '<th>รหัส</th><th>ชื่อ</th><th>บทบาท</th><th>แผนก</th><th>รหัสผ่าน</th><th>จัดการ</th>' +
            '</tr></thead><tbody>';
        Store.users.forEach(function(u) {
            var roleLabel = {md:'MD',manager:'หัวหน้าแผนก',employee:'พนักงาน'}[u.role]||u.role;
            html += '<tr><td>' + u.id + '</td><td>' + u.name + '</td><td><span class="badge badge-role-'+u.role+'">' + roleLabel + '</span></td>' +
                '<td>' + (u.department||'-') + '</td><td><code>' + (u.password||'1234') + '</code></td>' +
                '<td class="actions"><button class="btn-delete" onclick="App.deleteUser(\''+u.id+'\')">ลบ</button></td></tr>';
        });
        html += '</tbody></table></div>';
        // Add user form
        html += '<div id="add-user-form-container" class="modal-inline" style="display:none;">' +
            '<h3>เพิ่มผู้ใช้ใหม่</h3><form id="add-user-form">' +
            '<div class="grade-form-row">' +
            '<div class="form-group"><label>ชื่อ</label><input type="text" id="nu-name" required></div>' +
            '<div class="form-group"><label>บทบาท</label><select id="nu-role" required><option value="employee">พนักงาน</option><option value="manager">หัวหน้าแผนก</option></select></div>' +
            '<div class="form-group"><label>แผนก</label><select id="nu-dept"><option value="IT">IT</option><option value="HR">HR</option><option value="Marketing">Marketing</option><option value="Finance">Finance</option><option value="Sales">Sales</option></select></div>' +
            '<div class="form-group"><label>ตำแหน่ง</label><input type="text" id="nu-position" placeholder="ตำแหน่ง"></div>' +
            '<div class="form-group"><label>รหัสผ่าน</label><input type="text" id="nu-password" value="1234"></div>' +
            '</div><button type="submit" class="btn btn-primary">บันทึก</button></form></div>';
        html += '</div></div>';
        return html;
    },

    bindMdUsers: function() {
        document.getElementById('add-user-btn').addEventListener('click', function() {
            var f = document.getElementById('add-user-form-container');
            f.style.display = f.style.display === 'none' ? 'block' : 'none';
        });
        document.getElementById('add-user-form').addEventListener('submit', function(e) {
            e.preventDefault(); App.saveUser();
        });
    },

    saveUser: async function() {
        var role = document.getElementById('nu-role').value;
        var prefix = role === 'manager' ? 'MGR' : 'EMP';
        var user = {
            id: Store.getNextId(prefix),
            name: document.getElementById('nu-name').value,
            role: role,
            department: document.getElementById('nu-dept').value,
            position: document.getElementById('nu-position').value || '',
            password: document.getElementById('nu-password').value || '1234'
        };
        Store.users.push(user);
        await Store.save();
        showToast('เพิ่มผู้ใช้สำเร็จ (' + user.id + ')', 'success');
        this.render('admin-users');
        this.bindMdUsers();
    },

    deleteUser: async function(id) {
        if (id === 'md' || id === 'admin') { showToast('ไม่สามารถลบผู้ใช้นี้ได้', 'error'); return; }
        if (!confirm('ต้องการลบผู้ใช้ ' + id + ' หรือไม่?')) return;
        Store.users = Store.users.filter(function(u) { return u.id !== id; });
        Store.evaluations = Store.evaluations.filter(function(e) { return e.employeeId !== id; });
        await Store.save();
        this.render('admin-users');
        this.bindMdUsers();
        showToast('ลบสำเร็จ', 'info');
    },

    // ==================== MD: Questions ====================
    renderMdQuestions: function() {
        var emps = Store.getEmployees();
        var html = '<div class="section active"><div class="container">' +
            '<div class="section-header"><h2 class="section-title">จัดการคำถามประเมิน</h2>' +
            '<button id="add-q-btn" class="btn btn-primary">+ เพิ่มคำถาม</button></div>' +
            '<p class="section-desc">ตั้งคำถามแบบ Google Form — รองรับหลายประเภทคำตอบ</p>';
        // Add form (always visible)
        html += '<div id="add-q-form-wrap" class="modal-inline">' +
            '<h3>เพิ่มคำถามใหม่</h3><form id="add-q-form">' +
            '<div class="form-group"><label>คำถาม <span class="required">*</span></label><textarea id="q-text" rows="2" required placeholder="พิมพ์คำถาม..."></textarea></div>' +
            '<div class="form-group"><label>คำอธิบาย (ถ้ามี)</label><input type="text" id="q-desc" placeholder="คำอธิบายเพิ่มเติม..."></div>' +
            '<div class="grade-form-row">' +
            '<div class="form-group"><label>ประเภทคำตอบ</label><select id="q-type" onchange="App.onQuestionTypeChange()">' +
            '<option value="rating">⭐ ให้คะแนน 1-5</option>' +
            '<option value="text">📝 ข้อความสั้น</option>' +
            '<option value="paragraph">📄 ข้อความยาว</option>' +
            '<option value="multiple_choice">🔘 เลือกตอบ (เลือกได้ 1 ข้อ)</option>' +
            '<option value="checkbox">☑️ ช่องทำเครื่องหมาย (เลือกได้หลายข้อ)</option>' +
            '<option value="dropdown">📋 Dropdown</option>' +
            '</select></div>' +
            '<div class="form-group"><label>กำหนดให้</label><select id="q-target"><option value="all">ทุกคน</option>';
        emps.forEach(function(e) { html += '<option value="'+e.id+'">'+e.name+'</option>'; });
        html += '</select></div>' +
            '<div class="form-group"><label>จำเป็นต้องตอบ</label><select id="q-required"><option value="yes">ใช่</option><option value="no">ไม่</option></select></div>' +
            '</div>' +
            '<div id="q-options-section" style="display:none;"><div class="form-group"><label>ตัวเลือก (พิมพ์แต่ละข้อแล้ว Enter หรือคั่นด้วยบรรทัดใหม่)</label>' +
            '<textarea id="q-options" rows="4" placeholder="ตัวเลือกที่ 1&#10;ตัวเลือกที่ 2&#10;ตัวเลือกที่ 3"></textarea></div></div>' +
            '<button type="submit" class="btn btn-primary">เพิ่มคำถาม</button></form></div>';
        // List
        if (Store.questions.length === 0) {
            html += '<p class="empty-state">ยังไม่มีคำถาม</p>';
        } else {
            html += '<div class="questions-list">';
            Store.questions.forEach(function(q, idx) {
                var target = q.target === 'all' ? '👥 ทุกคน' : (Store.users.find(function(u){return u.id===q.target;})||{}).name || q.target;
                var typeLabels = {rating:'⭐ คะแนน 1-5', text:'📝 ข้อความสั้น', paragraph:'📄 ข้อความยาว', multiple_choice:'🔘 เลือกตอบ', checkbox:'☑️ Checkbox', dropdown:'📋 Dropdown'};
                var typeL = typeLabels[q.type] || q.type;
                html += '<div class="question-card"><div class="question-card-body">';
                html += '<div class="question-number">' + (idx+1) + '</div>';
                html += '<div class="question-content"><p class="question-text">'+q.text+'</p>';
                if (q.description) html += '<p class="question-desc">'+q.description+'</p>';
                html += '<div class="question-meta"><span class="badge badge-info">'+typeL+'</span><span class="badge badge-target">'+target+'</span>';
                if (q.required === 'yes') html += '<span class="badge badge-required">จำเป็น</span>';
                html += '</div>';
                if (q.options && q.options.length > 0) {
                    html += '<div class="question-options-preview">';
                    q.options.forEach(function(opt) {
                        var icon = q.type === 'checkbox' ? '☐' : (q.type === 'multiple_choice' ? '○' : '•');
                        html += '<span class="option-preview">'+icon+' '+opt+'</span>';
                    });
                    html += '</div>';
                }
                html += '</div></div>';
                html += '<button class="btn-delete" onclick="App.deleteQuestion(\''+q.id+'\')">ลบ</button></div>';
            });
            html += '</div>';
        }
        html += '</div></div>';
        return html;
    },

    onQuestionTypeChange: function() {
        var type = document.getElementById('q-type').value;
        var optSection = document.getElementById('q-options-section');
        if (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown') {
            optSection.style.display = 'block';
        } else {
            optSection.style.display = 'none';
        }
    },

    bindMdQuestions: function() {
        document.getElementById('add-q-btn').addEventListener('click', function() {
            document.getElementById('add-q-form-wrap').scrollIntoView({behavior:'smooth'});
            document.getElementById('q-text').focus();
        });
        document.getElementById('add-q-form').addEventListener('submit', function(e) {
            e.preventDefault(); App.saveQuestion();
        });
    },

    saveQuestion: async function() {
        var type = document.getElementById('q-type').value;
        var options = [];
        if (type === 'multiple_choice' || type === 'checkbox' || type === 'dropdown') {
            var raw = document.getElementById('q-options').value.trim();
            options = raw.split('\n').map(function(s){return s.trim();}).filter(function(s){return s.length > 0;});
            if (options.length < 2) { showToast('กรุณาใส่ตัวเลือกอย่างน้อย 2 ข้อ','error'); return; }
        }
        Store.questions.push({
            id: 'Q' + Date.now(),
            text: document.getElementById('q-text').value,
            description: document.getElementById('q-desc').value || '',
            type: type,
            options: options,
            target: document.getElementById('q-target').value,
            required: document.getElementById('q-required').value
        });
        await Store.save();
        showToast('เพิ่มคำถามสำเร็จ', 'success');
        this.render('admin-questions'); this.bindMdQuestions();
    },

    deleteQuestion: async function(id) {
        if (!confirm('ลบคำถามนี้?')) return;
        Store.questions = Store.questions.filter(function(q){return q.id!==id;});
        Store.evaluations = Store.evaluations.filter(function(e){return e.questionId!==id;});
        await Store.save();
        this.render('admin-questions'); this.bindMdQuestions();
        showToast('ลบคำถามสำเร็จ', 'info');
    },

    // ==================== MD: Grading ====================
    renderMdGrading: function() {
        var html = '<div class="section active"><div class="container"><h2 class="section-title">⚙️ ตั้งค่าเกณฑ์ตัดเกรด</h2>';
        html += '<div class="grading-section"><h3>เกณฑ์ปัจจุบัน</h3><table class="data-table"><thead><tr><th>เกรด</th><th>ระดับ</th><th>ต่ำสุด</th><th>สูงสุด</th><th>สี</th><th>ลบ</th></tr></thead><tbody>';
        Store.gradeRules.forEach(function(r, i) {
            html += '<tr><td><strong>'+r.grade+'</strong></td><td>'+r.label+'</td><td>'+r.min.toFixed(2)+'</td><td>'+r.max.toFixed(2)+'</td><td><span class="color-dot" style="background:'+r.color+'"></span></td><td><button class="btn-delete" onclick="App.deleteGradeRule('+i+')">ลบ</button></td></tr>';
        });
        html += '</tbody></table></div>';
        html += '<div class="grading-section"><h3>เพิ่มเกณฑ์</h3><form id="gr-form"><div class="grade-form-row">' +
            '<div class="form-group"><label>เกรด</label><input type="text" id="gr-grade" required placeholder="A"></div>' +
            '<div class="form-group"><label>ระดับ</label><input type="text" id="gr-label" required placeholder="ดีเยี่ยม"></div>' +
            '<div class="form-group"><label>ต่ำสุด</label><input type="number" id="gr-min" step="0.01" min="0" max="5" required></div>' +
            '<div class="form-group"><label>สูงสุด</label><input type="number" id="gr-max" step="0.01" min="0" max="5" required></div>' +
            '<div class="form-group"><label>สี</label><input type="color" id="gr-color" value="#3f51b5"></div>' +
            '</div><button type="submit" class="btn btn-primary">เพิ่ม</button></form></div>';
        // Summary
        html += '<div class="grading-section"><h3>สรุปเกรดพนักงาน (เฉพาะที่อนุมัติแล้ว)</h3><table class="data-table"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>แผนก</th><th>คะแนนเฉลี่ย</th><th>เกรด</th></tr></thead><tbody>';
        Store.getEmployees().forEach(function(emp) {
            var ratings = Store.evaluations.filter(function(e){return e.employeeId===emp.id && e.type==='rating' && e.status==='approved';});
            var avg = ratings.length > 0 ? ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length : null;
            var g = Store.getGrade(avg);
            html += '<tr><td>'+emp.id+'</td><td>'+emp.name+'</td><td>'+(emp.department||'-')+'</td><td>'+(avg!==null?avg.toFixed(2):'-')+'</td><td><span class="grade-badge-sm" style="background:'+g.color+'">'+g.grade+'</span> '+g.label+'</td></tr>';
        });
        html += '</tbody></table></div></div></div>';
        return html;
    },

    bindMdGrading: function() {
        document.getElementById('gr-form').addEventListener('submit', function(e) {
            e.preventDefault(); App.saveGradeRule();
        });
        var editForm = document.getElementById('gr-edit-form');
        if (editForm) {
            editForm.addEventListener('submit', function(e) {
                e.preventDefault(); App.updateGradeRule();
            });
        }
    },

    editGradeRule: function(idx) {
        var rule = Store.gradeRules[idx];
        if (!rule) return;
        document.getElementById('gr-edit-section').style.display = 'block';
        document.getElementById('gr-edit-idx').value = idx;
        document.getElementById('gr-edit-grade').value = rule.grade;
        document.getElementById('gr-edit-label').value = rule.label;
        document.getElementById('gr-edit-min').value = rule.min;
        document.getElementById('gr-edit-max').value = rule.max;
        document.getElementById('gr-edit-color').value = rule.color;
        // Scroll to edit form
        document.getElementById('gr-edit-section').scrollIntoView({behavior:'smooth'});
    },

    updateGradeRule: function() {
        var idx = parseInt(document.getElementById('gr-edit-idx').value);
        var min = parseFloat(document.getElementById('gr-edit-min').value);
        var max = parseFloat(document.getElementById('gr-edit-max').value);
        if (min > max) { showToast('ต่ำสุดต้องน้อยกว่าสูงสุด','error'); return; }
        var rule = Store.gradeRules[idx];
        rule.grade = document.getElementById('gr-edit-grade').value;
        rule.label = document.getElementById('gr-edit-label').value;
        rule.min = min;
        rule.max = max;
        rule.color = document.getElementById('gr-edit-color').value;
        Store.gradeRules.sort(function(a,b){return b.min-a.min;});
        Store.save();
        showToast('แก้ไขเกณฑ์สำเร็จ','success');
        this.navigateTo(this.currentPage);
    },

    saveGradeRule: function() {
        var min = parseFloat(document.getElementById('gr-min').value);
        var max = parseFloat(document.getElementById('gr-max').value);
        if (min > max) { showToast('ต่ำสุดต้องน้อยกว่าสูงสุด','error'); return; }
        Store.gradeRules.push({ id: 'GR'+Date.now(), grade: document.getElementById('gr-grade').value, label: document.getElementById('gr-label').value, min:min, max:max, color: document.getElementById('gr-color').value });
        Store.gradeRules.sort(function(a,b){return b.min-a.min;});
        Store.save();
        this.navigateTo(this.currentPage);
        showToast('เพิ่มเกณฑ์สำเร็จ','success');
    },

    deleteGradeRule: function(idx) {
        if (!confirm('ลบเกณฑ์นี้?')) return;
        Store.gradeRules.splice(idx,1); Store.save();
        this.navigateTo(this.currentPage);
    },

    // ==================== MD: Approve ====================
    renderMdApprove: function() {
        var pending = Store.evaluations.filter(function(e){return e.status==='reviewed';});
        var html = '<div class="section active"><div class="container"><h2 class="section-title">📋 อนุมัติผลประเมิน</h2>';
        html += '<p class="section-desc">รายการที่หัวหน้าแผนกตรวจสอบแล้ว รอ MD อนุมัติ</p>';
        if (pending.length === 0) {
            html += '<p class="empty-state">ไม่มีรายการรออนุมัติ</p>';
        } else {
            // Group by employee
            var grouped = {};
            pending.forEach(function(e) { if(!grouped[e.employeeId]) grouped[e.employeeId]=[]; grouped[e.employeeId].push(e); });
            Object.keys(grouped).forEach(function(empId) {
                var emp = Store.users.find(function(u){return u.id===empId;});
                var evals = grouped[empId];
                var ratings = evals.filter(function(e){return e.type==='rating';});
                var avg = ratings.length>0 ? ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length : null;
                var g = Store.getGrade(avg);
                html += '<div class="result-card"><div class="result-card-header"><div><h4>'+(emp?emp.name:empId)+'</h4><small>'+(emp?emp.department:'')+'</small></div>';
                html += '<div class="score-grade-box"><div class="score">'+(avg!==null?avg.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
                html += '<div class="result-answers">';
                evals.forEach(function(ev) {
                    var q = Store.questions.find(function(q){return q.id===ev.questionId;});
                    var ans = ev.type==='rating' ? '<span class="badge badge-evaluated">'+ev.score+'/5</span>' : '<em>'+ev.answer+'</em>';
                    html += '<div class="result-answer-item"><span class="q-label">'+(q?q.text:'ลบแล้ว')+'</span>'+ans+'</div>';
                });
                html += '</div>';
                if (evals[0].managerComment) html += '<p class="mgr-comment"><strong>ความเห็นหัวหน้า:</strong> '+evals[0].managerComment+'</p>';
                html += '<div class="form-actions"><button class="btn btn-success approve-btn" data-emp="'+empId+'">✅ อนุมัติ</button><button class="btn btn-danger reject-btn" data-emp="'+empId+'">❌ ส่งกลับ</button></div></div>';
            });
        }
        html += '</div></div>';
        return html;
    },

    bindMdApprove: function() {
        document.querySelectorAll('.approve-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { App.approveEmployee(btn.dataset.emp); });
        });
        document.querySelectorAll('.reject-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { App.rejectEmployee(btn.dataset.emp); });
        });
    },

    approveEmployee: function(empId) {
        Store.evaluations.forEach(function(e) {
            if (e.employeeId === empId && e.status === 'reviewed') e.status = 'approved';
        });
        Store.save();
        showToast('อนุมัติสำเร็จ','success');
        this.render('md-approve'); this.bindMdApprove();
    },

    rejectEmployee: function(empId) {
        var reason = prompt('เหตุผลที่ส่งกลับ:');
        if (reason === null) return;
        Store.evaluations.forEach(function(e) {
            if (e.employeeId === empId && e.status === 'reviewed') { e.status = 'submitted'; e.rejectReason = reason; }
        });
        Store.save();
        showToast('ส่งกลับให้หัวหน้าแผนกแล้ว','info');
        this.render('md-approve'); this.bindMdApprove();
    },

    // ==================== MD: Results ====================
    renderMdResults: function() {
        var approved = Store.evaluations.filter(function(e){return e.status==='approved';});
        var html = '<div class="section active"><div class="container"><h2 class="section-title">📊 ผลประเมิน (อนุมัติแล้ว)</h2>';
        if (approved.length === 0) { html += '<p class="empty-state">ยังไม่มีผลที่อนุมัติ</p>'; }
        else {
            var grouped = {};
            approved.forEach(function(e){if(!grouped[e.employeeId])grouped[e.employeeId]=[];grouped[e.employeeId].push(e);});
            html += '<div class="results-grid">';
            Object.keys(grouped).forEach(function(empId) {
                var emp = Store.users.find(function(u){return u.id===empId;});
                var evals = grouped[empId];
                var ratings = evals.filter(function(e){return e.type==='rating';});
                var avg = ratings.length>0?ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length:null;
                var g = Store.getGrade(avg);
                html += '<div class="result-card"><div class="result-card-header"><div><h4>'+(emp?emp.name:empId)+'</h4><small>'+(emp?(emp.department+' - '+(emp.position||'')):'')+'</small></div>';
                html += '<div class="score-grade-box"><div class="score">'+(avg!==null?avg.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
                if(avg!==null){var pct=(avg/5)*100;html+='<div class="score-bar"><div class="score-bar-fill" style="width:'+pct+'%;background:'+g.color+'"></div></div><p class="grade-label" style="color:'+g.color+'">'+g.label+'</p>';}
                html += '<div class="result-answers">';
                evals.forEach(function(ev){var q=Store.questions.find(function(q){return q.id===ev.questionId;});var ans=ev.type==='rating'?'<span class="badge badge-evaluated">'+ev.score+'/5</span>':'<em>'+ev.answer+'</em>';html+='<div class="result-answer-item"><span class="q-label">'+(q?q.text:'ลบแล้ว')+'</span>'+ans+'</div>';});
                html += '</div></div>';
            });
            html += '</div>';
        }
        html += '</div></div>';
        return html;
    },

    // ==================== Manager: Dashboard ====================
    renderMgrDashboard: function() {
        var dept = this.currentUser.department;
        var myEmps = Store.getEmployees().filter(function(e){return e.department===dept;});
        var submitted = Store.evaluations.filter(function(e){return e.status==='submitted' && myEmps.some(function(emp){return emp.id===e.employeeId;});}).length;
        var reviewed = Store.evaluations.filter(function(e){return e.status==='reviewed' && myEmps.some(function(emp){return emp.id===e.employeeId;});}).length;
        var approved = Store.evaluations.filter(function(e){return e.status==='approved' && myEmps.some(function(emp){return emp.id===e.employeeId;});}).length;

        return '<div class="section active"><div class="container">' +
            '<h2 class="section-title">แดชบอร์ด หัวหน้าแผนก ' + dept + '</h2>' +
            '<div class="workflow-info"><h4>📋 หน้าที่ของคุณ</h4><p>ตรวจสอบแบบประเมินจากพนักงานในแผนก แล้วส่งต่อให้ MD อนุมัติ</p></div>' +
            '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon">👥</div><div class="stat-info"><h3>'+myEmps.length+'</h3><p>พนักงานในแผนก</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">📥</div><div class="stat-info"><h3>'+submitted+'</h3><p>รอตรวจสอบ</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">📤</div><div class="stat-info"><h3>'+reviewed+'</h3><p>ส่ง MD แล้ว</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">✅</div><div class="stat-info"><h3>'+approved+'</h3><p>อนุมัติแล้ว</p></div></div>' +
            '</div></div></div>';
    },

    // ==================== Manager: Evaluate (ทำแบบประเมินพนักงานในแผนก) ====================
    renderMgrEvaluate: function() {
        var dept = this.currentUser.department;
        var mgrId = this.currentUser.id;
        var myEmps = Store.getEmployees().filter(function(e){return e.department===dept;});

        var html = '<div class="section active"><div class="container"><h2 class="section-title">📝 ประเมินพนักงานในแผนก ' + dept + '</h2>';
        html += '<p class="section-desc">เลือกพนักงานที่ต้องการประเมิน แล้วให้คะแนนตามคำถามที่กำหนด</p>';

        if (myEmps.length === 0) {
            html += '<p class="empty-state">ไม่มีพนักงานในแผนก</p>';
        } else {
            html += '<div class="form-group"><label>เลือกพนักงาน</label><select id="mgr-eval-emp">';
            html += '<option value="">-- เลือกพนักงาน --</option>';
            myEmps.forEach(function(emp) {
                html += '<option value="'+emp.id+'">'+emp.name+' ('+emp.id+')</option>';
            });
            html += '</select></div>';
            html += '<div id="mgr-eval-questions"></div>';
        }

        html += '</div></div>';
        return html;
    },

    bindMgrEvaluate: function() {
        var select = document.getElementById('mgr-eval-emp');
        if (!select) return;
        select.addEventListener('change', function() {
            App.renderMgrEvalQuestions(select.value);
        });
    },

    renderMgrEvalQuestions: function(empId) {
        var container = document.getElementById('mgr-eval-questions');
        if (!empId) { container.innerHTML = ''; return; }

        var mgrId = this.currentUser.id;
        var questions = Store.getQuestionsForEmployee(empId);
        // Filter out questions already answered by this manager for this employee
        var answeredIds = Store.evaluations.filter(function(e){
            return e.employeeId === empId && e.evaluatedBy === mgrId;
        }).map(function(e){return e.questionId;});
        var unanswered = questions.filter(function(q){return answeredIds.indexOf(q.id)===-1;});

        if (unanswered.length === 0) {
            container.innerHTML = '<div class="empty-state" style="margin-top:1rem;">✅ คุณประเมินพนักงานคนนี้ครบทุกข้อแล้ว</div>';
            return;
        }

        var emp = Store.users.find(function(u){return u.id===empId;});
        var html = '<div style="margin-top:1rem;"><h3>ประเมิน: '+(emp?emp.name:empId)+'</h3>';
        html += '<p style="color:#666;margin-bottom:1rem;">มี '+unanswered.length+' คำถามที่ต้องประเมิน</p>';
        html += '<form id="mgr-eval-form" class="eval-categories">';

        unanswered.forEach(function(q, idx) {
            html += '<div class="eval-category"><h3>คำถามที่ '+(idx+1)+'</h3><p class="question-text-display">'+q.text+'</p>';
            if (q.type === 'rating') {
                html += '<div class="rating-group">';
                var labels = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
                for (var i=5;i>=1;i--) html += '<label class="rating-label"><input type="radio" name="mq_'+q.id+'" value="'+i+'" required> '+labels[i]+' ('+i+')</label>';
                html += '</div>';
            } else {
                html += '<textarea name="mq_'+q.id+'" rows="3" class="text-answer" required placeholder="พิมพ์คำตอบ..."></textarea>';
            }
            html += '</div>';
        });

        html += '<div class="form-actions"><button type="submit" class="btn btn-primary">ส่งผลประเมินให้ MD</button></div></form></div>';
        container.innerHTML = html;

        document.getElementById('mgr-eval-form').addEventListener('submit', function(e) {
            e.preventDefault();
            App.submitMgrEvaluation(empId, unanswered);
        });
    },

    submitMgrEvaluation: function(empId, questions) {
        var mgrId = this.currentUser.id;

        for (var i=0; i<questions.length; i++) {
            var q = questions[i];
            if (q.type === 'rating') {
                var sel = document.querySelector('input[name="mq_'+q.id+'"]:checked');
                if (!sel) { showToast('กรุณาตอบทุกคำถาม','error'); return; }
                Store.evaluations.push({
                    id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                    employeeId: empId, questionId: q.id, type: 'rating',
                    score: parseInt(sel.value), status: 'reviewed',
                    evaluatedBy: mgrId, date: new Date().toISOString()
                });
            } else {
                var ta = document.querySelector('textarea[name="mq_'+q.id+'"]');
                if (!ta || !ta.value.trim()) { showToast('กรุณาตอบทุกคำถาม','error'); return; }
                Store.evaluations.push({
                    id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                    employeeId: empId, questionId: q.id, type: 'text',
                    answer: ta.value.trim(), status: 'reviewed',
                    evaluatedBy: mgrId, date: new Date().toISOString()
                });
            }
        }
        Store.save();
        showToast('ส่งผลประเมินให้ MD สำเร็จ!','success');
        this.navigateTo('mgr-evaluate');
    },

    // ==================== Manager: Review ====================
    renderMgrReview: function() {
        var dept = this.currentUser.department;
        var myEmps = Store.getEmployees().filter(function(e){return e.department===dept;});
        var empIds = myEmps.map(function(e){return e.id;});
        var submitted = Store.evaluations.filter(function(e){return e.status==='submitted' && empIds.indexOf(e.employeeId)!==-1;});

        var html = '<div class="section active"><div class="container"><h2 class="section-title">📥 ตรวจสอบและส่ง MD</h2>';
        html += '<p class="section-desc">ตรวจสอบแบบประเมินจากพนักงานในแผนก ' + dept + ' แล้วส่งต่อให้ MD</p>';

        if (submitted.length === 0) {
            html += '<p class="empty-state">ไม่มีรายการรอตรวจสอบ</p>';
        } else {
            var grouped = {};
            submitted.forEach(function(e){if(!grouped[e.employeeId])grouped[e.employeeId]=[];grouped[e.employeeId].push(e);});
            Object.keys(grouped).forEach(function(empId) {
                var emp = Store.users.find(function(u){return u.id===empId;});
                var evals = grouped[empId];
                var ratings = evals.filter(function(e){return e.type==='rating';});
                var avg = ratings.length>0?ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length:null;
                var g = Store.getGrade(avg);
                html += '<div class="result-card"><div class="result-card-header"><div><h4>'+(emp?emp.name:empId)+'</h4><small>'+(emp?emp.position:'')+'</small></div>';
                html += '<div class="score-grade-box"><div class="score">'+(avg!==null?avg.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
                html += '<div class="result-answers">';
                evals.forEach(function(ev){var q=Store.questions.find(function(q){return q.id===ev.questionId;});var ans=ev.type==='rating'?'<span class="badge badge-evaluated">'+ev.score+'/5</span>':'<em>'+ev.answer+'</em>';html+='<div class="result-answer-item"><span class="q-label">'+(q?q.text:'ลบแล้ว')+'</span>'+ans+'</div>';});
                html += '</div>';
                if (evals[0].rejectReason) html += '<p class="reject-reason">⚠️ MD ส่งกลับ: '+evals[0].rejectReason+'</p>';
                html += '<div class="form-group" style="margin-top:1rem;"><label>ความเห็นหัวหน้าแผนก (ถ้ามี)</label><textarea class="mgr-comment-input text-answer" data-emp="'+empId+'" rows="2" placeholder="ความเห็นเพิ่มเติม..."></textarea></div>';
                html += '<div class="form-actions"><button class="btn btn-success send-md-btn" data-emp="'+empId+'">📤 ส่งให้ MD อนุมัติ</button></div></div>';
            });
        }
        html += '</div></div>';
        return html;
    },

    bindMgrReview: function() {
        document.querySelectorAll('.send-md-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var empId = btn.dataset.emp;
                var commentEl = document.querySelector('.mgr-comment-input[data-emp="'+empId+'"]');
                var comment = commentEl ? commentEl.value : '';
                App.sendToMd(empId, comment);
            });
        });
    },

    sendToMd: function(empId, comment) {
        Store.evaluations.forEach(function(e) {
            if (e.employeeId === empId && e.status === 'submitted') {
                e.status = 'reviewed';
                e.managerComment = comment;
                e.reviewedBy = App.currentUser.id;
                e.reviewedDate = new Date().toISOString();
            }
        });
        Store.save();
        showToast('ส่งให้ MD สำเร็จ','success');
        this.render('mgr-review'); this.bindMgrReview();
    },

    // ==================== Manager: Results ====================
    renderMgrResults: function() {
        var dept = this.currentUser.department;
        var myEmps = Store.getEmployees().filter(function(e){return e.department===dept;});
        var empIds = myEmps.map(function(e){return e.id;});
        var approved = Store.evaluations.filter(function(e){return e.status==='approved' && empIds.indexOf(e.employeeId)!==-1;});

        var html = '<div class="section active"><div class="container"><h2 class="section-title">📊 ผลประเมินแผนก '+dept+'</h2>';
        if (approved.length === 0) { html += '<p class="empty-state">ยังไม่มีผลที่อนุมัติ</p>'; }
        else {
            html += '<div class="results-grid">';
            var grouped = {};
            approved.forEach(function(e){if(!grouped[e.employeeId])grouped[e.employeeId]=[];grouped[e.employeeId].push(e);});
            Object.keys(grouped).forEach(function(empId) {
                var emp = Store.users.find(function(u){return u.id===empId;});
                var evals = grouped[empId];
                var ratings = evals.filter(function(e){return e.type==='rating';});
                var avg = ratings.length>0?ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length:null;
                var g = Store.getGrade(avg);
                html += '<div class="result-card"><div class="result-card-header"><div><h4>'+(emp?emp.name:empId)+'</h4></div>';
                html += '<div class="score-grade-box"><div class="score">'+(avg!==null?avg.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
                if(avg!==null){var pct=(avg/5)*100;html+='<div class="score-bar"><div class="score-bar-fill" style="width:'+pct+'%;background:'+g.color+'"></div></div><p class="grade-label" style="color:'+g.color+'">'+g.label+'</p>';}
                html += '</div>';
            });
            html += '</div>';
        }
        html += '</div></div>';
        return html;
    },

    // ==================== Employee: Evaluate ====================
    renderEmpEvaluate: function() {
        var empId = this.currentUser.id;
        var myQuestions = Store.getQuestionsForEmployee(empId);
        var answeredIds = Store.evaluations.filter(function(e){return e.employeeId===empId;}).map(function(e){return e.questionId;});
        var unanswered = myQuestions.filter(function(q){return answeredIds.indexOf(q.id)===-1;});

        var html = '<div class="section active"><div class="container"><h2 class="section-title">📝 ทำแบบประเมิน</h2>';

        // Show status of submitted ones
        var myEvals = Store.evaluations.filter(function(e){return e.employeeId===empId;});
        if (myEvals.length > 0) {
            var statusCounts = {submitted:0, reviewed:0, approved:0};
            myEvals.forEach(function(e){if(statusCounts[e.status]!==undefined)statusCounts[e.status]++;});
            html += '<div class="workflow-info"><h4>สถานะการประเมินของคุณ</h4><div class="status-summary">';
            html += '<span class="badge badge-pending">📥 รอหัวหน้าตรวจ: '+statusCounts.submitted+'</span> ';
            html += '<span class="badge badge-info">📤 ส่ง MD แล้ว: '+statusCounts.reviewed+'</span> ';
            html += '<span class="badge badge-evaluated">✅ อนุมัติ: '+statusCounts.approved+'</span>';
            html += '</div></div>';
        }

        if (unanswered.length === 0) {
            html += '<p class="empty-state">🎉 คุณตอบคำถามครบทุกข้อแล้ว!</p>';
        } else {
            html += '<p style="margin-bottom:1rem;color:#666;">คุณมี <strong>'+unanswered.length+'</strong> คำถามที่ต้องตอบ</p>';
            html += '<form id="emp-eval-form" class="eval-categories">';
            unanswered.forEach(function(q, idx) {
                var isReq = q.required !== 'no';
                html += '<div class="eval-category"><h3>คำถามที่ '+(idx+1)+ (isReq?' <span class="required">*</span>':'') +'</h3>';
                html += '<p class="question-text-display">'+q.text+'</p>';
                if (q.description) html += '<p class="question-desc">'+q.description+'</p>';

                if (q.type === 'rating') {
                    html += '<div class="rating-group">';
                    var labels = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
                    for (var i=5;i>=1;i--) html += '<label class="rating-label"><input type="radio" name="q_'+q.id+'" value="'+i+'"'+(isReq?' required':'')+'>'+labels[i]+' ('+i+')</label>';
                    html += '</div>';
                } else if (q.type === 'text') {
                    html += '<input type="text" name="q_'+q.id+'" class="text-answer" placeholder="พิมพ์คำตอบ..."'+(isReq?' required':'')+'>';
                } else if (q.type === 'paragraph') {
                    html += '<textarea name="q_'+q.id+'" rows="4" class="text-answer" placeholder="พิมพ์คำตอบ..."'+(isReq?' required':'')+'></textarea>';
                } else if (q.type === 'multiple_choice') {
                    html += '<div class="choice-group">';
                    (q.options||[]).forEach(function(opt, oi) {
                        html += '<label class="choice-label"><input type="radio" name="q_'+q.id+'" value="'+opt+'"'+(isReq?' required':'')+'> '+opt+'</label>';
                    });
                    html += '</div>';
                } else if (q.type === 'checkbox') {
                    html += '<div class="choice-group">';
                    (q.options||[]).forEach(function(opt, oi) {
                        html += '<label class="choice-label"><input type="checkbox" name="q_'+q.id+'" value="'+opt+'"> '+opt+'</label>';
                    });
                    html += '</div>';
                } else if (q.type === 'dropdown') {
                    html += '<select name="q_'+q.id+'" class="text-answer"'+(isReq?' required':'')+'><option value="">-- เลือกคำตอบ --</option>';
                    (q.options||[]).forEach(function(opt) {
                        html += '<option value="'+opt+'">'+opt+'</option>';
                    });
                    html += '</select>';
                }
                html += '</div>';
            });
            html += '<div class="form-actions"><button type="submit" class="btn btn-primary">ส่งแบบประเมิน</button></div></form>';
        }
        html += '</div></div>';
        return html;
    },

    bindEmpEvaluate: function() {
        var form = document.getElementById('emp-eval-form');
        if (!form) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            App.submitEmpEvaluation();
        });
    },

    submitEmpEvaluation: function() {
        var empId = this.currentUser.id;
        var myQuestions = Store.getQuestionsForEmployee(empId);
        var answeredIds = Store.evaluations.filter(function(e){return e.employeeId===empId;}).map(function(e){return e.questionId;});
        var unanswered = myQuestions.filter(function(q){return answeredIds.indexOf(q.id)===-1;});

        for (var i=0; i<unanswered.length; i++) {
            var q = unanswered[i];
            var isReq = q.required !== 'no';
            var evalEntry = {
                id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                employeeId: empId, questionId: q.id, type: q.type,
                status: 'submitted', date: new Date().toISOString()
            };

            if (q.type === 'rating') {
                var sel = document.querySelector('input[name="q_'+q.id+'"]:checked');
                if (!sel && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                if (sel) evalEntry.score = parseInt(sel.value);
                else evalEntry.answer = '-';
            } else if (q.type === 'multiple_choice') {
                var chosen = document.querySelector('input[name="q_'+q.id+'"]:checked');
                if (!chosen && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = chosen ? chosen.value : '-';
            } else if (q.type === 'checkbox') {
                var checks = document.querySelectorAll('input[name="q_'+q.id+'"]:checked');
                var vals = [];
                checks.forEach(function(c){vals.push(c.value);});
                if (vals.length === 0 && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = vals.length > 0 ? vals.join(', ') : '-';
            } else if (q.type === 'dropdown') {
                var dd = document.querySelector('select[name="q_'+q.id+'"]');
                if ((!dd || !dd.value) && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = dd ? dd.value : '-';
            } else if (q.type === 'text') {
                var inp = document.querySelector('input[name="q_'+q.id+'"]');
                if ((!inp || !inp.value.trim()) && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = inp ? inp.value.trim() : '-';
            } else {
                // paragraph
                var ta = document.querySelector('textarea[name="q_'+q.id+'"]');
                if ((!ta || !ta.value.trim()) && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = ta ? ta.value.trim() : '-';
            }

            Store.evaluations.push(evalEntry);
        }
        Store.save();
        showToast('ส่งแบบประเมินสำเร็จ! รอหัวหน้าแผนกตรวจสอบ','success');
        this.render('emp-evaluate'); this.bindEmpEvaluate();
    },

    // ==================== Employee: Results ====================
    renderEmpResults: function() {
        var empId = this.currentUser.id;
        var approved = Store.evaluations.filter(function(e){return e.employeeId===empId && e.status==='approved';});
        var html = '<div class="section active"><div class="container"><h2 class="section-title">📋 ผลประเมินของฉัน</h2>';

        if (approved.length === 0) {
            html += '<p class="empty-state">ยังไม่มีผลที่อนุมัติแล้ว (รอ MD อนุมัติ)</p>';
        } else {
            var ratings = approved.filter(function(e){return e.type==='rating';});
            var avg = ratings.length>0?ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length:null;
            var g = Store.getGrade(avg);

            html += '<div class="result-card" style="max-width:600px;">';
            html += '<div class="result-card-header"><div><h4>สรุปผลประเมิน</h4><small>อนุมัติแล้ว '+approved.length+' รายการ</small></div>';
            html += '<div class="score-grade-box"><div class="score">'+(avg!==null?avg.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
            if (avg!==null) {
                var pct=(avg/5)*100;
                html += '<div class="score-bar"><div class="score-bar-fill" style="width:'+pct+'%;background:'+g.color+'"></div></div>';
                html += '<p class="grade-label" style="color:'+g.color+'">ระดับ: '+g.label+' (เกรด '+g.grade+')</p>';
            }
            html += '<div class="result-answers">';
            approved.forEach(function(ev){
                var q = Store.questions.find(function(q){return q.id===ev.questionId;});
                var ans = ev.type==='rating'?'<span class="badge badge-evaluated">'+ev.score+'/5</span>':'<em>'+ev.answer+'</em>';
                html += '<div class="result-answer-item"><span class="q-label">'+(q?q.text:'ลบแล้ว')+'</span>'+ans+'</div>';
            });
            html += '</div></div>';
        }
        html += '</div></div>';
        return html;
    }
};

// ==================== Utility Functions ====================
function showToast(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

function formatDate(dateStr) {
    var date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' });
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});
