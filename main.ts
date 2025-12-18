import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

async function getStoredPassword() {
  const entry = await kv.get(["config", "admin_password"]);
  return entry.value as string | null;
}

const UI_HEAD = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1024"> 
  <title>Winner Soccer Tips</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes glow { 0%, 100% { text-shadow: 0 0 10px #ef4444; color: #ef4444; } 50% { text-shadow: 0 0 25px #ef4444; color: #ff5f5f; } }
    .win-effect { animation: glow 1.2s infinite; font-weight: 900; }
    body { background-color: #0c0c0c; color: #fff; font-family: -apple-system, sans-serif; font-size: 14px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #111; border: 1px solid #222; }
    .match-row { background-color: #141414; border-bottom: 1px solid #222; text-align: center; }
    .stripe-input { width: 100%; padding: 12px; border: 1px solid #333; background: #1a1a1a; border-radius: 5px; color: #fff; font-size: 16px; margin-bottom: 15px; outline: none; }
    .btn-main { background: #f3ca52; color: #000; width: 100%; padding: 14px; border-radius: 5px; font-weight: 900; cursor: pointer; }
    .unlock-btn { background: #3182ce; color: #fff; padding: 6px 12px; border-radius: 4px; font-weight: 900; font-size: 11px; cursor: pointer; }
    
    /* Beautiful Custom Alerts Styling */
    #toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; }
    .toast { background: #1a1a1a; border-left: 4px solid #f3ca52; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin-bottom: 10px; min-width: 250px; transform: translateX(120%); transition: transform 0.3s ease-out; font-weight: 700; }
    .toast.show { transform: translateX(0); }
    .toast.error { border-left-color: #ef4444; }
    .toast.success { border-left-color: #22c55e; }

    /* Custom Confirm Modal */
    #custom-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; items-center; justify-content: center; z-index: 10000; visibility: hidden; opacity: 0; transition: 0.2s; }
    #custom-modal.active { visibility: visible; opacity: 1; }
    .modal-content { background: #1a1a1a; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%; text-align: center; border: 1px solid #333; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. HOME PAGE & USER DASHBOARD
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6">
      <div id="toast-container"></div>
      <div id="custom-modal">
         <div class="modal-content">
            <h3 id="modal-msg" class="text-xl font-bold mb-6 italic uppercase tracking-tighter">Confirm Action</h3>
            <div class="flex gap-4">
               <button id="modal-yes" class="flex-1 bg-yellow-600 text-black font-black py-3 rounded-lg">YES</button>
               <button onclick="closeModal()" class="flex-1 bg-zinc-800 text-zinc-400 font-bold py-3 rounded-lg">CANCEL</button>
            </div>
         </div>
      </div>

      <div class="max-w-[1050px] mx-auto text-center">
        <header class="py-12"><h1 class="text-6xl font-black italic text-yellow-500 uppercase tracking-tighter">Winner Soccer</h1></header>
        
        <div id="login-ui" class="max-w-md mx-auto card-bg p-10 rounded-2xl shadow-2xl border-t-4 border-yellow-500 mb-20">
           <h2 class="text-2xl font-black mb-6 italic uppercase text-yellow-500">Member Login</h2>
           <input type="text" id="uName" class="stripe-input" placeholder="Username">
           <input type="password" id="uPass" class="stripe-input" placeholder="Password">
           <div class="flex items-center gap-2 mb-6 text-left">
              <input type="checkbox" id="rememberMe" class="w-4 h-4">
              <label for="rememberMe" class="text-zinc-400 text-xs font-bold uppercase">Remember Me</label>
           </div>
           <button onclick="doLogin()" class="btn-main uppercase tracking-widest">Login to Unlock</button>
        </div>

        <div id="plans-ui" class="grid grid-cols-2 gap-10 mb-20 max-w-4xl mx-auto">
            <div class="card-bg rounded-2xl p-10 border-b-4 border-yellow-600 shadow-2xl">
                <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-sm uppercase">Standard Plan</div>
                <h2 class="text-6xl font-black mb-6">$30 <span class="text-xs text-zinc-600">/3 TIPS</span></h2>
                <div class="text-zinc-600 font-black uppercase text-xs">Buy via Admin</div>
            </div>
            <div class="card-bg rounded-2xl p-10 border-b-4 border-sky-600 shadow-2xl">
                <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-sm uppercase tracking-widest">VIP Intelligence</div>
                <h2 class="text-6xl font-black mb-6">$300 <span class="text-xs text-zinc-600">/1 TIP</span></h2>
                <div class="text-zinc-600 font-black uppercase text-xs">Join via Admin</div>
            </div>
        </div>

        <div id="dashboard-header" class="hidden">
           <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-8 flex justify-between items-center text-left">
              <div>
                <h2 class="text-yellow-500 font-black text-2xl uppercase italic">Member: <span id="displayUser" class="text-white"></span></h2>
                <p class="text-zinc-500 text-sm font-bold mt-1 uppercase">Credits: <span id="displayCredits" class="bg-sky-900 text-sky-400 px-3 py-0.5 rounded ml-2">0</span></p>
              </div>
              <button onclick="logout()" class="bg-zinc-800 px-6 py-2 rounded font-bold text-xs uppercase">Logout</button>
           </div>
        </div>

        <div class="card-bg rounded-2xl overflow-hidden shadow-2xl">
          <table class="w-full border-collapse">
            <thead><tr class="gold-gradient text-black text-[11px] font-black uppercase">
              <th class="p-4 border-r border-black/10">Date</th><th class="p-4 border-r border-black/10">Match Details</th>
              <th class="p-4 border-r border-black/10">Over Line</th><th class="p-4 border-r border-black/10">Odds</th>
              <th class="p-4 border-r border-black/10">Score</th><th class="p-4">Status</th>
            </tr></thead>
            <tbody id="tips-table-body"></tbody>
          </table>
        </div>
      </div>

      <script>
        // Professional UI Notification Logic
        function showToast(msg, type = 'info') {
          const container = document.getElementById('toast-container');
          const toast = document.createElement('div');
          toast.className = 'toast ' + type;
          toast.innerText = msg;
          container.appendChild(toast);
          setTimeout(() => toast.classList.add('show'), 10);
          setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
        }

        function askConfirm(msg, onYes) {
          document.getElementById('modal-msg').innerText = msg;
          document.getElementById('custom-modal').classList.add('active');
          document.getElementById('modal-yes').onclick = () => { onYes(); closeModal(); };
        }
        function closeModal() { document.getElementById('custom-modal').classList.remove('active'); }

        async function doLogin() {
          const user = document.getElementById('uName').value;
          const pass = document.getElementById('uPass').value;
          const remember = document.getElementById('rememberMe').checked;
          const res = await fetch('/api/user-login', { method: 'POST', body: JSON.stringify({ user, pass }) });
          if(res.ok) {
            const data = await res.json();
            data.rememberUntil = remember ? Date.now() + (5 * 24 * 60 * 60 * 1000) : null;
            localStorage.setItem('winner_user', JSON.stringify(data));
            showToast('✅ Welcome Back, ' + user, 'success');
            setTimeout(() => location.reload(), 1000);
          } else { showToast('❌ Invalid Account Details!', 'error'); }
        }

        function logout() { localStorage.removeItem('winner_user'); location.reload(); }

        const userData = JSON.parse(localStorage.getItem('winner_user'));
        let isLoggedIn = userData ? true : false;

        if(isLoggedIn) {
          const now = Date.now();
          if(userData.rememberUntil && now > userData.rememberUntil) { logout(); }
          else if(now > userData.expiry) { showToast('⚠️ Access Expired!', 'error'); setTimeout(() => logout(), 2000); }
          else {
            document.getElementById('login-ui').classList.add('hidden');
            document.getElementById('plans-ui').classList.add('hidden');
            document.getElementById('dashboard-header').classList.remove('hidden');
            document.getElementById('displayUser').innerText = userData.user;
            document.getElementById('displayCredits').innerText = userData.credits || 0;
            fetchTips();
          }
        } else { fetchTips(); }

        async function fetchTips() {
          const res = await fetch('/api/tips');
          const { data } = await res.json();
          const unlocked = userData ? (userData.unlockedTips || []) : [];
          document.getElementById('tips-table-body').innerHTML = data.map(t => {
            const isPending = t.status === 'Pending';
            const isUnlocked = unlocked.includes(t.id) || !isPending;
            let matchText = isUnlocked ? t.match : '<span class="text-zinc-800 tracking-[0.3em] font-black uppercase">Locked Info</span>';
            let tipText = isUnlocked ? ('<span class="text-white">' + t.tip + '</span>') : 
                          (isLoggedIn ? '<button onclick="unlockTip(\\'' + t.id + '\\')" class="unlock-btn">UNLOCK TIP</button>' : 
                          '<span class="text-amber-500 font-bold uppercase">Locked 🔒</span>');
            const statusClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : 'text-sky-600');
            return '<tr class="match-row">' +
              '<td class="p-4 text-zinc-300 text-xs font-bold border-r border-white/5">' + t.date + '</td>' +
              '<td class="p-4 text-yellow-500 font-bold text-lg border-r border-white/5">' + matchText + '</td>' +
              '<td class="p-4 font-black border-r border-white/5">' + tipText + '</td>' +
              '<td class="p-4 text-zinc-500 font-mono border-r border-white/5">' + (isUnlocked ? t.odds : '-') + '</td>' +
              '<td class="p-4 font-black text-2xl text-zinc-300 border-r border-white/5">' + (t.result || '-:-') + '</td>' +
              '<td class="p-4 ' + statusClass + ' italic text-3xl uppercase">' + t.status + '</td>' +
              '</tr>';
          }).join('');
        }

        async function unlockTip(tipId) {
          askConfirm('Use 1 credit to reveal this match?', async () => {
            const res = await fetch('/api/unlock-tip', { method: 'POST', body: JSON.stringify({ user: userData.user, pass: userData.pass, tipId }) });
            if(res.ok) {
              const newData = await res.json();
              localStorage.setItem('winner_user', JSON.stringify(newData));
              showToast('✅ Tip Unlocked Successfully!', 'success');
              setTimeout(() => location.reload(), 1000);
            } else { showToast('❌ ' + await res.text(), 'error'); }
          });
        }
      </script>
    </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. ADMIN PANEL
  if (url.pathname === "/admin" && req.method === "GET") {
    let adminContent = "";
    if (!storedPass) {
      adminContent = '<div class="card-bg p-8 rounded-xl shadow-2xl"><input type="password" id="newPass" placeholder="Set Admin Password" class="stripe-input"><button onclick="setPass()" class="btn-main uppercase tracking-tighter">Setup Dashboard</button></div>' +
                     '<script>async function setPass(){ const pass=document.getElementById("newPass").value; await fetch("/api/config",{method:"POST",body:JSON.stringify({pass})}); location.reload(); }</script>';
    } else {
      adminContent = '<div class="card-bg p-8 rounded-2xl mb-12 shadow-2xl border-t-4 border-sky-500"><h3 class="text-sky-500 font-black mb-6 uppercase text-xs tracking-widest">Update Member Credits</h3><input type="password" id="adminKey" placeholder="Admin Secret Key" class="stripe-input"><div class="grid grid-cols-2 gap-4"><input type="text" id="targetUser" placeholder="Username" class="stripe-input"><input type="number" id="targetCredits" placeholder="Credits" class="stripe-input"></div><div class="grid grid-cols-2 gap-4"><input type="text" id="targetPass" placeholder="User Pass" class="stripe-input"><input type="date" id="expDate" class="stripe-input"></div><button id="createBtn" class="bg-sky-600 w-full py-4 rounded font-bold uppercase text-xs">Update Member Info</button></div><div id="user-list" class="space-y-2 mb-12"></div><div class="card-bg p-8 rounded-2xl shadow-2xl border-t-4 border-yellow-500"><h3 class="text-yellow-500 font-black mb-6 uppercase text-xs tracking-widest">Post Over Tip</h3><input type="text" id="date" placeholder="Date" class="stripe-input"><input type="text" id="match" placeholder="Chelsea vs Arsenal" class="stripe-input"><input type="text" id="tip" placeholder="Over Line" class="stripe-input"><div class="grid grid-cols-2 gap-4"><input type="text" id="odds" placeholder="Odds" class="stripe-input"><input type="text" id="result" placeholder="Score" class="stripe-input"></div><select id="status" class="stripe-input !bg-zinc-900"><option value="Pending">Pending</option><option value="Win">Win</option><option value="Lose">Lose</option></select><button id="saveBtn" class="bg-yellow-600 w-full py-4 rounded font-bold uppercase tracking-widest">Post Tip</button></div>' +
                     '<script>async function loadAdmin(){ const res=await fetch("/api/admin-users"); const users=await res.json(); document.getElementById("user-list").innerHTML=users.map(u => \'<div class="card-bg p-3 flex justify-between items-center text-xs"><span>👤 \' + u.user + \' - Credits: \' + (u.credits||0) + \'</span><button onclick=\\\'deleteUser("\' + u.user + \'")\\\' class="text-red-500 font-bold uppercase underline">Del</button></div>\').join(""); }' +
                     'document.getElementById("createBtn").onclick=async()=>{ const d={ adminKey:document.getElementById("adminKey").value, user:document.getElementById("targetUser").value, pass:document.getElementById("targetPass").value, credits:parseInt(document.getElementById("targetCredits").value), expiry:new Date(document.getElementById("expDate").value).getTime() }; await fetch("/api/create-user",{method:"POST",body:JSON.stringify(d)}); location.reload(); };' +
                     'window.deleteUser=async(u)=>{ const k=document.getElementById("adminKey").value; if(!k||!confirm("Delete?"))return; await fetch("/api/delete-user",{method:"POST",body:JSON.stringify({adminKey:k,user:u})}); location.reload(); };' +
                     'document.getElementById("saveBtn").onclick=async()=>{ const d={ password:document.getElementById("adminKey").value, date:document.getElementById("date").value, match:document.getElementById("match").value, tip:document.getElementById("tip").value, odds:document.getElementById("odds").value, result:document.getElementById("result").value, status:document.getElementById("status").value }; await fetch("/api/tips",{method:"POST",body:JSON.stringify(d)}); location.reload(); }; loadAdmin();</script>';
    }
    const adminHtml = `<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto"><h2 class="text-3xl font-black text-yellow-500 mb-8 italic uppercase text-center tracking-tighter">Admin Console</h2>${adminContent}</body></html>`;
    return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API HANDLERS ---
  if (url.pathname === "/api/unlock-tip" && req.method === "POST") {
    const { user, pass, tipId } = await req.json();
    const uEntry = await kv.get(["users", user]);
    if (!uEntry.value || uEntry.value.pass !== pass) return new Response("Error", { status: 401 });
    const u = uEntry.value;
    if ((u.credits || 0) <= 0) return new Response("Credit Balance Insufficient!", { status: 400 });
    const updated = { ...u, credits: u.credits - 1, unlockedTips: [...(u.unlockedTips || []), tipId] };
    await kv.set(["users", user], updated);
    return new Response(JSON.stringify(updated));
  }

  if (url.pathname === "/api/user-login" && req.method === "POST") {
    const { user, pass } = await req.json();
    const entry = await kv.get(["users", user]);
    if (entry.value && entry.value.pass === pass) return new Response(JSON.stringify(entry.value));
    return new Response("Invalid", { status: 401 });
  }

  if (url.pathname === "/api/create-user" && req.method === "POST") {
    const { adminKey, user, pass, credits, expiry } = await req.json();
    if (adminKey !== storedPass) return new Response("Error", { status: 401 });
    const existing = await kv.get(["users", user]);
    const oldData = existing.value || { unlockedTips: [] };
    await kv.set(["users", user], { ...oldData, user, pass, credits, expiry });
    return new Response("OK");
  }

  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
    tips.sort((a, b) => Number(b.id) - Number(a.id));
    return new Response(JSON.stringify({ data: tips.slice(0, 15) }));
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json(); if (body.password !== storedPass) return new Response("Error", { status: 401 });
    const id = Date.now().toString(); await kv.set(["tips", id], { ...body, id });
    return new Response("OK");
  }

  if (url.pathname === "/api/admin-users" && req.method === "GET") {
    const iter = kv.list({ prefix: ["users"] }); const u = []; for await (const res of iter) u.push(res.value);
    return new Response(JSON.stringify(u));
  }

  if (url.pathname === "/api/delete-user" && req.method === "POST") {
    const { adminKey, user } = await req.json();
    if (adminKey !== storedPass) return new Response("Error", { status: 401 });
    await kv.delete(["users", user]); return new Response("OK");
  }

  if (url.pathname === "/api/config" && req.method === "POST") {
    const { pass } = await req.json(); await kv.set(["config", "admin_password"], pass); return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});
