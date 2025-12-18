import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

async function getStoredPassword() {
  const entry = await kv.get(["config", "admin_password"]);
  return entry.value as string | null;
}

const UI_HEAD = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1024"> 
  <title>Winner-Match Deno Dev</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes glow { 0%, 100% { text-shadow: 0 0 10px #ef4444; color: #ef4444; } 50% { text-shadow: 0 0 25px #ef4444; color: #ff5f5f; } }
    .win-effect { animation: glow 1.2s infinite; font-weight: 900; }
    body { background-color: #0c0c0c; color: #fff; font-family: sans-serif; font-size: 14px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #111; border: 1px solid #222; }
    .match-row { background-color: #141414; border-bottom: 1px solid #222; text-align: center; }
    .match-row:hover { background-color: #1a1a1a; }
    .stripe-input { width: 100%; padding: 12px; border: 1px solid #333; background: #1a1a1a; border-radius: 5px; color: #fff; font-size: 16px; margin-bottom: 15px; outline: none; }
    .btn-main { background: #f3ca52; color: #000; width: 100%; padding: 14px; border-radius: 5px; font-weight: 900; cursor: pointer; }
    .unlock-btn { background: #0070f3; color: #fff; padding: 8px 20px; border-radius: 99px; font-weight: 900; font-size: 12px; cursor: pointer; border: none; box-shadow: 0 4px 14px rgba(0,118,255,0.4); text-transform: uppercase; }
    .page-btn { background: #222; color: #888; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; margin: 0 4px; border: 1px solid #333; }
    .page-btn.active { background: #f3ca52; color: #000; border-color: #f3ca52; }
    #toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; }
    .toast { background: #1a1a1a; border-left: 4px solid #f3ca52; color: white; padding: 12px 20px; border-radius: 6px; margin-bottom: 8px; transform: translateX(120%); transition: 0.3s; font-weight: bold; font-size: 12px; }
    .toast.show { transform: translateX(0); }
    #custom-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; visibility: hidden; opacity: 0; transition: 0.2s; }
    #custom-modal.active { visibility: visible; opacity: 1; }
    .modal-content { background: #1a1a1a; padding: 25px; border-radius: 12px; max-width: 320px; width: 90%; text-align: center; border: 2px solid #f3ca52; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. HOME PAGE & USER DASHBOARD
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6">
      <div id="toast-container"></div>
      <div id="custom-modal"><div class="modal-content"><h3 id="modal-msg" class="text-md font-bold mb-6 text-yellow-500 uppercase italic">Confirm?</h3><div class="flex gap-3"><button id="modal-yes" class="flex-1 bg-yellow-600 text-black font-black py-2 rounded-md text-xs">YES</button><button onclick="closeModal()" class="flex-1 bg-zinc-800 text-zinc-400 font-bold py-2 rounded-md text-xs">NO</button></div></div></div>
      <div id="pass-modal" class="fixed inset-0 bg-black/90 hidden items-center justify-center z-[10001]"><div class="modal-content"><h3 class="text-md font-bold mb-6 text-yellow-500 uppercase italic">Change Password</h3><input type="password" id="oldPass" placeholder="Current Password" class="stripe-input"><input type="password" id="newPass" placeholder="New Password" class="stripe-input"><div class="flex gap-3"><button onclick="submitPassChange()" class="flex-1 bg-yellow-600 text-black font-black py-2 rounded-md text-xs">UPDATE</button><button onclick="document.getElementById('pass-modal').style.display='none'" class="flex-1 bg-zinc-800 text-zinc-400 font-bold py-2 rounded-md text-xs">CANCEL</button></div></div></div>

      <div class="max-w-[1050px] mx-auto text-center">
        <header class="py-12"><h1 class="text-6xl font-black italic text-yellow-500 uppercase tracking-tighter">Winner-Match Deno Dev</h1></header>
        <section class="mb-12 px-10 text-center">
          <h2 class="text-2xl font-bold text-white mb-4 uppercase tracking-[0.2em]">Premium Football Intelligence</h2>
          <p class="text-zinc-500 text-lg leading-relaxed italic max-w-3xl mx-auto">Expert analysis powered by statistical data for high-accuracy predictions.</p>
        </section>

        <div id="guest-ui">
          <div class="max-w-md mx-auto card-bg p-10 rounded-2xl shadow-2xl border-t-4 border-yellow-500 mb-20">
             <h2 class="text-2xl font-black mb-6 italic uppercase text-yellow-500">Member Login</h2>
             <input type="text" id="uName" class="stripe-input" placeholder="Username"><input type="password" id="uPass" class="stripe-input" placeholder="Password">
             <div class="flex items-center gap-2 mb-6 text-left"><input type="checkbox" id="rememberMe" class="w-4 h-4"><label for="rememberMe" class="text-zinc-500 text-[10px] font-bold uppercase">Remember Me</label></div>
             <button onclick="doLogin()" class="btn-main uppercase tracking-widest">Login</button>
          </div>
          <div class="grid grid-cols-2 gap-10 mb-20 max-w-4xl mx-auto text-center">
              <div class="card-bg rounded-2xl p-10 border-b-4 border-yellow-600 shadow-2xl transition hover:-translate-y-1"><h2 class="text-6xl font-black mb-4">$70</h2><p class="text-zinc-200 text-xs font-black uppercase tracking-widest italic">7 Tips Package</p></div>
              <div class="card-bg rounded-2xl p-10 border-b-4 border-sky-600 shadow-2xl transition hover:-translate-y-1"><h2 class="text-6xl font-black mb-4">$250</h2><p class="text-zinc-200 text-xs font-black uppercase tracking-widest italic">30 Tips VIP Bundle</p></div>
          </div>
        </div>

        <div id="dashboard-header" class="hidden">
           <div class="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 mb-8 flex justify-between items-center text-left">
              <div><h2 class="text-yellow-500 font-black text-3xl uppercase italic tracking-tighter">Member: <span id="displayUser" class="text-white"></span></h2>
              <div class="flex gap-6 mt-3 items-center">
                <p class="text-zinc-400 text-sm font-bold uppercase tracking-widest">Balance: <span id="displayCredits" class="text-2xl bg-sky-900 text-sky-400 px-4 py-1 rounded-lg ml-1 font-black border border-sky-800">0</span> <span class="text-[10px] ml-1">Credits</span></p>
                <button onclick="document.getElementById('pass-modal').style.display='flex'" class="text-sky-500 underline text-xs font-black uppercase">Change Password</button>
              </div></div>
              <button onclick="logout()" class="bg-zinc-800 px-6 py-2 rounded font-bold text-xs uppercase border border-zinc-700">Logout</button>
           </div>
        </div>

        <div class="card-bg rounded-2xl overflow-hidden shadow-2xl">
          <table class="w-full border-collapse">
            <thead><tr class="gold-gradient text-black text-[11px] font-black uppercase">
              <th class="p-4 border-r border-black/10">Date</th><th class="p-4 border-r border-black/10">Match Details</th>
              <th class="p-4 border-r border-black/10">Over Line</th><th class="p-4 border-r border-black/10">Odds</th>
              <th class="p-4 border-r border-black/10 text-center">Score</th><th class="p-4 text-center">Status</th>
            </tr></thead>
            <tbody id="tips-table-body"></tbody>
          </table>
        </div>
        <div id="pagination" class="flex justify-center items-center gap-2 mt-12 mb-20"></div>
        <footer class="py-16 border-t border-zinc-900 text-center"><p class="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">&copy; 2025 WINNER-MATCH.DENO.DEV | ALL RIGHTS RESERVED</p></footer>
      </div>

      <script>
        let currentPage = 1; const pageSize = 20;
        function showToast(m, t='info'){ const c=document.getElementById('toast-container'); const el=document.createElement('div'); el.className='toast '+t; el.innerText=m; c.appendChild(el); setTimeout(()=>el.classList.add('show'),10); setTimeout(()=>{el.classList.remove('show'); setTimeout(()=>el.remove(),300)},3000); }
        function askConfirm(m, y){ document.getElementById('modal-msg').innerText=m; document.getElementById('custom-modal').classList.add('active'); document.getElementById('modal-yes').onclick=()=>{ y(); closeModal(); }; }
        function closeModal(){ document.getElementById('custom-modal').classList.remove('active'); }
        async function doLogin(){
          const u=document.getElementById('uName').value; const p=document.getElementById('uPass').value; const rem=document.getElementById('rememberMe').checked;
          const res=await fetch('/api/user-login',{method:'POST',body:JSON.stringify({user:u,pass:p})});
          if(res.ok){ const d=await res.json(); d.remUntil=rem?Date.now()+(5*24*60*60*1000):null; localStorage.setItem('winner_user',JSON.stringify(d)); location.reload(); }
          else { showToast('Invalid Login!','error'); }
        }
        function logout(){ localStorage.removeItem('winner_user'); location.reload(); }
        async function submitPassChange() {
          const oldPass = document.getElementById('oldPass').value; const newPass = document.getElementById('newPass').value;
          const res = await fetch('/api/user-change-password', { method: 'POST', body: JSON.stringify({ user: userData.user, oldPass, newPass }) });
          if(res.ok) { showToast('✅ Password Updated!', 'success'); setTimeout(()=>logout(), 1500); } else { showToast('❌ ' + await res.text(), 'error'); }
        }
        const userData=JSON.parse(localStorage.getItem('winner_user')); let isLoggedIn=false;
        if(userData){ if(userData.remUntil && Date.now()>userData.remUntil){ logout(); } else { isLoggedIn=true; document.getElementById('guest-ui').classList.add('hidden'); document.getElementById('dashboard-header').classList.remove('hidden'); document.getElementById('displayUser').innerText=userData.user; document.getElementById('displayCredits').innerText=userData.credits||0; } }

        async function fetchTips(page = 1){
          const res=await fetch('/api/tips?page=' + page + '&limit=' + pageSize); const {data, totalPages}=await res.json();
          const unlocked=userData?(userData.unlockedTips||[]):[];
          document.getElementById('tips-table-body').innerHTML=data.map(t=>{
            const isPending=t.status==='Pending'; const isUnlocked=unlocked.includes(t.id)||!isPending;
            let mTxt=isUnlocked?t.match:'<span class="text-yellow-600/70 tracking-widest font-black uppercase text-[10px]">Locked Info</span>';
            let tTxt=isUnlocked?('<span class="text-white font-bold">'+t.tip+'</span>'):(isLoggedIn?'<button onclick="unlockTip(\\''+t.id+'\\')" class="unlock-btn">UNLOCK TIP</button>':'<span class="text-yellow-400 font-bold uppercase tracking-tighter">Locked 🔒</span>');
            let sClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : (t.status === 'Draw' ? 'text-zinc-400' : 'text-sky-600'));
            return '<tr class="match-row"><td class="p-4 text-zinc-200 text-sm font-black border-r border-white/5">'+t.date+'</td><td class="p-4 text-yellow-500 font-bold text-lg border-r border-white/5">'+mTxt+'</td><td class="p-4 border-r border-white/5">'+tTxt+'</td><td class="p-4 text-zinc-500 font-mono border-r border-white/5 text-center">'+(isUnlocked?t.odds:'-')+'</td><td class="p-4 font-black text-2xl text-zinc-300 border-r border-white/5 text-center">'+(t.result||'-:-')+'</td><td class="p-4 '+sClass+' italic text-3xl uppercase tracking-tighter">'+t.status+'</td></tr>';
          }).join('');
          let pgHtml = ''; for(let i=1; i<=totalPages; i++) pgHtml += '<button onclick="fetchTips(' + i + ')" class="page-btn ' + (i === page ? 'active' : '') + '">' + i + '</button>';
          document.getElementById('pagination').innerHTML = pgHtml;
          if(page > 1) window.scrollTo({ top: 600, behavior: 'smooth' });
        }
        async function unlockTip(id){ askConfirm('Unlock for 1 credit?',async()=>{
          const r=await fetch('/api/unlock-tip',{method:'POST',body:JSON.stringify({user:userData.user,pass:userData.pass,tipId:id})});
          if(r.ok){ const d=await r.json(); localStorage.setItem('winner_user',JSON.stringify(d)); location.reload(); } else { showToast(await r.text(),'error'); }
        }); }
        fetchTips(currentPage);
      </script></body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. ADMIN PANEL
  if (url.pathname === "/admin" && req.method === "GET") {
    let adminUI = "";
    if (!storedPass) {
       adminUI = '<div class="card-bg p-8 rounded-xl"><input type="password" id="newPass" class="stripe-input" placeholder="Setup Password"><button onclick="setPass()" class="btn-main">SETUP</button></div>' +
                 '<script>async function setPass(){ const pass=document.getElementById("newPass").value; await fetch("/api/config",{method:"POST",body:JSON.stringify({pass})}); location.reload(); }</script>';
    } else {
       adminUI = `
        <div id="admin-login-box" class="card-bg p-8 rounded-xl shadow-2xl max-w-sm mx-auto">
           <input type="password" id="adminPassInput" class="stripe-input" placeholder="Admin Key"><button onclick="adminLogin()" class="btn-main uppercase">Login Admin</button>
        </div>
        <div id="admin-dashboard" class="hidden">
          <div class="flex justify-between items-center mb-8 bg-zinc-900 p-4 rounded-lg"><span class="font-black text-yellow-500 uppercase text-[10px]">Session Active</span><button onclick="sessionStorage.removeItem('admin_key'); location.reload();" class="text-zinc-500 underline text-[10px]">Logout</button></div>
          <div class="card-bg p-6 rounded-xl mb-12 border-t-4 border-green-600 shadow-2xl"><h3 class="text-green-500 font-black mb-4 uppercase text-xs tracking-widest">Live Unlock History</h3><div id="history-list" class="space-y-2 max-h-[300px] overflow-y-auto pr-2"></div></div>
          <div class="card-bg p-8 rounded-2xl mb-12 shadow-2xl border-t-4 border-sky-500"><h3 class="text-sky-500 font-black mb-4 uppercase text-xs">Credit Manager (Top-up)</h3><div class="grid grid-cols-2 gap-4"><input type="text" id="targetUser" placeholder="User" class="stripe-input"><input type="number" id="targetCredits" placeholder="ADD Credits" class="stripe-input"></div><input type="text" id="targetPass" placeholder="User Pass (Empty to Keep)" class="stripe-input"><button onclick="saveUser()" class="bg-sky-600 w-full py-4 rounded font-bold text-xs uppercase tracking-widest">Update User</button></div>
          <div id="user-list" class="space-y-2 mb-12"></div>
          <div class="card-bg p-8 rounded-2xl border-t-4 border-yellow-500 mb-10"><h3 class="text-yellow-500 font-black mb-4 uppercase text-xs">Post Tip with Time Lock</h3><input type="text" id="tipId" placeholder="ID (Auto for New)" class="stripe-input"><div class="grid grid-cols-2 gap-4"><input type="text" id="date" placeholder="Date (19/12)" class="stripe-input"><input type="time" id="lockTime" class="stripe-input"></div><input type="text" id="match" placeholder="Match Details" class="stripe-input"><input type="text" id="tip" placeholder="Over Line" class="stripe-input"><div class="grid grid-cols-2 gap-4"><input type="text" id="odds" placeholder="Odds" class="stripe-input"><input type="text" id="result" placeholder="Score" class="stripe-input"></div><select id="status" class="stripe-input !bg-zinc-900"><option value="Pending">Pending</option><option value="Win">Win</option><option value="Draw">Draw</option><option value="Lose">Lose</option></select><button onclick="saveTip()" class="bg-yellow-600 text-black w-full py-4 rounded font-black uppercase">SAVE TIP</button></div>
          <div id="admin-tips" class="space-y-2"></div>
        </div>
        <script>
          const adminSessionKey = sessionStorage.getItem('admin_key');
          if(adminSessionKey) { document.getElementById('admin-login-box').classList.add('hidden'); document.getElementById('admin-dashboard').classList.remove('hidden'); loadAdminData(); }
          async function adminLogin() { const p = document.getElementById('adminPassInput').value; const r = await fetch('/api/admin-verify', { method: 'POST', body: JSON.stringify({ pass: p }) }); if(r.ok) { sessionStorage.setItem('admin_key', p); location.reload(); } else { alert('Wrong Key!'); } }
          async function saveUser() { const d = { adminKey: adminSessionKey, user: document.getElementById('targetUser').value, pass: document.getElementById('targetPass').value, credits: parseInt(document.getElementById('targetCredits').value || 0) }; const r = await fetch('/api/create-user', { method: 'POST', body: JSON.stringify(d) }); if(r.ok) location.reload(); else alert('Failed!'); }
          async function saveTip() { const d = { password: adminSessionKey, id: document.getElementById('tipId').value, date: document.getElementById('date').value, match: document.getElementById('match').value, tip: document.getElementById('tip').value, odds: document.getElementById('odds').value, result: document.getElementById('result').value, status: document.getElementById('status').value, lockTime: document.getElementById('lockTime').value }; await fetch('/api/tips', { method: 'POST', body: JSON.stringify(d) }); if(r.ok) location.reload(); else alert('Error!'); }
          async function loadAdminData() {
            const r1 = await fetch('/api/admin-users'); const u = await r1.json(); document.getElementById('user-list').innerHTML = u.map(x => '<div class="card-bg p-3 flex justify-between items-center text-xs border-l-4 border-sky-600"><div><span class="font-bold text-white">'+x.user+'</span><span class="ml-4 bg-sky-900/50 text-sky-400 px-3 py-0.5 rounded-full font-black">Cr: '+(x.credits||0)+'</span></div><button onclick=\\'deleteU("'+x.user+'")\\' class="text-red-500 underline uppercase">Del</button></div>').join('');
            const r2 = await fetch('/api/tips?admin=true'); const t = await r2.json(); document.getElementById('admin-tips').innerHTML = t.data.map(y => '<div class="card-bg p-3 flex justify-between items-center text-xs border-l-2 border-yellow-500/50"><span>['+y.date+'] '+y.match+'</span><button onclick=\\'editT('+JSON.stringify(y)+')\\' class="text-sky-400 underline font-bold uppercase">Edit</button></div>').join('');
            const r3 = await fetch('/api/admin-history'); const h = await r3.json(); document.getElementById('history-list').innerHTML = h.map(i => '<div class="bg-zinc-900/30 p-2 border-b border-zinc-800 text-[10px]"><span class="text-sky-400 font-bold">'+i.user+'</span> unlocked <span class="text-yellow-500">'+i.match+'</span> <span class="text-zinc-600 italic">('+i.time+')</span></div>').join('');
          }
          window.deleteU = async (u) => { if(!confirm('Delete?')) return; await fetch('/api/delete-user', { method: 'POST', body: JSON.stringify({ adminKey: adminSessionKey, user: u }) }); location.reload(); };
          window.editT = (t) => { document.getElementById('tipId').value=t.id; document.getElementById('date').value=t.date; document.getElementById('match').value=t.match; document.getElementById('tip').value=t.tip; document.getElementById('odds').value=t.odds; document.getElementById('result').value=t.result||''; document.getElementById('status').value=t.status; document.getElementById('lockTime').value=t.lockTime||''; window.scrollTo({top: 400, behavior:'smooth'}); };
        </script>`;
    }
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto"><h2 class="text-3xl font-black text-yellow-500 mb-8 italic uppercase text-center tracking-tighter">Admin Console</h2>${adminUI}</body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API HANDLERS ---
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const page = parseInt(url.searchParams.get("page") || "1"); const limit = parseInt(url.searchParams.get("limit") || "20");
    const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
    tips.sort((a, b) => Number(b.id) - Number(a.id)); const startIndex = (page - 1) * limit;
    return new Response(JSON.stringify({ data: tips.slice(startIndex, startIndex + limit), totalPages: Math.ceil(tips.length / limit) }));
  }
  if (url.pathname === "/api/unlock-tip" && req.method === "POST") {
    const { user, pass, tipId } = await req.json(); const uE = await kv.get(["users", user]); const tE = await kv.get(["tips", tipId]); if (!uE.value || uE.value.pass !== pass) return new Response("Error", { status: 401 });
    const tip = tE.value; if (tip.lockTime) { const now = new Date(); const mmt = new Date(now.getTime() + (6.5 * 60 * 60 * 1000)); const [h, m] = tip.lockTime.split(':'); const lockD = new Date(mmt.getTime()); lockD.setHours(parseInt(h), parseInt(m), 0); if (mmt.getTime() > lockD.getTime()) return new Response("Time Expired!", { status: 400 }); }
    const u = uE.value; if ((u.credits || 0) <= 0) return new Response("No Credits!", { status: 400 }); if (u.unlockedTips?.includes(tipId)) return new Response(JSON.stringify(u));
    const updated = { ...u, credits: u.credits - 1, unlockedTips: [...(u.unlockedTips || []), tipId] }; await kv.set(["users", user], updated); await kv.set(["history", Date.now().toString()], { user, match: tip.match, time: new Date().toLocaleTimeString('en-GB') }); return new Response(JSON.stringify(updated));
  }
  if (url.pathname === "/api/admin-history" && req.method === "GET") { const iter = kv.list({ prefix: ["history"] }); const h = []; for await (const res of iter) h.push(res.value); return new Response(JSON.stringify(h.reverse().slice(0, 50))); }
  if (url.pathname === "/api/tips" && req.method === "POST") { const body = await req.json(); if (body.password !== storedPass) return new Response("Error", { status: 401 }); const id = body.id || Date.now().toString(); await kv.set(["tips", id], { ...body, id }); return new Response("OK"); }
  if (url.pathname === "/api/admin-verify" && req.method === "POST") { const { pass } = await req.json(); return pass === storedPass ? new Response("OK") : new Response("Error", { status: 401 }); }
  if (url.pathname === "/api/user-change-password" && req.method === "POST") { const { user, oldPass, newPass } = await req.json(); const e = await kv.get(["users", user]); if (!e.value || e.value.pass !== oldPass) return new Response("Current Password Incorrect!", { status: 401 }); await kv.set(["users", user], { ...e.value, pass: newPass }); return new Response("OK"); }
  if (url.pathname === "/api/user-login" && req.method === "POST") { const { user, pass } = await req.json(); const entry = await kv.get(["users", user]); if (entry.value && entry.value.pass === pass) return new Response(JSON.stringify(entry.value)); return new Response("Error", { status: 401 }); }
  if (url.pathname === "/api/create-user" && req.method === "POST") { const { adminKey, user, pass, credits } = await req.json(); if (adminKey !== storedPass) return new Response("Error", { status: 401 }); const ex = await kv.get(["users", user]); const old = ex.value || { credits: 0, unlockedTips: [] }; const fPass = pass || old.pass; await kv.set(["users", user], { ...old, user, pass: fPass, credits: (old.credits || 0) + (credits || 0) }); return new Response("OK"); }
  if (url.pathname === "/api/admin-users" && req.method === "GET") { const iter = kv.list({ prefix: ["users"] }); const u = []; for await (const res of iter) u.push(res.value); return new Response(JSON.stringify(u)); }
  if (url.pathname === "/api/delete-user" && req.method === "POST") { const { adminKey, user } = await req.json(); if (adminKey !== storedPass) return new Response("Error", { status: 401 }); await kv.delete(["users", user]); return new Response("OK"); }
  if (url.pathname === "/api/config" && req.method === "POST") { const { pass } = await req.json(); await kv.set(["config", "admin_password"], pass); return new Response("OK"); }
  return new Response("Not Found", { status: 404 });
});
