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
                fetch(API_URL + '/gradeRules').then(function(r){return r.json();}),
                fetch(API_URL + '/sectionWeights').then(function(r){return r.json();}).catch(function(){return null;})
            ]);
            this.users = res[0];
            this.questions = res[1];
            this.evaluations = res[2];
            this.gradeRules = res[3];
            this.sectionWeights = res[4] || this._defaultWeights();
        } catch(e) {
            console.warn('Server not available, using localStorage fallback');
            this.users = JSON.parse(localStorage.getItem('users')) || this._defaultUsers();
            this.questions = JSON.parse(localStorage.getItem('questions')) || [];
            this.evaluations = JSON.parse(localStorage.getItem('evaluations')) || [];
            this.gradeRules = JSON.parse(localStorage.getItem('gradeRules')) || this._defaultGrades();
            this.sectionWeights = JSON.parse(localStorage.getItem('sectionWeights')) || this._defaultWeights();
        }
    },

    // Save all data to server (full replace)
    async save() {
        // Save to localStorage as backup
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('questions', JSON.stringify(this.questions));
        localStorage.setItem('evaluations', JSON.stringify(this.evaluations));
        localStorage.setItem('gradeRules', JSON.stringify(this.gradeRules));
        localStorage.setItem('sectionWeights', JSON.stringify(this.sectionWeights));

        try {
            // Write entire db at once via custom endpoint
            await fetch(API_URL + '/save-all', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({
                    users: this.users,
                    questions: this.questions,
                    evaluations: this.evaluations,
                    gradeRules: this.gradeRules,
                    sectionWeights: this.sectionWeights
                })
            });
        } catch(e) {
            console.warn('Could not save to server:', e.message);
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

    _defaultWeights() {
        return {
            kpi: 40, questions: 40, attendance: 20,
            kpiTitle: 'KPI ของตัวเอง',
            questionsTitle: 'แบบประเมินตามคำถาม',
            attendanceTitle: 'การขาด ลา มาสาย',
            lateRules: [
                { minTimes: 37, deduct: 5 },
                { minTimes: 25, deduct: 3 },
                { minTimes: 15, deduct: 2 },
                { minTimes: 5, deduct: 1 }
            ]
        };
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
    },

    // Calculate section scores for an employee (out of 100)
    calcSectionScores(empId) {
        var w = this.sectionWeights || this._defaultWeights();
        var evals = this.evaluations.filter(function(e){return e.employeeId===empId && e.status==='approved';});
        if (evals.length === 0) evals = this.evaluations.filter(function(e){return e.employeeId===empId && (e.status==='reviewed'||e.status==='submitted');});

        // KPI score (rating out of 5 -> convert to weight)
        var kpiEval = evals.find(function(e){return e.type==='kpi';});
        var kpiScore = kpiEval && kpiEval.score ? (kpiEval.score / 5) * w.kpi : 0;

        // Questions score (average rating out of 5 -> convert to weight)
        var qEvals = evals.filter(function(e){return e.type==='rating' && e.questionId!=='kpi_self';});
        var qAvg = qEvals.length > 0 ? qEvals.reduce(function(s,e){return s+e.score;},0)/qEvals.length : 0;
        var questionsScore = (qAvg / 5) * w.questions;

        // Attendance score (full marks minus deductions based on late rules)
        var attEval = evals.find(function(e){return e.type==='attendance';});
        var attScore = w.attendance;
        if (attEval) {
            var lateTimes = attEval.late || 0;
            var deduct = 0;
            var rules = (w.lateRules || []).sort(function(a,b){return b.minTimes - a.minTimes;});
            for (var r=0; r<rules.length; r++) {
                if (lateTimes >= rules[r].minTimes) {
                    deduct = rules[r].deduct;
                    break;
                }
            }
            attScore = Math.max(0, w.attendance - deduct);
        }

        var totalScore = kpiScore + questionsScore + attScore;
        return { kpi: kpiScore, questions: questionsScore, attendance: attScore, total: totalScore, maxKpi: w.kpi, maxQ: w.questions, maxAtt: w.attendance };
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
                { page: 'admin-weights', label: 'สัดส่วนคะแนน' },
                { page: 'admin-grading', label: 'ตั้งค่าเกรด' },
                { page: 'admin-summary', label: 'สรุปผลประเมิน' }
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
                { page: 'mgr-self-eval', label: 'ประเมินตัวเอง' },
                { page: 'mgr-review', label: 'ตรวจสอบ/ส่ง MD' }
            ];
        } else {
            links = [
                { page: 'emp-evaluate', label: 'ทำแบบประเมิน' }
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
            case 'admin-weights': content.innerHTML = this.renderAdminWeights(); this.bindAdminWeights(); break;
            case 'admin-summary': content.innerHTML = this.renderAdminSummary(); break;
            case 'md-dashboard': content.innerHTML = this.renderMdDashboard(); break;
            case 'md-approve': content.innerHTML = this.renderMdApprove(); this.bindMdApprove(); break;
            case 'md-results': content.innerHTML = this.renderMdResults(); break;
            case 'mgr-dashboard': content.innerHTML = this.renderMgrDashboard(); break;
            case 'mgr-self-eval': content.innerHTML = this.renderMgrSelfEval(); this.bindMgrSelfEval(); break;
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
        var approved = Store.evaluations.filter(function(e){return e.status==='approved';});

        var html = '<div class="section active"><div class="container">' +
            '<h2 class="section-title">แดชบอร์ด Admin</h2>' +
            '<div class="workflow-info"><h4>📋 หน้าที่ของ Admin</h4><p>จัดการผู้ใช้, ตั้งคำถามประเมิน, กำหนดเกณฑ์ตัดเกรด</p></div>' +
            '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon">👥</div><div class="stat-info"><h3>' + emps.length + '</h3><p>พนักงาน</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">👔</div><div class="stat-info"><h3>' + mgrs.length + '</h3><p>หัวหน้าแผนก</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">❓</div><div class="stat-info"><h3>' + totalQ + '</h3><p>คำถามทั้งหมด</p></div></div>' +
            '<div class="stat-card"><div class="stat-icon">📊</div><div class="stat-info"><h3>' + Store.gradeRules.length + '</h3><p>เกณฑ์ตัดเกรด</p></div></div>' +
            '</div>';

        // Department chart section
        var departments = {};
        Store.users.filter(function(u){return u.role==='employee'||u.role==='manager';}).forEach(function(u) {
            if (u.department) {
                if (!departments[u.department]) departments[u.department] = {total:0, evaluated:0, avgScore:0, scores:[]};
                departments[u.department].total++;
            }
        });

        // Calculate scores per department
        var groupedByEmp = {};
        approved.forEach(function(e){if(!groupedByEmp[e.employeeId])groupedByEmp[e.employeeId]=[];groupedByEmp[e.employeeId].push(e);});
        Object.keys(groupedByEmp).forEach(function(empId) {
            var user = Store.users.find(function(u){return u.id===empId;});
            if (!user || !user.department || !departments[user.department]) return;
            var evals = groupedByEmp[empId];
            var ratings = evals.filter(function(e){return e.type==='rating';});
            var autoAvg = ratings.length>0 ? ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length : null;
            var mdTotal = evals[0].mdTotalScore;
            var finalScore = (mdTotal !== undefined && mdTotal !== null) ? mdTotal : autoAvg;
            if (finalScore !== null) {
                departments[user.department].evaluated++;
                departments[user.department].scores.push(finalScore);
            }
        });

        // Calculate averages
        Object.keys(departments).forEach(function(dept) {
            var d = departments[dept];
            d.avgScore = d.scores.length > 0 ? d.scores.reduce(function(s,v){return s+v;},0)/d.scores.length : 0;
        });

        // Find max for chart scaling
        var maxTotal = Math.max.apply(null, Object.keys(departments).map(function(d){return departments[d].total;})) || 1;

        html += '<div class="chart-section"><h3>📊 สรุปแต่ละแผนก</h3>';
        html += '<div class="dept-charts">';

        Object.keys(departments).forEach(function(dept) {
            var d = departments[dept];
            var g = Store.getGrade(d.avgScore);
            var barWidth = (d.total / maxTotal) * 100;
            var scoreBarWidth = (d.avgScore / 5) * 100;

            html += '<div class="dept-chart-card">';
            html += '<div class="dept-chart-header"><h4>'+dept+'</h4>';
            if (d.scores.length > 0) {
                html += '<span class="grade-badge-sm" style="background:'+g.color+'">'+g.grade+'</span>';
            }
            html += '</div>';

            // Staff count bar
            html += '<div class="dept-chart-row"><span class="dept-chart-label">จำนวนคน</span>';
            html += '<div class="dept-bar-container"><div class="dept-bar" style="width:'+barWidth+'%;background:#3f51b5;"></div></div>';
            html += '<span class="dept-chart-value">'+d.total+'</span></div>';

            // Evaluated count bar
            html += '<div class="dept-chart-row"><span class="dept-chart-label">ประเมินแล้ว</span>';
            var evalWidth = d.total > 0 ? (d.evaluated / d.total) * 100 : 0;
            html += '<div class="dept-bar-container"><div class="dept-bar" style="width:'+evalWidth+'%;background:#43a047;"></div></div>';
            html += '<span class="dept-chart-value">'+d.evaluated+'/'+d.total+'</span></div>';

            // Average score bar
            html += '<div class="dept-chart-row"><span class="dept-chart-label">คะแนนเฉลี่ย</span>';
            html += '<div class="dept-bar-container"><div class="dept-bar" style="width:'+scoreBarWidth+'%;background:'+(d.scores.length>0?g.color:'#e0e0e0')+';"></div></div>';
            html += '<span class="dept-chart-value">'+(d.scores.length>0?d.avgScore.toFixed(1):'-')+'/5</span></div>';

            html += '</div>';
        });

        html += '</div></div>';
        html += '</div></div>';
        return html;
    },

    // ==================== Admin: Section Weights ====================
    renderAdminWeights: function() {
        var w = Store.sectionWeights || Store._defaultWeights();
        var total = (w.kpi||0) + (w.questions||0) + (w.attendance||0);
        var html = '<div class="section active"><div class="container"><h2 class="section-title">⚖️ สัดส่วนคะแนน (เต็ม 100)</h2>';
        html += '<p class="section-desc">กำหนดชื่อหัวข้อ, คะแนนเต็ม, และเกณฑ์หักคะแนนมาสาย/ขาด/ลา</p>';

        // Current display
        html += '<div class="grading-section"><h3>สัดส่วนปัจจุบัน</h3>';
        html += '<div class="weights-display">';
        html += '<div class="weight-card weight-kpi"><div class="weight-icon">🎯</div><div class="weight-info"><h4>ส่วนที่ 1: '+(w.kpiTitle||'KPI')+'</h4><span class="weight-value">'+w.kpi+' คะแนน</span></div></div>';
        html += '<div class="weight-card weight-questions"><div class="weight-icon">📝</div><div class="weight-info"><h4>ส่วนที่ 2: '+(w.questionsTitle||'คำถามประเมิน')+'</h4><span class="weight-value">'+w.questions+' คะแนน</span></div></div>';
        html += '<div class="weight-card weight-attendance"><div class="weight-icon">📅</div><div class="weight-info"><h4>ส่วนที่ 3: '+(w.attendanceTitle||'ขาด/ลา/มาสาย')+'</h4><span class="weight-value">'+w.attendance+' คะแนน</span></div></div>';
        html += '</div>';
        html += '<p style="text-align:center;margin-top:1rem;font-size:1.1rem;font-weight:700;color:'+(total===100?'#43a047':'#e53935')+';">รวม: '+total+' / 100 คะแนน '+(total===100?'✅':'❌')+'</p>';
        html += '</div>';

        // Edit form
        html += '<div class="grading-section"><h3>แก้ไขสัดส่วนและหัวข้อ</h3>';
        html += '<form id="weights-form">';
        html += '<div class="eval-section-block" style="border-left-color:#1565c0;"><h4 style="color:#1565c0;">ส่วนที่ 1</h4><div class="grade-form-row">';
        html += '<div class="form-group"><label>ชื่อหัวข้อ</label><input type="text" id="w-kpi-title" value="'+(w.kpiTitle||'KPI ของตัวเอง')+'" class="text-answer"></div>';
        html += '<div class="form-group"><label>คะแนนเต็ม</label><input type="number" id="w-kpi" min="0" max="100" value="'+w.kpi+'" required class="text-answer"></div>';
        html += '</div></div>';

        html += '<div class="eval-section-block" style="border-left-color:#7b1fa2;"><h4 style="color:#7b1fa2;">ส่วนที่ 2</h4><div class="grade-form-row">';
        html += '<div class="form-group"><label>ชื่อหัวข้อ</label><input type="text" id="w-questions-title" value="'+(w.questionsTitle||'แบบประเมินตามคำถาม')+'" class="text-answer"></div>';
        html += '<div class="form-group"><label>คะแนนเต็ม</label><input type="number" id="w-questions" min="0" max="100" value="'+w.questions+'" required class="text-answer"></div>';
        html += '</div></div>';

        html += '<div class="eval-section-block" style="border-left-color:#e65100;"><h4 style="color:#e65100;">ส่วนที่ 3</h4><div class="grade-form-row">';
        html += '<div class="form-group"><label>ชื่อหัวข้อ</label><input type="text" id="w-attendance-title" value="'+(w.attendanceTitle||'การขาด ลา มาสาย')+'" class="text-answer"></div>';
        html += '<div class="form-group"><label>คะแนนเต็ม</label><input type="number" id="w-attendance" min="0" max="100" value="'+w.attendance+'" required class="text-answer"></div>';
        html += '</div>';
        html += '<h4 style="margin-top:1rem;">เกณฑ์หักคะแนนมาสาย (ขั้นบันได)</h4>';
        html += '<p class="section-desc">ถ้ามาสายถึงจำนวนครั้งที่กำหนด จะหักคะแนนตามเกณฑ์ (ถ้าไม่ถึง = ไม่หัก)</p>';
        html += '<table class="data-table" id="late-rules-table"><thead><tr><th>มาสายตั้งแต่ (ครั้ง)</th><th>หัก (คะแนน)</th><th>ลบ</th></tr></thead><tbody>';
        var rules = w.lateRules || [];
        rules.forEach(function(rule, idx) {
            html += '<tr><td>≥ '+rule.minTimes+' ครั้ง</td><td>'+rule.deduct+' คะแนน</td><td><button class="btn-delete" onclick="App.deleteLateRule('+idx+')">ลบ</button></td></tr>';
        });
        if (rules.length === 0) html += '<tr><td colspan="3" class="empty-state">ยังไม่มีเกณฑ์ (ไม่หักคะแนน)</td></tr>';
        html += '</tbody></table>';
        html += '<div class="grade-form-row" style="margin-top:1rem;">';
        html += '<div class="form-group"><label>มาสายตั้งแต่ (ครั้ง)</label><input type="number" id="w-late-min" min="1" value="10" class="text-answer"></div>';
        html += '<div class="form-group"><label>หัก (คะแนน)</label><input type="number" id="w-late-deduct" min="0.5" step="0.5" value="2" class="text-answer"></div>';
        html += '<div class="form-group" style="align-self:flex-end;"><button type="button" class="btn btn-primary" onclick="App.addLateRule()">+ เพิ่มเกณฑ์</button></div>';
        html += '</div></div>';

        html += '<p id="weights-total" style="font-weight:700;margin:1rem 0;font-size:1.1rem;"></p>';
        html += '<button type="submit" class="btn btn-primary">บันทึกทั้งหมด</button></form></div>';

        html += '</div></div>';
        return html;
    },

    bindAdminWeights: function() {
        var form = document.getElementById('weights-form');
        if (!form) return;
        var inputs = ['w-kpi','w-questions','w-attendance'];
        inputs.forEach(function(id) {
            document.getElementById(id).addEventListener('input', function() {
                var t = (parseInt(document.getElementById('w-kpi').value)||0) + (parseInt(document.getElementById('w-questions').value)||0) + (parseInt(document.getElementById('w-attendance').value)||0);
                var el = document.getElementById('weights-total');
                el.textContent = 'รวม: ' + t + ' / 100' + (t===100?' ✅':' ❌ ต้องรวมเป็น 100');
                el.style.color = t===100?'#43a047':'#e53935';
            });
        });
        form.addEventListener('submit', function(e) { e.preventDefault(); App.saveWeights(); });
    },

    saveWeights: async function() {
        var kpi = parseInt(document.getElementById('w-kpi').value)||0;
        var questions = parseInt(document.getElementById('w-questions').value)||0;
        var attendance = parseInt(document.getElementById('w-attendance').value)||0;
        var total = kpi + questions + attendance;
        if (total !== 100) { showToast('สัดส่วนรวมต้องเท่ากับ 100 (ตอนนี้ = '+total+')','error'); return; }
        var existing = Store.sectionWeights || {};
        Store.sectionWeights = {
            kpi: kpi, questions: questions, attendance: attendance,
            kpiTitle: document.getElementById('w-kpi-title').value.trim() || 'KPI ของตัวเอง',
            questionsTitle: document.getElementById('w-questions-title').value.trim() || 'แบบประเมินตามคำถาม',
            attendanceTitle: document.getElementById('w-attendance-title').value.trim() || 'การขาด ลา มาสาย',
            lateRules: existing.lateRules || []
        };
        await Store.save();
        showToast('บันทึกสัดส่วนคะแนนสำเร็จ','success');
        this.render('admin-weights'); this.bindAdminWeights();
    },

    addLateRule: async function() {
        var minTimes = parseInt(document.getElementById('w-late-min').value)||0;
        var deduct = parseFloat(document.getElementById('w-late-deduct').value)||0;
        if (minTimes < 1 || deduct <= 0) { showToast('กรุณากรอกจำนวนครั้งและคะแนนหัก','error'); return; }
        var w = Store.sectionWeights || Store._defaultWeights();
        if (!w.lateRules) w.lateRules = [];
        // Check duplicate
        if (w.lateRules.some(function(r){return r.minTimes===minTimes;})) { showToast('มีเกณฑ์ '+minTimes+' ครั้งอยู่แล้ว','error'); return; }
        w.lateRules.push({ minTimes: minTimes, deduct: deduct });
        w.lateRules.sort(function(a,b){return b.minTimes - a.minTimes;});
        Store.sectionWeights = w;
        await Store.save();
        showToast('เพิ่มเกณฑ์สำเร็จ','success');
        this.render('admin-weights'); this.bindAdminWeights();
    },

    deleteLateRule: async function(idx) {
        if (!confirm('ลบเกณฑ์นี้?')) return;
        var w = Store.sectionWeights || Store._defaultWeights();
        w.lateRules.splice(idx, 1);
        Store.sectionWeights = w;
        await Store.save();
        this.render('admin-weights'); this.bindAdminWeights();
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

    // ==================== Admin: Summary (approved results from MD) ====================
    renderAdminSummary: function() {
        var approved = Store.evaluations.filter(function(e){return e.status==='approved';});
        var html = '<div class="section active"><div class="container"><div class="section-header"><h2 class="section-title">📊 สรุปผลประเมิน (อนุมัติแล้ว)</h2>';
        html += '<button class="btn btn-primary" onclick="App.exportExcel()">📥 Export Excel</button></div>';
        html += '<p class="section-desc">ผลประเมินที่ MD อนุมัติแล้ว — สรุปคะแนนและเกรดของพนักงานแต่ละคน</p>';

        if (approved.length === 0) {
            html += '<p class="empty-state">ยังไม่มีผลที่ MD อนุมัติ</p>';
        } else {
            // Summary table
            var w = Store.sectionWeights || Store._defaultWeights();
            html += '<div class="grading-section"><h3>ตารางสรุปคะแนน</h3>';
            html += '<table class="data-table"><thead><tr><th>รหัส</th><th>ชื่อ</th><th>แผนก</th><th>'+(w.kpiTitle||'KPI')+'<br><small>/'+w.kpi+'</small></th><th>'+(w.questionsTitle||'คำถาม')+'<br><small>/'+w.questions+'</small></th><th>'+(w.attendanceTitle||'ขาด/ลา/สาย')+'<br><small>/'+w.attendance+'</small></th><th>รวม<br><small>/100</small></th><th>เกรด</th></tr></thead><tbody>';
            var grouped = {};
            approved.forEach(function(e){if(!grouped[e.employeeId])grouped[e.employeeId]=[];grouped[e.employeeId].push(e);});

            Object.keys(grouped).forEach(function(empId) {
                var emp = Store.users.find(function(u){return u.id===empId;});
                var scores = Store.calcSectionScores(empId);
                var mdTotal = grouped[empId][0].mdTotalScore;
                var finalTotal = (mdTotal !== undefined && mdTotal !== null) ? (mdTotal/5)*100 : scores.total;
                var g = Store.getGrade(finalTotal/20); // convert 100-scale to 5-scale for grade
                html += '<tr>';
                html += '<td>'+(emp?emp.id:empId)+'</td>';
                html += '<td><strong>'+(emp?emp.name:empId)+'</strong></td>';
                html += '<td>'+(emp?emp.department||'-':'-')+'</td>';
                html += '<td>'+scores.kpi.toFixed(1)+'</td>';
                html += '<td>'+scores.questions.toFixed(1)+'</td>';
                html += '<td>'+scores.attendance.toFixed(1)+'</td>';
                html += '<td><strong>'+finalTotal.toFixed(1)+'</strong></td>';
                html += '<td><span class="grade-badge-sm" style="background:'+g.color+'">'+g.grade+'</span> '+g.label+'</td>';
                html += '</tr>';
            });
            html += '</tbody></table></div>';

        }
        html += '</div></div>';
        return html;
    },

    // ==================== Admin: Export Excel ====================
    exportExcel: function() {
        var approved = Store.evaluations.filter(function(e){return e.status==='approved';});
        if (approved.length === 0) { showToast('ไม่มีข้อมูลให้ export','error'); return; }

        var grouped = {};
        approved.forEach(function(e){if(!grouped[e.employeeId])grouped[e.employeeId]=[];grouped[e.employeeId].push(e);});

        // Build header row (same as summary table)
        var headers = ['รหัส', 'ชื่อ', 'แผนก', 'ตำแหน่ง', 'คะแนนเฉลี่ย', 'เกรด', 'ระดับ', 'จำนวนข้อ'];

        // Build data rows
        var rows = [headers];
        Object.keys(grouped).forEach(function(empId) {
            var emp = Store.users.find(function(u){return u.id===empId;});
            var evals = grouped[empId];
            var ratings = evals.filter(function(e){return e.type==='rating';});
            var autoAvg = ratings.length>0 ? ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length : null;
            var mdTotal = evals[0].mdTotalScore;
            var finalScore = (mdTotal !== undefined && mdTotal !== null) ? mdTotal : autoAvg;
            var g = Store.getGrade(finalScore);

            rows.push([
                emp ? emp.id : empId,
                emp ? emp.name : empId,
                emp ? (emp.department||'-') : '-',
                emp ? (emp.position||'-') : '-',
                finalScore !== null ? parseFloat(finalScore.toFixed(2)) : '-',
                g.grade,
                g.label,
                evals.length
            ]);
        });

        // Generate Excel XML
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<?mso-application progid="Excel.Sheet"?>\n';
        xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
        xml += '<Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#E8EAF6" ss:Pattern="Solid"/></Style></Styles>\n';
        xml += '<Worksheet ss:Name="สรุปเกรด"><Table>\n';

        rows.forEach(function(row, rowIdx) {
            xml += '<Row>';
            row.forEach(function(cell) {
                var style = rowIdx === 0 ? ' ss:StyleID="header"' : '';
                var type = (typeof cell === 'number') ? 'Number' : 'String';
                var val = String(cell).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                xml += '<Cell'+style+'><Data ss:Type="'+type+'">'+val+'</Data></Cell>';
            });
            xml += '</Row>\n';
        });

        xml += '</Table></Worksheet></Workbook>';

        // Download
        var blob = new Blob([xml], {type: 'application/vnd.ms-excel'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        var date = new Date().toISOString().substring(0,10);
        a.download = 'สรุปเกรด_' + date + '.xls';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Export สำเร็จ!','success');
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
                '<td class="actions"><button class="btn-edit" onclick="App.editUser(\''+u.id+'\')">แก้ไข</button> <button class="btn-edit" onclick="App.resetPassword(\''+u.id+'\')" style="background:#fff3e0;color:#e65100;">รีเซ็ตรหัส</button> <button class="btn-delete" onclick="App.deleteUser(\''+u.id+'\')">ลบ</button></td></tr>';
        });
        html += '</tbody></table></div>';
        // Add user form
        html += '<div id="add-user-form-container" class="modal-inline" style="display:none;">' +
            '<h3>เพิ่มผู้ใช้ใหม่</h3><form id="add-user-form">' +
            '<div class="grade-form-row">' +
            '<div class="form-group"><label>ชื่อ</label><input type="text" id="nu-name" required></div>' +
            '<div class="form-group"><label>บทบาท</label><select id="nu-role" required><option value="employee">Employee</option><option value="manager">Manager</option><option value="md">MD</option><option value="admin">Admin</option></select></div>' +
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
        var name = document.getElementById('nu-name').value;
        var department = document.getElementById('nu-dept').value;
        var position = document.getElementById('nu-position').value || '';
        var password = document.getElementById('nu-password').value || '1234';

        if (this._editingUserId) {
            // Edit existing user
            var existing = Store.users.find(function(u){return u.id === App._editingUserId;});
            if (existing) {
                existing.name = name;
                existing.role = role;
                existing.department = department;
                existing.position = position;
                existing.password = password;
            }
            this._editingUserId = null;
            await Store.save();
            showToast('แก้ไขผู้ใช้สำเร็จ', 'success');
        } else {
            // Add new user
            var prefix = role === 'manager' ? 'MGR' : role === 'md' ? 'MD' : role === 'admin' ? 'ADM' : 'EMP';
            var newId = (role === 'md' || role === 'admin') ? role + Date.now().toString(36) : Store.getNextId(prefix);
            var user = {
                id: newId,
                name: name,
                role: role,
                department: department,
                position: position,
                password: password
            };
            Store.users.push(user);
            await Store.save();
            showToast('เพิ่มผู้ใช้สำเร็จ (' + user.id + ')', 'success');
        }
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

    editUser: function(id) {
        var user = Store.users.find(function(u){return u.id===id;});
        if (!user) return;
        // Show edit form
        var formContainer = document.getElementById('add-user-form-container');
        formContainer.style.display = 'block';
        formContainer.querySelector('h3').textContent = '✏️ แก้ไขผู้ใช้: ' + user.name;
        document.getElementById('nu-name').value = user.name;
        document.getElementById('nu-role').value = user.role;
        document.getElementById('nu-dept').value = user.department || 'IT';
        document.getElementById('nu-position').value = user.position || '';
        document.getElementById('nu-password').value = user.password || '1234';
        // Store editing state
        this._editingUserId = id;
        var submitBtn = formContainer.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = '💾 บันทึกการแก้ไข';
        formContainer.scrollIntoView({behavior:'smooth'});
    },

    resetPassword: async function(id) {
        var newPass = prompt('กำหนดรหัสผ่านใหม่ (ปล่อยว่างใช้ 1234):', '1234');
        if (newPass === null) return;
        if (!newPass.trim()) newPass = '1234';
        var user = Store.users.find(function(u){return u.id===id;});
        if (user) {
            user.password = newPass.trim();
            await Store.save();
            this.render('admin-users');
            this.bindMdUsers();
            showToast('รีเซ็ตรหัสผ่าน ' + id + ' สำเร็จ (รหัสใหม่: ' + newPass.trim() + ')', 'success');
        }
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
        emps.forEach(function(e) { html += '<option value="'+e.id+'">'+e.name+' (พนักงาน)</option>'; });
        Store.getManagers().forEach(function(m) { html += '<option value="'+m.id+'">'+m.name+' (หัวหน้า)</option>'; });
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
                html += '<div class="question-actions"><button class="btn-edit" onclick="App.editQuestion(\''+q.id+'\')">แก้ไข</button><button class="btn-delete" onclick="App.deleteQuestion(\''+q.id+'\')">ลบ</button></div></div>';
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

        var questionData = {
            text: document.getElementById('q-text').value,
            description: document.getElementById('q-desc').value || '',
            type: type,
            options: options,
            target: document.getElementById('q-target').value,
            required: document.getElementById('q-required').value
        };

        if (this._editingQuestionId) {
            // Update existing
            var idx = Store.questions.findIndex(function(q){return q.id === App._editingQuestionId;});
            if (idx !== -1) {
                questionData.id = Store.questions[idx].id;
                Store.questions[idx] = questionData;
            }
            this._editingQuestionId = null;
            showToast('แก้ไขคำถามสำเร็จ', 'success');
        } else {
            // Add new
            questionData.id = 'Q' + Date.now();
            Store.questions.push(questionData);
            showToast('เพิ่มคำถามสำเร็จ', 'success');
        }

        await Store.save();
        this.render('admin-questions'); this.bindMdQuestions();
    },

    editQuestion: function(id) {
        var q = Store.questions.find(function(item){return item.id === id;});
        if (!q) return;
        document.getElementById('q-text').value = q.text;
        document.getElementById('q-desc').value = q.description || '';
        document.getElementById('q-type').value = q.type;
        document.getElementById('q-target').value = q.target;
        document.getElementById('q-required').value = q.required || 'yes';
        this.onQuestionTypeChange();
        if (q.options && q.options.length > 0) {
            document.getElementById('q-options').value = q.options.join('\n');
        } else {
            document.getElementById('q-options').value = '';
        }
        // Switch to edit mode
        this._editingQuestionId = id;
        var submitBtn = document.querySelector('#add-q-form button[type="submit"]');
        if (submitBtn) submitBtn.textContent = '💾 บันทึกการแก้ไข';
        var formWrap = document.getElementById('add-q-form-wrap');
        if (formWrap) {
            formWrap.querySelector('h3').textContent = '✏️ แก้ไขคำถาม';
            formWrap.scrollIntoView({behavior:'smooth'});
        }
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
        html += '<p class="section-desc">ตรวจสอบ/แก้ไขคะแนน แล้วอนุมัติหรือส่งกลับ</p>';
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
                html += '<div class="score-grade-box"><div class="score md-score" data-emp="'+empId+'">'+(avg!==null?avg.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';

                // Editable answers
                html += '<div class="result-answers">';
                evals.forEach(function(ev) {
                    var q = Store.questions.find(function(q){return q.id===ev.questionId;});
                    var qText = q ? q.text : 'ลบแล้ว';
                    html += '<div class="result-answer-item editable-item">';
                    html += '<span class="q-label">'+qText+'</span>';
                    if (ev.type === 'rating') {
                        html += '<select class="edit-score-select md-edit" data-eval-id="'+ev.id+'" data-emp="'+empId+'">';
                        for (var s=5; s>=1; s--) {
                            var labels = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
                            html += '<option value="'+s+'"'+(ev.score===s?' selected':'')+'>'+s+' - '+labels[s]+'</option>';
                        }
                        html += '</select>';
                    } else {
                        html += '<input type="text" class="edit-answer-input md-edit" data-eval-id="'+ev.id+'" data-emp="'+empId+'" value="'+(ev.answer||'').replace(/"/g,'&quot;')+'">';
                    }
                    html += '</div>';
                });
                html += '</div>';

                if (evals[0].managerComment) html += '<p class="mgr-comment"><strong>ความเห็นหัวหน้า:</strong> '+evals[0].managerComment+'</p>';

                // Section scores breakdown
                var secScores = Store.calcSectionScores(empId);
                var w = Store.sectionWeights || Store._defaultWeights();
                html += '<div class="section-scores-panel">';
                html += '<h4>📊 คะแนนแยกตามส่วน</h4>';
                html += '<div class="section-scores-grid">';
                html += '<div class="sec-score-item sec-score-kpi"><span class="sec-score-label">🎯 '+(w.kpiTitle||'KPI')+'</span><span class="sec-score-value">'+secScores.kpi.toFixed(1)+' / '+w.kpi+'</span><div class="sec-score-bar"><div class="sec-score-fill" style="width:'+(w.kpi>0?(secScores.kpi/w.kpi)*100:0)+'%;background:#0d47a1;"></div></div></div>';
                html += '<div class="sec-score-item sec-score-q"><span class="sec-score-label">📝 '+(w.questionsTitle||'คำถาม')+'</span><span class="sec-score-value">'+secScores.questions.toFixed(1)+' / '+w.questions+'</span><div class="sec-score-bar"><div class="sec-score-fill" style="width:'+(w.questions>0?(secScores.questions/w.questions)*100:0)+'%;background:#4a148c;"></div></div></div>';
                html += '<div class="sec-score-item sec-score-att"><span class="sec-score-label">📅 '+(w.attendanceTitle||'ขาด/ลา/สาย')+'</span><span class="sec-score-value">'+secScores.attendance.toFixed(1)+' / '+w.attendance+'</span><div class="sec-score-bar"><div class="sec-score-fill" style="width:'+(w.attendance>0?(secScores.attendance/w.attendance)*100:0)+'%;background:#bf360c;"></div></div></div>';
                html += '</div>';
                html += '<div class="sec-score-total"><strong>คะแนนรวมอัตโนมัติ: '+secScores.total.toFixed(1)+' / 100</strong></div>';
                html += '</div>';

                // Total score (MD can override)
                var existingTotal = evals[0].mdTotalScore;
                var autoTotal = avg !== null ? avg.toFixed(2) : '';
                var displayScore = (existingTotal !== undefined && existingTotal !== null) ? existingTotal : (avg !== null ? avg : null);
                var displayGrade = Store.getGrade(displayScore);
                html += '<div class="total-score-section">';
                html += '<label><strong>คะแนนรวม (MD กำหนดเอง)</strong></label>';
                html += '<div class="total-score-row">';
                html += '<input type="number" class="md-total-score" data-emp="'+empId+'" step="0.01" min="0" max="5" value="'+(existingTotal !== undefined && existingTotal !== null ? existingTotal : autoTotal)+'" placeholder="0-5" oninput="App.onTotalScoreChange(\''+empId+'\')">';
                html += '<div class="live-grade-display" id="live-grade-'+empId+'">';
                html += '<span class="grade-badge" style="background:'+displayGrade.color+'">'+displayGrade.grade+'</span>';
                html += '<span class="live-grade-label" style="color:'+displayGrade.color+'">'+displayGrade.label+'</span>';
                html += '</div>';
                html += '</div>';
                html += '<span class="total-score-hint">คะแนนเฉลี่ยอัตโนมัติ: '+(avg!==null?avg.toFixed(2):'-')+' | พิมพ์คะแนนใหม่เพื่อเปลี่ยนเกรด</span>';
                html += '</div>';

                html += '<div class="form-actions"><button class="btn btn-primary md-save-btn" data-emp="'+empId+'">💾 บันทึกแก้ไข</button><button class="btn btn-success approve-btn" data-emp="'+empId+'">✅ อนุมัติ</button><button class="btn btn-danger reject-btn" data-emp="'+empId+'">❌ ส่งกลับ</button></div></div>';
            });
        }
        html += '</div></div>';
        return html;
    },

    bindMdApprove: function() {
        document.querySelectorAll('.md-save-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { App.mdSaveScores(btn.dataset.emp); });
        });
        document.querySelectorAll('.approve-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                App.mdSaveScores(btn.dataset.emp);
                App.approveEmployee(btn.dataset.emp);
            });
        });
        document.querySelectorAll('.reject-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { App.rejectEmployee(btn.dataset.emp); });
        });
    },

    mdSaveScores: function(empId) {
        var changed = false;
        document.querySelectorAll('.md-edit[data-emp="'+empId+'"]').forEach(function(el) {
            var evalId = el.dataset.evalId;
            var ev = Store.evaluations.find(function(e){return e.id===evalId;});
            if (!ev) return;
            if (el.tagName === 'SELECT') {
                var newScore = parseInt(el.value);
                if (ev.score !== newScore) { ev.score = newScore; ev.mdEditedBy = 'md'; changed = true; }
            } else {
                var newAnswer = el.value.trim();
                if (ev.answer !== newAnswer) { ev.answer = newAnswer; ev.mdEditedBy = 'md'; changed = true; }
            }
        });
        // Save MD total score
        var totalInput = document.querySelector('.md-total-score[data-emp="'+empId+'"]');
        if (totalInput && totalInput.value.trim() !== '') {
            var totalScore = parseFloat(totalInput.value);
            // Store on all evaluations of this employee (so it persists)
            Store.evaluations.forEach(function(e) {
                if (e.employeeId === empId && e.status === 'reviewed') {
                    e.mdTotalScore = totalScore;
                }
            });
            changed = true;
        }
        if (changed) {
            Store.save();
            showToast('บันทึกการแก้ไขสำเร็จ','success');
        }
    },

    onTotalScoreChange: function(empId) {
        var input = document.querySelector('.md-total-score[data-emp="'+empId+'"]');
        var display = document.getElementById('live-grade-'+empId);
        if (!input || !display) return;

        var val = parseFloat(input.value);
        var g;
        if (isNaN(val) || input.value.trim() === '') {
            g = { grade: '-', label: 'ไม่มีข้อมูล', color: '#999' };
        } else {
            g = Store.getGrade(val);
        }
        display.innerHTML = '<span class="grade-badge" style="background:'+g.color+'">'+g.grade+'</span>' +
            '<span class="live-grade-label" style="color:'+g.color+'">'+g.label+'</span>';

        // Also update the header score display
        var headerScore = document.querySelector('.md-score[data-emp="'+empId+'"]');
        if (headerScore) {
            headerScore.textContent = isNaN(val) ? '-' : val.toFixed(1);
        }
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
        var reason = prompt('เหตุผลที่ส่งกลับ (พนักงานจะต้องทำประเมินใหม่):');
        if (reason === null) return;
        // Remove all evaluations for this employee so they can redo
        Store.evaluations = Store.evaluations.filter(function(e) {
            return !(e.employeeId === empId && e.status === 'reviewed');
        });
        // Store reject reason for reference
        Store.evaluations.push({
            id: 'REJ'+Date.now(),
            employeeId: empId, type: 'reject_notice', questionId: 'system',
            answer: reason, status: 'rejected', date: new Date().toISOString()
        });
        Store.save();
        showToast('ส่งกลับแล้ว — พนักงานจะต้องทำประเมินใหม่','info');
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
                var autoAvg = ratings.length>0?ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length:null;
                var mdTotal = evals[0].mdTotalScore;
                var finalScore = (mdTotal !== undefined && mdTotal !== null) ? mdTotal : autoAvg;
                var g = Store.getGrade(finalScore);
                var secScores = Store.calcSectionScores(empId);
                var w = Store.sectionWeights || Store._defaultWeights();

                html += '<div class="result-card"><div class="result-card-header"><div><h4>'+(emp?emp.name:empId)+'</h4><small>'+(emp?(emp.department+' - '+(emp.position||'')):'')+'</small></div>';
                html += '<div class="score-grade-box"><div class="score">'+(finalScore!==null?finalScore.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
                if(finalScore!==null){var pct=(finalScore/5)*100;html+='<div class="score-bar"><div class="score-bar-fill" style="width:'+pct+'%;background:'+g.color+'"></div></div><p class="grade-label" style="color:'+g.color+'">'+g.label+(mdTotal!==null&&mdTotal!==undefined?' (MD กำหนด)':'')+'</p>';}

                // Section scores
                html += '<div class="section-scores-panel">';
                html += '<div class="section-scores-grid">';
                html += '<div class="sec-score-item sec-score-kpi"><span class="sec-score-label">🎯 '+(w.kpiTitle||'KPI')+'</span><span class="sec-score-value">'+secScores.kpi.toFixed(1)+'/'+w.kpi+'</span><div class="sec-score-bar"><div class="sec-score-fill" style="width:'+(w.kpi>0?(secScores.kpi/w.kpi)*100:0)+'%;background:#0d47a1;"></div></div></div>';
                html += '<div class="sec-score-item sec-score-q"><span class="sec-score-label">📝 '+(w.questionsTitle||'คำถาม')+'</span><span class="sec-score-value">'+secScores.questions.toFixed(1)+'/'+w.questions+'</span><div class="sec-score-bar"><div class="sec-score-fill" style="width:'+(w.questions>0?(secScores.questions/w.questions)*100:0)+'%;background:#4a148c;"></div></div></div>';
                html += '<div class="sec-score-item sec-score-att"><span class="sec-score-label">📅 '+(w.attendanceTitle||'ขาด/ลา/สาย')+'</span><span class="sec-score-value">'+secScores.attendance.toFixed(1)+'/'+w.attendance+'</span><div class="sec-score-bar"><div class="sec-score-fill" style="width:'+(w.attendance>0?(secScores.attendance/w.attendance)*100:0)+'%;background:#bf360c;"></div></div></div>';
                html += '</div>';
                html += '<div class="sec-score-total"><strong>รวม: '+secScores.total.toFixed(1)+' / 100</strong></div>';
                html += '</div>';

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

    // ==================== Manager: Self Evaluation ====================
    renderMgrSelfEval: function() {
        var mgrId = this.currentUser.id;
        var myQuestions = Store.getQuestionsForEmployee(mgrId);
        var answeredIds = Store.evaluations.filter(function(e){return e.employeeId===mgrId;}).map(function(e){return e.questionId;});
        var unanswered = myQuestions.filter(function(q){return answeredIds.indexOf(q.id)===-1;});

        var kpiSubmitted = Store.evaluations.some(function(e){return e.employeeId===mgrId && e.type==='kpi';});
        var attendanceSubmitted = Store.evaluations.some(function(e){return e.employeeId===mgrId && e.type==='attendance';});

        var html = '<div class="section active"><div class="container"><h2 class="section-title">📝 ประเมินตัวเอง</h2>';

        // Status
        var myEvals = Store.evaluations.filter(function(e){return e.employeeId===mgrId;});
        if (myEvals.length > 0) {
            var statusCounts = {submitted:0, reviewed:0, approved:0};
            myEvals.forEach(function(e){if(statusCounts[e.status]!==undefined)statusCounts[e.status]++;});
            html += '<div class="workflow-info"><h4>สถานะการประเมินตัวเอง</h4><div class="status-summary">';
            html += '<span class="badge badge-info">📤 ส่ง MD แล้ว: '+(statusCounts.submitted+statusCounts.reviewed)+'</span> ';
            html += '<span class="badge badge-evaluated">✅ อนุมัติ: '+statusCounts.approved+'</span>';
            html += '</div></div>';
        }

        html += '<form id="mgr-self-eval-form">';

        // ส่วนที่ 1: KPI
        html += '<div class="eval-section-block">';
        html += '<div class="eval-section-header"><span class="eval-section-num">1</span><h3>KPI ของตัวเอง</h3></div>';
        if (kpiSubmitted) {
            html += '<p class="empty-state">✅ คุณส่ง KPI แล้ว</p>';
        } else {
            html += '<p class="section-desc">ระบุเป้าหมายและผลงานของคุณในรอบนี้</p>';
            html += '<div class="form-group"><label>เป้าหมาย KPI ของคุณ <span class="required">*</span></label>';
            html += '<textarea id="mgr-kpi-goals" rows="3" class="text-answer" required placeholder="เช่น บริหารทีมให้ปิดโปรเจค 5 งาน..."></textarea></div>';
            html += '<div class="form-group"><label>ผลงานที่ทำได้ <span class="required">*</span></label>';
            html += '<textarea id="mgr-kpi-results" rows="3" class="text-answer" required placeholder="เช่น ปิดโปรเจคได้ 6 งาน..."></textarea></div>';
            html += '<div class="form-group"><label>คะแนน KPI ที่ประเมินตัวเอง (1-5) <span class="required">*</span></label>';
            html += '<div class="rating-group">';
            var labels = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
            for (var k=5;k>=1;k--) html += '<label class="rating-label"><input type="radio" name="mgr_kpi_score" value="'+k+'" required> '+labels[k]+' ('+k+')</label>';
            html += '</div></div>';
        }
        html += '</div>';

        // ส่วนที่ 2: คำถามบังคับ
        html += '<div class="eval-section-block">';
        html += '<div class="eval-section-header"><span class="eval-section-num">2</span><h3>แบบประเมินตามคำถาม</h3></div>';
        if (unanswered.length === 0) {
            html += '<p class="empty-state">✅ คุณตอบคำถามครบทุกข้อแล้ว</p>';
        } else {
            html += '<p class="section-desc">ตอบคำถามที่กำหนดให้ ('+unanswered.length+' ข้อ)</p>';
            unanswered.forEach(function(q, idx) {
                var isReq = q.required !== 'no';
                html += '<div class="eval-category"><h4>ข้อ '+(idx+1)+(isReq?' <span class="required">*</span>':'')+'</h4>';
                html += '<p class="question-text-display">'+q.text+'</p>';
                if (q.description) html += '<p class="question-desc">'+q.description+'</p>';
                if (q.type === 'rating') {
                    html += '<div class="rating-group">';
                    var lb = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
                    for (var i=5;i>=1;i--) html += '<label class="rating-label"><input type="radio" name="q_'+q.id+'" value="'+i+'"'+(isReq?' required':'')+'> '+lb[i]+' ('+i+')</label>';
                    html += '</div>';
                } else if (q.type === 'text') {
                    html += '<input type="text" name="q_'+q.id+'" class="text-answer" placeholder="พิมพ์คำตอบ..."'+(isReq?' required':'')+'>';
                } else if (q.type === 'paragraph') {
                    html += '<textarea name="q_'+q.id+'" rows="4" class="text-answer" placeholder="พิมพ์คำตอบ..."'+(isReq?' required':'')+'></textarea>';
                } else if (q.type === 'multiple_choice') {
                    html += '<div class="choice-group">';
                    (q.options||[]).forEach(function(opt) { html += '<label class="choice-label"><input type="radio" name="q_'+q.id+'" value="'+opt+'"'+(isReq?' required':'')+'> '+opt+'</label>'; });
                    html += '</div>';
                } else if (q.type === 'checkbox') {
                    html += '<div class="choice-group">';
                    (q.options||[]).forEach(function(opt) { html += '<label class="choice-label"><input type="checkbox" name="q_'+q.id+'" value="'+opt+'"> '+opt+'</label>'; });
                    html += '</div>';
                } else if (q.type === 'dropdown') {
                    html += '<select name="q_'+q.id+'" class="text-answer"'+(isReq?' required':'')+'><option value="">-- เลือก --</option>';
                    (q.options||[]).forEach(function(opt) { html += '<option value="'+opt+'">'+opt+'</option>'; });
                    html += '</select>';
                }
                html += '</div>';
            });
        }
        html += '</div>';

        // ส่วนที่ 3: ขาด ลา มาสาย
        html += '<div class="eval-section-block">';
        html += '<div class="eval-section-header"><span class="eval-section-num">3</span><h3>การขาด ลา มาสาย</h3></div>';
        if (attendanceSubmitted) {
            html += '<p class="empty-state">✅ คุณส่งข้อมูลการขาด/ลา/มาสายแล้ว</p>';
        } else {
            html += '<p class="section-desc">กรอกข้อมูลการขาด ลา มาสาย ในรอบประเมินนี้</p>';
            html += '<div class="grade-form-row">';
            html += '<div class="form-group"><label>จำนวนวันขาดงาน</label><input type="number" id="mgr-att-absent" min="0" value="0" class="text-answer"></div>';
            html += '<div class="form-group"><label>จำนวนวันลากิจ</label><input type="number" id="mgr-att-leave-personal" min="0" value="0" class="text-answer"></div>';
            html += '<div class="form-group"><label>จำนวนวันลาป่วย</label><input type="number" id="mgr-att-leave-sick" min="0" value="0" class="text-answer"></div>';
            html += '</div><div class="grade-form-row">';
            html += '<div class="form-group"><label>จำนวนวันลาพักร้อน</label><input type="number" id="mgr-att-leave-vacation" min="0" value="0" class="text-answer"></div>';
            html += '<div class="form-group"><label>จำนวนครั้งมาสาย</label><input type="number" id="mgr-att-late" min="0" value="0" class="text-answer"></div>';
            html += '</div>';
            html += '<div class="form-group"><label>หมายเหตุ (ถ้ามี)</label><input type="text" id="mgr-att-note" class="text-answer" placeholder="เช่น ลาป่วย 2 วัน..."></div>';
        }
        html += '</div>';

        // Submit
        var hasAnything = !kpiSubmitted || unanswered.length > 0 || !attendanceSubmitted;
        if (hasAnything) {
            html += '<div class="form-actions"><button type="submit" class="btn btn-primary">ส่งแบบประเมินตัวเอง</button></div>';
        } else {
            html += '<p class="empty-state">🎉 คุณส่งข้อมูลครบทุกส่วนแล้ว!</p>';
        }

        html += '</form></div></div>';
        return html;
    },

    bindMgrSelfEval: function() {
        var form = document.getElementById('mgr-self-eval-form');
        if (!form) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            App.submitMgrSelfEval();
        });
    },

    submitMgrSelfEval: function() {
        var mgrId = this.currentUser.id;
        var kpiSubmitted = Store.evaluations.some(function(e){return e.employeeId===mgrId && e.type==='kpi';});
        var attendanceSubmitted = Store.evaluations.some(function(e){return e.employeeId===mgrId && e.type==='attendance';});

        // Part 1: KPI
        if (!kpiSubmitted) {
            var kpiGoals = document.getElementById('mgr-kpi-goals');
            var kpiResults = document.getElementById('mgr-kpi-results');
            var kpiScore = document.querySelector('input[name="mgr_kpi_score"]:checked');
            if (!kpiGoals || !kpiGoals.value.trim()) { showToast('กรุณากรอกเป้าหมาย KPI','error'); return; }
            if (!kpiResults || !kpiResults.value.trim()) { showToast('กรุณากรอกผลงาน KPI','error'); return; }
            if (!kpiScore) { showToast('กรุณาให้คะแนน KPI','error'); return; }
            Store.evaluations.push({
                id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                employeeId: mgrId, type: 'kpi', questionId: 'kpi_self',
                score: parseInt(kpiScore.value),
                answer: 'เป้าหมาย: '+kpiGoals.value.trim()+' | ผลงาน: '+kpiResults.value.trim(),
                status: 'reviewed', date: new Date().toISOString(),
                evaluatedBy: mgrId, isSelfEval: true
            });
        }

        // Part 2: Questions
        var myQuestions = Store.getQuestionsForEmployee(mgrId);
        var answeredIds = Store.evaluations.filter(function(e){return e.employeeId===mgrId;}).map(function(e){return e.questionId;});
        var unanswered = myQuestions.filter(function(q){return answeredIds.indexOf(q.id)===-1;});

        for (var i=0; i<unanswered.length; i++) {
            var q = unanswered[i];
            var isReq = q.required !== 'no';
            var evalEntry = {
                id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                employeeId: mgrId, questionId: q.id, type: q.type,
                status: 'reviewed', date: new Date().toISOString(),
                evaluatedBy: mgrId, isSelfEval: true
            };

            if (q.type === 'rating') {
                var sel = document.querySelector('input[name="q_'+q.id+'"]:checked');
                if (!sel && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                if (sel) evalEntry.score = parseInt(sel.value); else evalEntry.answer = '-';
            } else if (q.type === 'multiple_choice') {
                var chosen = document.querySelector('input[name="q_'+q.id+'"]:checked');
                if (!chosen && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = chosen ? chosen.value : '-';
            } else if (q.type === 'checkbox') {
                var checks = document.querySelectorAll('input[name="q_'+q.id+'"]:checked');
                var vals = []; checks.forEach(function(c){vals.push(c.value);});
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
                var ta = document.querySelector('textarea[name="q_'+q.id+'"]');
                if ((!ta || !ta.value.trim()) && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = ta ? ta.value.trim() : '-';
            }
            Store.evaluations.push(evalEntry);
        }

        // Part 3: Attendance
        if (!attendanceSubmitted) {
            var absent = document.getElementById('mgr-att-absent') ? parseInt(document.getElementById('mgr-att-absent').value)||0 : 0;
            var leavePersonal = document.getElementById('mgr-att-leave-personal') ? parseInt(document.getElementById('mgr-att-leave-personal').value)||0 : 0;
            var leaveSick = document.getElementById('mgr-att-leave-sick') ? parseInt(document.getElementById('mgr-att-leave-sick').value)||0 : 0;
            var leaveVacation = document.getElementById('mgr-att-leave-vacation') ? parseInt(document.getElementById('mgr-att-leave-vacation').value)||0 : 0;
            var late = document.getElementById('mgr-att-late') ? parseInt(document.getElementById('mgr-att-late').value)||0 : 0;
            var note = document.getElementById('mgr-att-note') ? document.getElementById('mgr-att-note').value.trim() : '';
            Store.evaluations.push({
                id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                employeeId: mgrId, type: 'attendance', questionId: 'attendance',
                answer: 'ขาด: '+absent+' วัน, ลากิจ: '+leavePersonal+' วัน, ลาป่วย: '+leaveSick+' วัน, ลาพักร้อน: '+leaveVacation+' วัน, มาสาย: '+late+' ครั้ง'+(note?' ('+note+')':''),
                absent: absent, leavePersonal: leavePersonal, leaveSick: leaveSick, leaveVacation: leaveVacation, late: late, note: note,
                status: 'reviewed', date: new Date().toISOString(),
                evaluatedBy: mgrId, isSelfEval: true
            });
        }

        Store.save();
        showToast('ส่งแบบประเมินตัวเองสำเร็จ! ส่งให้ MD อนุมัติแล้ว','success');
        this.render('mgr-self-eval'); this.bindMgrSelfEval();
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
        html += '<p class="section-desc">ตรวจสอบ/แก้ไขแบบประเมินจากพนักงานในแผนก ' + dept + ' แล้วส่งต่อให้ MD</p>';

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

                // Editable answers
                html += '<div class="result-answers">';
                evals.forEach(function(ev) {
                    var q = Store.questions.find(function(q){return q.id===ev.questionId;});
                    var qText = q ? q.text : 'ลบแล้ว';
                    html += '<div class="result-answer-item editable-item">';
                    html += '<span class="q-label">'+qText+'</span>';
                    if (ev.type === 'rating') {
                        html += '<select class="edit-score-select" data-eval-id="'+ev.id+'">';
                        for (var s=5; s>=1; s--) {
                            var labels = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
                            html += '<option value="'+s+'"'+(ev.score===s?' selected':'')+'>'+s+' - '+labels[s]+'</option>';
                        }
                        html += '</select>';
                    } else {
                        html += '<input type="text" class="edit-answer-input" data-eval-id="'+ev.id+'" value="'+(ev.answer||'').replace(/"/g,'&quot;')+'">';
                    }
                    html += '</div>';
                });
                html += '</div>';

                if (evals[0].rejectReason) html += '<p class="reject-reason">⚠️ MD ส่งกลับ: '+evals[0].rejectReason+'</p>';
                html += '<div class="form-group" style="margin-top:1rem;"><label>ความเห็นหัวหน้าแผนก (ถ้ามี)</label><textarea class="mgr-comment-input text-answer" data-emp="'+empId+'" rows="2" placeholder="ความเห็นเพิ่มเติม..."></textarea></div>';
                html += '<div class="form-actions"><button class="btn btn-primary save-edit-btn" data-emp="'+empId+'">💾 บันทึกการแก้ไข</button><button class="btn btn-success send-md-btn" data-emp="'+empId+'">📤 ส่งให้ MD อนุมัติ</button></div></div>';
            });
        }
        html += '</div></div>';
        return html;
    },

    bindMgrReview: function() {
        document.querySelectorAll('.save-edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                App.saveEditedScores(btn.dataset.emp);
            });
        });
        document.querySelectorAll('.send-md-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var empId = btn.dataset.emp;
                // Save edits first, then send
                App.saveEditedScores(empId);
                var commentEl = document.querySelector('.mgr-comment-input[data-emp="'+empId+'"]');
                var comment = commentEl ? commentEl.value : '';
                App.sendToMd(empId, comment);
            });
        });
    },

    saveEditedScores: function(empId) {
        var changed = false;
        // Update rating scores
        document.querySelectorAll('.edit-score-select').forEach(function(sel) {
            var evalId = sel.dataset.evalId;
            var ev = Store.evaluations.find(function(e){return e.id===evalId && e.employeeId===empId;});
            if (ev) {
                var newScore = parseInt(sel.value);
                if (ev.score !== newScore) { ev.score = newScore; ev.editedBy = App.currentUser.id; changed = true; }
            }
        });
        // Update text answers
        document.querySelectorAll('.edit-answer-input').forEach(function(inp) {
            var evalId = inp.dataset.evalId;
            var ev = Store.evaluations.find(function(e){return e.id===evalId && e.employeeId===empId;});
            if (ev) {
                var newAnswer = inp.value.trim();
                if (ev.answer !== newAnswer) { ev.answer = newAnswer; ev.editedBy = App.currentUser.id; changed = true; }
            }
        });
        if (changed) {
            Store.save();
            showToast('บันทึกการแก้ไขสำเร็จ','success');
        }
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
        var mgrId = this.currentUser.id;
        var myEmps = Store.getEmployees().filter(function(e){return e.department===dept && e.id !== mgrId;});
        var empIds = myEmps.map(function(e){return e.id;});
        var approved = Store.evaluations.filter(function(e){return e.status==='approved' && empIds.indexOf(e.employeeId)!==-1 && e.employeeId !== mgrId;});

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
                var autoAvg = ratings.length>0?ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length:null;
                var mdTotal = evals[0].mdTotalScore;
                var finalScore = (mdTotal !== undefined && mdTotal !== null) ? mdTotal : autoAvg;
                var g = Store.getGrade(finalScore);
                html += '<div class="result-card"><div class="result-card-header"><div><h4>'+(emp?emp.name:empId)+'</h4></div>';
                html += '<div class="score-grade-box"><div class="score">'+(finalScore!==null?finalScore.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
                if(finalScore!==null){var pct=(finalScore/5)*100;html+='<div class="score-bar"><div class="score-bar-fill" style="width:'+pct+'%;background:'+g.color+'"></div></div><p class="grade-label" style="color:'+g.color+'">'+g.label+'</p>';}
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

        // Check if KPI and attendance already submitted
        var kpiSubmitted = Store.evaluations.some(function(e){return e.employeeId===empId && e.type==='kpi';});
        var attendanceSubmitted = Store.evaluations.some(function(e){return e.employeeId===empId && e.type==='attendance';});

        var html = '<div class="section active"><div class="container"><h2 class="section-title">📝 ทำแบบประเมิน</h2>';

        // Check for reject notice
        var rejectNotice = Store.evaluations.filter(function(e){return e.employeeId===empId && e.status==='rejected';});
        if (rejectNotice.length > 0) {
            var lastReject = rejectNotice[rejectNotice.length-1];
            html += '<div class="reject-reason" style="margin-bottom:1rem;">⚠️ <strong>MD ส่งกลับให้ทำใหม่:</strong> '+(lastReject.answer||'ไม่ระบุเหตุผล')+'<br><small>กรุณาทำแบบประเมินใหม่อีกครั้ง</small></div>';
        }

        // Status
        var myEvals = Store.evaluations.filter(function(e){return e.employeeId===empId && e.type!=='reject_notice';});
        if (myEvals.length > 0) {
            var statusCounts = {submitted:0, reviewed:0, approved:0};
            myEvals.forEach(function(e){if(statusCounts[e.status]!==undefined)statusCounts[e.status]++;});
            html += '<div class="workflow-info"><h4>สถานะการประเมินของคุณ</h4><div class="status-summary">';
            html += '<span class="badge badge-pending">📥 รอหัวหน้าตรวจ: '+statusCounts.submitted+'</span> ';
            html += '<span class="badge badge-info">📤 ส่ง MD แล้ว: '+statusCounts.reviewed+'</span> ';
            html += '<span class="badge badge-evaluated">✅ อนุมัติ: '+statusCounts.approved+'</span>';
            html += '</div></div>';
        }

        html += '<form id="emp-eval-form">';

        // ==================== ส่วนที่ 1: KPI ====================
        html += '<div class="eval-section-block">';
        html += '<div class="eval-section-header"><span class="eval-section-num">1</span><h3>KPI ของตัวเอง</h3></div>';
        if (kpiSubmitted) {
            html += '<p class="empty-state">✅ คุณส่ง KPI แล้ว</p>';
        } else {
            html += '<p class="section-desc">ระบุเป้าหมายและผลงานของคุณในรอบนี้</p>';
            html += '<div class="form-group"><label>เป้าหมาย KPI ของคุณ <span class="required">*</span></label>';
            html += '<textarea id="kpi-goals" rows="3" class="text-answer" required placeholder="เช่น ยอดขาย 1 ล้านบาท, ปิดโปรเจค 3 งาน..."></textarea></div>';
            html += '<div class="form-group"><label>ผลงานที่ทำได้ <span class="required">*</span></label>';
            html += '<textarea id="kpi-results" rows="3" class="text-answer" required placeholder="เช่น ยอดขายได้ 1.2 ล้านบาท, ปิดโปรเจคได้ 4 งาน..."></textarea></div>';
            html += '<div class="form-group"><label>คะแนน KPI ที่ประเมินตัวเอง (1-5) <span class="required">*</span></label>';
            html += '<div class="rating-group">';
            var labels = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
            for (var k=5;k>=1;k--) html += '<label class="rating-label"><input type="radio" name="kpi_score" value="'+k+'" required> '+labels[k]+' ('+k+')</label>';
            html += '</div></div>';
        }
        html += '</div>';

        // ==================== ส่วนที่ 2: คำถามบังคับ ====================
        html += '<div class="eval-section-block">';
        html += '<div class="eval-section-header"><span class="eval-section-num">2</span><h3>แบบประเมินตามคำถาม</h3></div>';
        if (unanswered.length === 0) {
            html += '<p class="empty-state">✅ คุณตอบคำถามครบทุกข้อแล้ว</p>';
        } else {
            html += '<p class="section-desc">ตอบคำถามที่กำหนดให้ ('+unanswered.length+' ข้อ)</p>';
            unanswered.forEach(function(q, idx) {
                var isReq = q.required !== 'no';
                html += '<div class="eval-category"><h4>ข้อ '+(idx+1)+(isReq?' <span class="required">*</span>':'')+'</h4>';
                html += '<p class="question-text-display">'+q.text+'</p>';
                if (q.description) html += '<p class="question-desc">'+q.description+'</p>';

                if (q.type === 'rating') {
                    html += '<div class="rating-group">';
                    var lb = {5:'ดีเยี่ยม',4:'ดี',3:'ปานกลาง',2:'ต้องปรับปรุง',1:'ไม่ผ่าน'};
                    for (var i=5;i>=1;i--) html += '<label class="rating-label"><input type="radio" name="q_'+q.id+'" value="'+i+'"'+(isReq?' required':'')+'> '+lb[i]+' ('+i+')</label>';
                    html += '</div>';
                } else if (q.type === 'text') {
                    html += '<input type="text" name="q_'+q.id+'" class="text-answer" placeholder="พิมพ์คำตอบ..."'+(isReq?' required':'')+'>';
                } else if (q.type === 'paragraph') {
                    html += '<textarea name="q_'+q.id+'" rows="4" class="text-answer" placeholder="พิมพ์คำตอบ..."'+(isReq?' required':'')+'></textarea>';
                } else if (q.type === 'multiple_choice') {
                    html += '<div class="choice-group">';
                    (q.options||[]).forEach(function(opt) { html += '<label class="choice-label"><input type="radio" name="q_'+q.id+'" value="'+opt+'"'+(isReq?' required':'')+'> '+opt+'</label>'; });
                    html += '</div>';
                } else if (q.type === 'checkbox') {
                    html += '<div class="choice-group">';
                    (q.options||[]).forEach(function(opt) { html += '<label class="choice-label"><input type="checkbox" name="q_'+q.id+'" value="'+opt+'"> '+opt+'</label>'; });
                    html += '</div>';
                } else if (q.type === 'dropdown') {
                    html += '<select name="q_'+q.id+'" class="text-answer"'+(isReq?' required':'')+'><option value="">-- เลือกคำตอบ --</option>';
                    (q.options||[]).forEach(function(opt) { html += '<option value="'+opt+'">'+opt+'</option>'; });
                    html += '</select>';
                }
                html += '</div>';
            });
        }
        html += '</div>';

        // ==================== ส่วนที่ 3: ขาด ลา มาสาย ====================
        html += '<div class="eval-section-block">';
        html += '<div class="eval-section-header"><span class="eval-section-num">3</span><h3>การขาด ลา มาสาย</h3></div>';
        if (attendanceSubmitted) {
            html += '<p class="empty-state">✅ คุณส่งข้อมูลการขาด/ลา/มาสายแล้ว</p>';
        } else {
            html += '<p class="section-desc">กรอกข้อมูลการขาด ลา มาสาย ในรอบประเมินนี้</p>';
            html += '<div class="grade-form-row">';
            html += '<div class="form-group"><label>จำนวนวันขาดงาน</label><input type="number" id="att-absent" min="0" value="0" class="text-answer"></div>';
            html += '<div class="form-group"><label>จำนวนวันลากิจ</label><input type="number" id="att-leave-personal" min="0" value="0" class="text-answer"></div>';
            html += '<div class="form-group"><label>จำนวนวันลาป่วย</label><input type="number" id="att-leave-sick" min="0" value="0" class="text-answer"></div>';
            html += '</div><div class="grade-form-row">';
            html += '<div class="form-group"><label>จำนวนวันลาพักร้อน</label><input type="number" id="att-leave-vacation" min="0" value="0" class="text-answer"></div>';
            html += '<div class="form-group"><label>จำนวนครั้งมาสาย</label><input type="number" id="att-late" min="0" value="0" class="text-answer"></div>';
            html += '</div>';
            html += '<div class="form-group"><label>หมายเหตุ (ถ้ามี)</label><input type="text" id="att-note" class="text-answer" placeholder="เช่น ลาป่วย 2 วัน, ลากิจ 1 วัน..."></div>';
        }
        html += '</div>';

        // Submit button
        var hasAnythingToSubmit = !kpiSubmitted || unanswered.length > 0 || !attendanceSubmitted;
        if (hasAnythingToSubmit) {
            html += '<div class="form-actions"><button type="submit" class="btn btn-primary">ส่งแบบประเมิน</button></div>';
        } else {
            html += '<p class="empty-state">🎉 คุณส่งข้อมูลครบทุกส่วนแล้ว!</p>';
        }

        html += '</form>';
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
        var kpiSubmitted = Store.evaluations.some(function(e){return e.employeeId===empId && e.type==='kpi';});
        var attendanceSubmitted = Store.evaluations.some(function(e){return e.employeeId===empId && e.type==='attendance';});

        // Part 1: KPI
        if (!kpiSubmitted) {
            var kpiGoals = document.getElementById('kpi-goals');
            var kpiResults = document.getElementById('kpi-results');
            var kpiScore = document.querySelector('input[name="kpi_score"]:checked');
            if (!kpiGoals || !kpiGoals.value.trim()) { showToast('กรุณากรอกเป้าหมาย KPI','error'); return; }
            if (!kpiResults || !kpiResults.value.trim()) { showToast('กรุณากรอกผลงาน KPI','error'); return; }
            if (!kpiScore) { showToast('กรุณาให้คะแนน KPI','error'); return; }
            Store.evaluations.push({
                id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                employeeId: empId, type: 'kpi', questionId: 'kpi_self',
                score: parseInt(kpiScore.value),
                answer: 'เป้าหมาย: '+kpiGoals.value.trim()+' | ผลงาน: '+kpiResults.value.trim(),
                status: 'submitted', date: new Date().toISOString()
            });
        }

        // Part 2: Questions
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
                var vals = []; checks.forEach(function(c){vals.push(c.value);});
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
                var ta = document.querySelector('textarea[name="q_'+q.id+'"]');
                if ((!ta || !ta.value.trim()) && isReq) { showToast('กรุณาตอบคำถามที่จำเป็น','error'); return; }
                evalEntry.answer = ta ? ta.value.trim() : '-';
            }
            Store.evaluations.push(evalEntry);
        }

        // Part 3: Attendance
        if (!attendanceSubmitted) {
            var absent = document.getElementById('att-absent') ? parseInt(document.getElementById('att-absent').value)||0 : 0;
            var leavePersonal = document.getElementById('att-leave-personal') ? parseInt(document.getElementById('att-leave-personal').value)||0 : 0;
            var leaveSick = document.getElementById('att-leave-sick') ? parseInt(document.getElementById('att-leave-sick').value)||0 : 0;
            var leaveVacation = document.getElementById('att-leave-vacation') ? parseInt(document.getElementById('att-leave-vacation').value)||0 : 0;
            var late = document.getElementById('att-late') ? parseInt(document.getElementById('att-late').value)||0 : 0;
            var note = document.getElementById('att-note') ? document.getElementById('att-note').value.trim() : '';
            Store.evaluations.push({
                id: 'E'+Date.now()+Math.random().toString(36).substring(2,6),
                employeeId: empId, type: 'attendance', questionId: 'attendance',
                answer: 'ขาด: '+absent+' วัน, ลากิจ: '+leavePersonal+' วัน, ลาป่วย: '+leaveSick+' วัน, ลาพักร้อน: '+leaveVacation+' วัน, มาสาย: '+late+' ครั้ง'+(note?' ('+note+')':''),
                absent: absent, leavePersonal: leavePersonal, leaveSick: leaveSick, leaveVacation: leaveVacation, late: late, note: note,
                status: 'submitted', date: new Date().toISOString()
            });
        }

        Store.save();
        showToast('ส่งแบบประเมินสำเร็จ! รอหัวหน้าแผนกตรวจสอบ','success');
        this.render('emp-evaluate'); this.bindEmpEvaluate();
    },

    // ==================== Employee: Results ====================
    renderEmpResults: function() {
        var empId = this.currentUser.id;
        var allMyEvals = Store.evaluations.filter(function(e){return e.employeeId===empId;});
        var approved = allMyEvals.filter(function(e){return e.status==='approved';});
        var submitted = allMyEvals.filter(function(e){return e.status==='submitted';});
        var reviewed = allMyEvals.filter(function(e){return e.status==='reviewed';});

        var html = '<div class="section active"><div class="container"><h2 class="section-title">📋 ผลประเมินของฉัน</h2>';

        if (allMyEvals.length === 0) {
            html += '<p class="empty-state">ยังไม่มีผลการประเมิน</p>';
            html += '</div></div>';
            return html;
        }

        // Status summary
        html += '<div class="workflow-info"><h4>สถานะการประเมินของคุณ</h4><div class="status-summary">';
        html += '<span class="badge badge-pending">📥 รอหัวหน้าตรวจ: '+submitted.length+'</span> ';
        html += '<span class="badge badge-info">📤 ส่ง MD แล้ว: '+reviewed.length+'</span> ';
        html += '<span class="badge badge-evaluated">✅ อนุมัติแล้ว: '+approved.length+'</span>';
        html += '</div></div>';

        // Show approved results with scores
        if (approved.length > 0) {
            var ratings = approved.filter(function(e){return e.type==='rating';});
            var autoAvg = ratings.length>0?ratings.reduce(function(s,e){return s+e.score;},0)/ratings.length:null;
            var mdTotal = approved[0].mdTotalScore;
            var finalScore = (mdTotal !== undefined && mdTotal !== null) ? mdTotal : autoAvg;
            var g = Store.getGrade(finalScore);

            html += '<div class="result-card" style="max-width:700px;">';
            html += '<div class="result-card-header"><div><h4>ผลประเมินที่อนุมัติแล้ว</h4><small>'+approved.length+' รายการ</small></div>';
            html += '<div class="score-grade-box"><div class="score">'+(finalScore!==null?finalScore.toFixed(1):'-')+'</div><div class="grade-badge" style="background:'+g.color+'">'+g.grade+'</div></div></div>';
            if (finalScore!==null) {
                var pct=(finalScore/5)*100;
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

        // Show pending items (no scores, just status)
        if (submitted.length > 0 || reviewed.length > 0) {
            html += '<div class="result-card" style="max-width:700px;margin-top:1.5rem;">';
            html += '<div class="result-card-header"><div><h4>⏳ รอดำเนินการ</h4><small>คำตอบที่ส่งไปแล้ว ยังไม่ได้รับการอนุมัติ</small></div></div>';
            html += '<div class="result-answers">';
            submitted.concat(reviewed).forEach(function(ev){
                var q = Store.questions.find(function(q){return q.id===ev.questionId;});
                var statusLabel = ev.status === 'submitted' ? '<span class="badge badge-pending">รอหัวหน้าตรวจ</span>' : '<span class="badge badge-info">ส่ง MD แล้ว</span>';
                html += '<div class="result-answer-item"><span class="q-label">'+(q?q.text:'ลบแล้ว')+'</span>'+statusLabel+'</div>';
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
