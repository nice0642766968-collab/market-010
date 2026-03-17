const firebaseConfig = {
    apiKey: "AIzaSyAmbzRxqYFti6IEksy2WunKCVa_v8Gg0F0",
    authDomain: "market-digital-3d10e.firebaseapp.com",
    projectId: "market-digital-3d10e",
    storageBucket: "market-digital-3d10e.firebasestorage.app",
    messagingSenderId: "368580098929",
    appId: "1:368580098929:web:7e005211ceb83b3b9794d0",
    measurementId: "G-Q985QSMDDT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLoginMode = true;
let currentActiveChatId = null;

// --- 1. Authentication ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authStatusText').innerText = isLoginMode ? "เข้าสู่ระบบเพื่อเริ่มใช้งาน" : "สมัครสมาชิกเพื่อเข้าสู่ตลาด";
    document.getElementById('btnAuthMain').innerText = isLoginMode ? "เข้าสู่ระบบ" : "สมัครสมาชิก";
    document.getElementById('btnToggle').innerText = isLoginMode ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
    document.getElementById('toggleMsg').innerText = isLoginMode ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?";
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
        else await auth.createUserWithEmailAndPassword(email, pass);
    } catch (e) { alert(e.message); }
}

auth.onAuthStateChanged(user => {
    document.getElementById('authContainer').style.display = user ? 'none' : 'flex';
    document.getElementById('appContainer').style.display = user ? 'block' : 'none';
    if (user) loadPosts();
});

function handleLogout() { auth.signOut(); }

// --- 2. Marketplace & Calculation ---
function updateSplit() {
    const total = document.getElementById('pTotal').value || 0;
    const count = document.getElementById('pCount').value || 1;
    const result = (total / count).toFixed(2);
    document.getElementById('splitResult').innerText = `ยอดต่อคน: ฿${result}`;
}

async function savePost() {
    const post = {
        title: document.getElementById('pTitle').value,
        cat: document.getElementById('pCat').value,
        totalPrice: Number(document.getElementById('pTotal').value),
        split: Number(document.getElementById('pCount').value),
        desc: document.getElementById('pDesc').value,
        owner: auth.currentUser.email,
        time: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("market_posts").add(post);
    closeModal();
}

function loadPosts() {
    db.collection("market_posts").orderBy("time", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const data = doc.data();
            const perPerson = (data.totalPrice / data.split).toFixed(2);
            grid.innerHTML += `
                <div class="card">
                    <small>${data.cat}</small>
                    <h3>${data.title}</h3>
                    <p class="price-tag">฿${perPerson} ${data.split > 1 ? '<small>/คน</small>' : ''}</p>
                    <button class="btn-primary" onclick="openChat('${doc.id}', '${data.title}')">💬 สนใจ / สอบถาม</button>
                </div>
            `;
        });
    });
}

// --- 3. Chat Logic ---
function openChat(id, title) {
    currentActiveChatId = id;
    document.getElementById('chatBox').style.display = 'flex';
    document.getElementById('chatTitle').innerText = title;
    db.collection("market_posts").doc(id).collection("chats").orderBy("time")
    .onSnapshot(snap => {
        const box = document.getElementById('chatMessages');
        box.innerHTML = '';
        snap.forEach(m => {
            const d = m.data();
            box.innerHTML += `<div><b>${d.user.split('@')[0]}:</b> ${d.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

async function sendMsg() {
    const text = document.getElementById('msgInput').value;
    if (!text) return;
    await db.collection("market_posts").doc(currentActiveChatId).collection("chats").add({
        text, user: auth.currentUser.email, time: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msgInput').value = '';
}

// Helpers
function openModal() { document.getElementById('postModal').style.display = 'flex'; }
function closeModal() { document.getElementById('postModal').style.display = 'none'; }
function closeChat() { document.getElementById('chatBox').style.display = 'none'; }
