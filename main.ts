import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

// ညီကို သတ်မှတ်ထားသော ကတ်နံပတ်
const VALID_CARD = "4242424242424242"; 

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
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. HOME PAGE & DASHBOARD
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6">
      <div class="max-w-[1050px] mx-auto text-center">
        <header class="py-12"><h1 class="text-6xl font-black italic text-yellow-500 uppercase tracking-tighter">Winner Soccer</h1></header>
        
        <div id="login-ui" class="max-w-md mx-auto card-bg p-10 rounded-2xl shadow-2xl border-t-4 border-yellow-500 mb-20">
           <h2 class="text-2xl font-black mb-6 italic uppercase text-yellow-500">Member Login</h2>
           <input type="text" id="uName" class="stripe-input" placeholder="Username">
           <input type="password" id="uPass" class="stripe-input" placeholder="Password">
           <button onclick="doLogin()" class="btn-main uppercase tracking-widest">Login to Unlock</button>
        </div>

        <div id="dashboard-header" class="hidden">
           <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-8 flex justify-between items-center text-left">
              <div>
                <h2 class="text-yellow-500 font-black text-2xl uppercase italic">Member: <span id="displayUser" class="text-white"></span></h2>
                <p class="text-zinc-500 text-sm font-bold mt-1 uppercase">Credits: <span id="displayCredits" class="bg-sky-900 text-sky-400 px-3 py-0.5 rounded ml-2">0</span></p>
              </div>
              <button onclick="logout()" class="bg-zinc-800 px-6 py-2 rounded font-bold text-xs uppercase border border-zinc-700">Logout</button>
           </div>
        </div>

        <div class="text-left border-l-8 border-yellow-500 pl-6 mb-6 flex justify-between items-center">
            <h3 class="text-yellow-500 font-black text-2xl uppercase tracking-tighter">Daily Over Records</h3>
            <span id="guest-msg" class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">All Match Names Locked for Guests</span>
        </div>

        <div class="card-bg rounded-2xl overflow-hidden shadow-2xl">
          <table class="w-full border-collapse">
            <thead><tr class="gold-gradient text-black text-[11px] font-black uppercase">
              <th class="p-4 border-r border-black/10">Date</th>
              <th class="p-4 border-r border-black/10">Match Details</th>
              <th class="p-4 border-r border-black/10">Over Line</th>
              <th class="p-4 border-r border-black/10">Odds</th>
              <th class="p-4 border-r border-black/10">Score</th>
              <th class="p-4">Status</th>
            </tr></thead>
            <tbody id="tips-table-body"></tbody>
          </table>
        </div>
        <footer class="py-16 text-[10px] font-black text-zinc-800 uppercase tracking-widest">&copy; 2025 WINNER-SOCCER.COM | SEVENTY-FIVE OVER SPECIALIST</footer>
      </div>

      <script>
        async function doLogin() {
          const user = document.getElementById('uName').value;
          const pass = document.getElementById('uPass').value;
          const res = await fetch('/api/user-login', { method: 'POST', body: JSON.stringify({ user, pass }) });
          if(res.ok) {
            const data = await res.json();
            localStorage.setItem('winner_user', JSON.stringify(data));
            location.reload();
          } else { alert('Login Failed!'); }
        }

        function logout() { localStorage.removeItem('winner_user'); location.reload(); }

        const userData = JSON.parse(localStorage.getItem('winner_user'));
        let isLoggedIn = userData ? true : false;

        if(isLoggedIn) {
          document.getElementById('login-ui').classList.add('hidden');
          document.getElementById('dashboard-header').classList.remove('hidden');
          document.getElementById('guest-msg').classList.add('hidden');
          document.getElementById('displayUser').innerText = userData.user;
          document.getElementById('displayCredits').innerText = userData.credits || 0;
          fetchTips();
        } else { fetchTips(); }

        async function fetchTips() {
          const res = await fetch('/api/tips');
          const { data } = await res.json();
          const unlocked = userData ? (userData.unlockedTips || []) : [];
          
          document.getElementById('tips-table-body').innerHTML = data.map(t => {
            const isPending = t.status === 'Pending';
            const isUnlocked = unlocked.includes(t.id) || !isPending;
            
            // Match Name နှင့် Tip နှစ်ခုလုံးကို Lock လုပ်ခြင်း
            const displayMatch = isUnlocked ? t.match : '<span class="text-zinc-700 tracking-[0.3em] font-black">??????????????????</span>';
            const displayTip = isUnlocked ? ('<span class="text-white">' + t.tip + '</span>') : 
                             (isLoggedIn ? '<button onclick="unlockTip(\\'' + t.id + '\\')" class="unlock-btn">UNLOCK TIP</button>' : 
                             '<span class="text-amber-500 font-bold uppercase">Locked 🔒</span>');
            
            const displayOdds = isUnlocked ? t.odds : '-';
            const statusClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : 'text-sky-600');
            const rowClass = t.status === 'Win' ? 'match-row win-row' : 'match-row';
            
            return '<tr class="' + rowClass + '">' +
              '<td class="p-4 text-zinc-400 text-xs font-bold border-r border-white/5">' + t.date + '</td>' +
              '<td class="p-4 text-yellow-500 font-bold text-lg border-r border-white/5">' + displayMatch + '</td>' +
              '<td class="p-4 border-r border-white/5">' + displayTip + '</td>' +
              '<td class="p-4 text-zinc-500 font-mono border-r border-white/5">' + displayOdds + '</td>' +
              '<td class="p-4 font-black text-2xl text-zinc-300 border-r border-white/5">' + (t.result || '-:-') + '</td>' +
              '<td class="p-4 ' + statusClass + ' italic text-3xl uppercase tracking-tighter">' + t.status + '</td>' +
              '</tr>';
          }).join('');
        }

        async function unlockTip(tipId) {
          if(!confirm('Unlock this match details using 1 credit?')) return;
          const res = await fetch('/api/unlock-tip', { 
            method: 'POST', 
            body: JSON.stringify({ user: userData.user, pass: userData.pass, tipId }) 
          });
          if(res.ok) {
            const newData = await res.json();
            localStorage.setItem('winner_user', JSON.stringify(newData));
            location.reload();
          } else { alert(await res.text()); }
        }
      </script>
    </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. ADMIN & API (Match Secrecy Logic)
  if (url.pathname === "/admin" && req.method === "GET") {
     const adminHtml = `<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto">
      <h2 class="text-3xl font-black text-yellow-500 mb-8 italic uppercase text-center tracking-tighter">Admin Control</h2>
      ${!storedPass ? \`<div class="card-bg p-8 rounded-xl shadow-2xl"><input type="password" id="newPass" class="stripe-input" placeholder="Set Admin Pass"><button onclick="setPass()" class="btn-main">SAVE</button></div><script>async function setPass(){ const pass=document.getElementById("newPass").value; await fetch("/api/config",{method:"POST",body:JSON.stringify({pass})}); location.reload(); }</script>\` : \`
        <div class="card-bg p-8 rounded-2xl mb-12 shadow-2xl border-t-4 border-sky-500">
          <input type="password" id="adminKey" placeholder="Admin Key" class="stripe-input">
          <div class="grid grid-cols-2 gap-4"><input type="text" id="targetUser" placeholder="User" class="stripe-input"><input type="number" id="targetCredits" placeholder="Credits" class="stripe-input"></div>
          <input type="text" id="targetPass" placeholder="Pass" class="stripe-input">
          <input type="date" id="expDate" class="stripe-input">
          <button id="createBtn" class="bg-sky-600 w-full py-4 rounded font-bold uppercase text-xs">Update Member</button>
        </div>
        <div id="user-list" class="space-y-2 mb-12"></div>
        <div class="card-bg p-8 rounded-2xl border-t-4 border-yellow-500">
          <input type="text" id="date" placeholder="Date" class="stripe-input">
          <input type="text" id="match" placeholder="Chelsea vs Arsenal" class="stripe-input">
          <input type="text" id="tip" placeholder="Over 2.5" class="stripe-input">
          <div class="grid grid-cols-2 gap-4"><input type="text" id="odds" placeholder="Odds" class="stripe-input"><input type="text" id="result" placeholder="Score" class="stripe-input"></div>
          <select id="status" class="stripe-input !bg-zinc-900"><option value="Pending">Pending</option><option value="Win">Win</option><option value="Lose">Lose</option></select>
          <button id="saveBtn" class="bg-yellow-600 w-full py-4 rounded font-black tracking-widest uppercase">Post Tip</button>
        </div>
        <script>
           // Admin Data Loading JS (Same as previous)
           async function loadAdmin(){ const res=await fetch("/api/admin-users"); const users=await res.json(); document.getElementById("user-list").innerHTML=users.map(u => '<div class="card-bg p-3 flex justify-between items-center text-xs"><span>👤 ' + u.user + ' - Credits: ' + (u.credits||0) + '</span><button onclick=\\'deleteUser("' + u.user + '")\\' class="text-red-500 font-bold uppercase underline">Del</button></div>').join(""); }
           // ... (Other Admin logic)
           loadAdmin();
        </script>
      \`}</body></html>`;
     return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // API Handlers (Login, Unlock, Create, Tips...)
  if (url.pathname === "/api/unlock-tip" && req.method === "POST") {
    const { user, pass, tipId } = await req.json();
    const uEntry = await kv.get(["users", user]);
    if (!uEntry.value || uEntry.value.pass !== pass) return new Response("Error", { status: 401 });
    const u = uEntry.value;
    if ((u.credits || 0) <= 0) return new Response("No Credits!", { status: 400 });
    const updated = { ...u, credits: u.credits - 1, unlockedTips: [...(u.unlockedTips || []), tipId] };
    await kv.set(["users", user], updated);
    return new Response(JSON.stringify(updated));
  }

  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
    tips.sort((a, b) => Number(b.id) - Number(a.id));
    return new Response(JSON.stringify({ data: tips.slice(0, 15) }));
  }

  // (Other APIs remain same)
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

  if (url.pathname === "/api/admin-users" && req.method === "GET") {
    const iter = kv.list({ prefix: ["users"] }); const u = []; for await (const res of iter) u.push(res.value);
    return new Response(JSON.stringify(u));
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json(); if (body.password !== storedPass) return new Response("Error", { status: 401 });
    const id = Date.now().toString(); await kv.set(["tips", id], { ...body, id });
    return new Response("OK");
  }

  if (url.pathname === "/api/config" && req.method === "POST") {
    const { pass } = await req.json(); await kv.set(["config", "admin_password"], pass); return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});
