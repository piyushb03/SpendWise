const API_URL = "https://piyush2233.pythonanywhere.com/api";
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let allTransactions = [];
let expenseChart = null;

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showApp();
    } else {
        showAuth();
    }
});

// --- Helper: Password Strength ---
function isPasswordStrong(pw) {
    // Regex: At least 8 chars, 1 number, 1 special char
    const strongRegex = new RegExp("^(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    return strongRegex.test(pw);
}

// --- Auth ---
function showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    document.getElementById('user-name-display').innerText = currentUser.fullname;
    document.getElementById('avatar-initial').innerText = currentUser.fullname.charAt(0).toUpperCase();
    document.getElementById('edit-fullname').value = currentUser.fullname;
    document.getElementById('edit-email').value = currentUser.email;
    fetchData();
}

function toggleAuth(view) {
    document.getElementById('login-form').classList.toggle('hidden', view === 'register');
    document.getElementById('register-form').classList.toggle('hidden', view === 'login');
}

async function handleRegister(e) {
    e.preventDefault();
    const [fullname, email, password, confirmPassword] = ['reg-name', 'reg-email', 'reg-pass', 'reg-confirm'].map(id => document.getElementById(id).value);
    
    if(password !== confirmPassword) return alert("Passwords mismatch");
    if(!isPasswordStrong(password)) return alert("Password weak: 8+ chars, 1 number, 1 symbol required.");

    try {
        const res = await fetch(`${API_URL}/register`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({fullname, email, password, confirmPassword}) });
        if(res.ok) { alert("Success! Login now."); toggleAuth('login'); }
        else alert((await res.json()).message);
    } catch(e) { alert("Error connecting to server"); }
}

async function handleLogin(e) {
    e.preventDefault();
    const [email, password] = ['login-email', 'login-pass'].map(id => document.getElementById(id).value);
    try {
        const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({email, password}) });
        const data = await res.json();
        if(res.ok) { currentUser = data.user; localStorage.setItem('user', JSON.stringify(currentUser)); showApp(); }
        else alert(data.message);
    } catch(e) { alert("Error connecting to server"); }
}

function logout() {
    localStorage.removeItem('user');
    location.reload();
}

// --- Navigation ---
function switchView(viewName) {
    ['dashboard', 'transactions', 'settings'].forEach(v => {
        document.getElementById(`view-${v}`).classList.add('hidden');
        document.getElementById(`nav-${v}`).classList.remove('active-link');
    });
    document.getElementById(`view-${viewName}`).classList.remove('hidden');
    document.getElementById(`nav-${viewName}`).classList.add('active-link');
    
    const titles = { dashboard: "Dashboard", transactions: "All Transactions", settings: "Account Settings" };
    document.getElementById('header-title').innerText = titles[viewName];

    if(viewName === 'transactions') renderTransactionTable(allTransactions);
    if(viewName === 'settings') loadTrash();
}

// --- Data Fetching ---
async function fetchData() {
    try {
        const res = await fetch(`${API_URL}/dashboard/${currentUser.id}`);
        const data = await res.json();
        allTransactions = data.transactions;
        
        document.getElementById('val-income').innerText = `Rs ${data.financials.income.toFixed(2)}`;
        document.getElementById('val-expense').innerText = `Rs ${data.financials.expense.toFixed(2)}`;
        
        const bal = data.financials.balance;
        const balEl = document.getElementById('val-balance');
        const ind = document.getElementById('balance-indicator');
        const balMsg = document.getElementById('balance-msg');
        
        const formattedBal = bal < 0 ? `-Rs ${Math.abs(bal).toFixed(2)}` : `Rs ${bal.toFixed(2)}`;
        balEl.innerText = formattedBal;
        balEl.className = `text-3xl font-bold ${bal >= 0 ? 'text-green-600' : 'text-red-600'}`;
        ind.className = `p-3 rounded-xl ${bal >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`;
        balMsg.innerText = bal >= 0 ? "You are in good standing" : "You have overspent this month";
        balMsg.className = bal >= 0 ? "text-xs text-green-500 mt-2" : "text-xs text-red-400 mt-2";

        renderChart(data.chart_data);
        renderDashboardList(data.transactions.slice(0, 5));
        renderTransactionTable(data.transactions);
    } catch(e) { console.error(e); }
}

// --- Rendering ---
function renderDashboardList(txs) {
    const tbody = document.getElementById('dashboard-table');
    tbody.innerHTML = txs.map(t => `
        <tr class="border-b border-gray-100 last:border-none">
            <td class="py-3 font-medium capitalize text-gray-800">${t.title}</td>
            <td class="py-3"><span class="text-xs px-2 py-1 rounded capitalize ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${t.type}</span></td>
            <td class="py-3 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">${t.type === 'income' ? '+' : '-'}Rs ${t.amount.toFixed(2)}</td>
        </tr>
    `).join('');
}

function renderTransactionTable(txs) {
    const tbody = document.getElementById('full-transaction-list');
    if(txs.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">No transactions found.</td></tr>`; return; }
    tbody.innerHTML = txs.map(t => `
        <tr class="hover:bg-gray-50 transition border-b border-gray-100">
            <td class="px-6 py-4 text-gray-500">${t.date}</td>
            <td class="px-6 py-4 font-medium capitalize text-gray-800">${t.title}</td>
            <td class="px-6 py-4"><span class="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-bold">${t.category}</span></td>
            <td class="px-6 py-4 capitalize text-xs text-gray-500">${t.type}</td>
            <td class="px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">${t.type === 'income' ? '+' : '-'}Rs ${t.amount.toFixed(2)}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="openEditModal(${t.id})" class="text-blue-500 hover:text-blue-700 mr-3"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteTransaction(${t.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function applyFilters() {
    const type = document.getElementById('filter-type').value;
    const cat = document.getElementById('filter-cat').value;
    let filtered = allTransactions.filter(t => (type === 'all' || t.type === type) && (cat === 'all' || t.category === cat));
    renderTransactionTable(filtered);
}

function renderChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if(expenseChart) expenseChart.destroy();
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{ data: data.values, backgroundColor: ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#666', boxWidth: 10 } } } }
    });
}

// --- Modals & CRUD ---
function openModal() {
    document.getElementById('transaction-modal').classList.remove('hidden');
    document.getElementById('modal-title').innerText = "New Transaction";
    document.getElementById('t-id').value = "";
    document.getElementById('t-title').value = "";
    document.getElementById('t-amount').value = "";
    setModalType('expense');
}

function openEditModal(id) {
    const t = allTransactions.find(x => x.id === id);
    if(!t) return;
    openModal();
    document.getElementById('modal-title').innerText = "Edit Transaction";
    document.getElementById('t-id').value = t.id;
    document.getElementById('t-title').value = t.title;
    document.getElementById('t-amount').value = t.amount;
    document.getElementById('t-category').value = t.category;
    setModalType(t.type);
}

function closeModal() { document.getElementById('transaction-modal').classList.add('hidden'); }

function setModalType(type) {
    document.getElementById('t-type').value = type;
    const btnExp = document.getElementById('btn-type-expense');
    const btnInc = document.getElementById('btn-type-income');
    if(type === 'expense') {
        btnExp.className = "py-2 rounded-md text-sm font-bold bg-white shadow text-red-600 transition";
        btnInc.className = "py-2 rounded-md text-sm font-bold text-gray-500 hover:bg-white/50 transition";
    } else {
        btnExp.className = "py-2 rounded-md text-sm font-bold text-gray-500 hover:bg-white/50 transition";
        btnInc.className = "py-2 rounded-md text-sm font-bold bg-white shadow text-green-600 transition";
    }
}

async function handleSaveTransaction(e) {
    e.preventDefault();
    const id = document.getElementById('t-id').value;
    
    // UPDATED: Added validation to ensure amount is > 0
    const amount = parseFloat(document.getElementById('t-amount').value);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return;
    }

    const payload = {
        title: document.getElementById('t-title').value,
        amount: amount,
        category: document.getElementById('t-category').value,
        type: document.getElementById('t-type').value,
        user_id: currentUser.id
    };

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/expenses/${id}` : '/expenses';

    try {
        const res = await fetch(API_URL + endpoint, { method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
        if(res.ok) { closeModal(); fetchData(); }
    } catch(e) { alert("Save failed"); }
}

async function deleteTransaction(id) {
    if(!confirm("Move to trash?")) return;
    await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
    fetchData();
}

// --- Settings & Trash ---
async function updateProfile(e) {
    e.preventDefault();
    const fullname = document.getElementById('edit-fullname').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;
    const confirmPassword = document.getElementById('edit-password-confirm').value;
    
    const payload = { fullname, email };
    
    if(password) {
        if(password !== confirmPassword) return alert("New passwords do not match!");
        if(!isPasswordStrong(password)) return alert("New password weak: 8+ chars, 1 number, 1 symbol.");
        payload.password = password;
    }

    try {
        const res = await fetch(`${API_URL}/profile/${currentUser.id}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
        if(res.ok) {
            const data = await res.json();
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            alert("Profile updated!");
            document.getElementById('edit-password').value = '';
            document.getElementById('edit-password-confirm').value = '';
            showApp();
        } else {
            alert((await res.json()).message);
        }
    } catch(e) { alert("Update failed"); }
}

async function loadTrash() {
    const res = await fetch(`${API_URL}/trash/${currentUser.id}`);
    const data = await res.json();
    const tbody = document.getElementById('trash-list');
    if(data.length === 0) { tbody.innerHTML = `<tr><td colspan="3" class="text-center py-4 text-gray-400">Trash is empty.</td></tr>`; return; }
    
    tbody.innerHTML = data.map(t => `
        <tr>
            <td class="py-3 text-gray-600 capitalize">${t.title}</td>
            <td class="py-3 text-right font-bold">Rs ${t.amount}</td>
            <td class="py-3 text-center"><button onclick="restoreTransaction(${t.id})" class="text-green-600 hover:underline text-sm">Restore</button></td>
        </tr>
    `).join('');
}

async function restoreTransaction(id) {
    await fetch(`${API_URL}/restore/${id}`, { method: 'POST' });
    loadTrash();
    fetchData();
}
