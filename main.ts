import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

// Admin Password နှင့် Demo Card နံပတ်များ
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
    body { background-color: #0c0c0c; color: #fff; font-family: sans-serif; font-size: 14px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #111; border: 1px solid #222; }
    .match-row { background-color: #141414; border-bottom: 1px solid #222; text-align: center; }
    .match-row:hover { background-color: #1a1a1a; }
    
    /* Noti Box (Modal) Styling */
    #custom-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; visibility: hidden; opacity: 0; transition: 0.2s; }
    #custom-modal.active { visibility: visible; opacity: 1; }
    .modal-content { background: #1a1a1a; padding: 25px; border-radius: 12px; max-width: 320px; width: 90%; text-align: center; border: 2px solid #f3ca52; }
    
    /* UNLOCK Button - ပိုမိုထင်ရှားစေရန် ပြင်ဆင်ထားမှု */
    .unlock-btn { background: #0070f3; color: #fff; padding: 8px 20px; border-radius: 99px; font-weight: 900; font-size: 12px; cursor: pointer; border: none; box-shadow: 0 4px 14px 0 rgba(0,118,255,0.39); transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 1px; }
    .unlock-btn:active { transform: scale(0.95); box-shadow: 0 2px 4px 0 rgba(0,118,255,0.39); }

    /* Toast Notifications */
    #toast-container { position: fixed; top: 20px; right: 20px; z-index: 9999; }
    .toast { background: #1a1a1a; border-left: 4px solid #f3ca52; color: white; padding: 12px 20px; border-radius: 6px; margin-bottom: 8px; transform: translateX(120%); transition: 0.3s; font-weight: bold; font-size: 12px; }
    .toast.show { transform: translateX(0); }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. HOME PAGE
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6">
      <div id="toast-container"></div>
      <div id="custom-modal">
         <div class="modal-content">
            <h3 id="modal-msg" class="text-md font-bold mb-6 text-yellow-500 uppercase tracking-widest italic">Confirm Action</h3>
            <div class="flex gap-3">
               <button id="modal-yes" class="flex-1 bg-yellow-600 text-black font-black py-2 rounded-md text-xs">CONFIRM</button>
               <button onclick="closeModal()" class="flex-1 bg-zinc-800 text-zinc-400 font-bold py-2 rounded-md text-xs">CANCEL</button>
            </div>
         </div>
      </div>

      <div class="max-w-[1050px] mx-auto text-center">
        <header class="py-12"><h1 class="text-6xl font-black italic text-yellow-500 uppercase tracking-tighter">Winner Soccer</h1></header>
        
        <section class="mb-12 px-10">
          <h2 class="text-2xl font-bold text-white mb-4 uppercase tracking-[0.2em]">Premium Football Intelligence</h2>
          <p class="text-zinc-500 text-lg leading-relaxed italic max-w-3xl mx-auto">
            Welcome to Winner Soccer. Our expert analysis combines deep statistical data with professional market insights to deliver high-accuracy predictions. Elevate your winning game today.
          </p>
          <div class="mt-8 flex justify-center gap-6">
              <span class="text-xs font-black text-yellow-500 uppercase tracking-widest border-b-2 border-yellow-500 pb-1">✓ 90% Accuracy</span>
              <span class="text-xs font-black text-yellow-500 uppercase tracking-widest border-b-2 border-yellow-500 pb-1">✓ Expert Analysts</span>
          </div>
        </section>

        <div id="login-ui" class="max-w-md mx-auto card-bg p-10 rounded-2xl shadow-2xl border-t-4 border-yellow-500 mb-20">
           <h2 class="text-2xl font-black mb-6 italic uppercase text-yellow-500">Member Login</h2>
           <input type="text" id="uName" class="stripe-input" placeholder="Username" style="width:100%; padding:12px; border:1px solid #333; background:#1a1a1a; color:#fff; border-radius:5px; margin-bottom:15px; outline:none;">
           <input type="password" id="uPass" class="stripe-input" placeholder="Password" style="width:100%; padding:12px; border:1px solid #333; background:#1a1a1a; color:#fff; border-radius:5px; margin-bottom:15px; outline:none;">
           <div class="flex items-center gap-2 mb-6 text-left">
              <input type="checkbox" id="rememberMe" class="w-4 h-4"><label for="rememberMe" class="text-zinc-500 text-[10px] font-bold uppercase">Remember Me</label>
           </div>
           <button onclick="doLogin()" class="bg-yellow-600 text-black w-full py-4 rounded-full font-black uppercase tracking-widest">Login to Unlock</button>
        </div>

        <div id="dashboard-header" class="hidden">
           <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-8 flex justify-between items-center text-left">
              <div>
                <h2 class="text-yellow-500 font-black text-2xl uppercase italic">Member: <span id="displayUser" class="text-white"></span></h2>
                <p class="text-zinc-500 text-xs font-bold mt-1 uppercase">Credits: <span id="displayCredits" class="bg-sky-900 text-sky-400 px-3 py-0.5 rounded ml-1">0</span></p>
              </div>
              <button onclick="logout()" class="bg-zinc-800 px-6 py-2 rounded font-bold text-xs uppercase">Logout</button>
           </div>
        </div>

        <div class="text-left border-l-8 border-yellow-500 pl-6 mb-6">
            <h3 class="text-yellow-500 font-black text-2xl uppercase tracking-tighter">Verified Over History</h3>
        </div>

        <div class="card-bg rounded-2xl overflow-hidden shadow-2xl">
          <table class="w-full border-collapse">
            <thead><tr class="gold-gradient text-black text-[11px] font-black uppercase">
              <th class="p-4 border-r border-black/10">Date</th><th class="p-4 border-r border-black/10">Match Details</th>
              <th class="p-4 border-r border-black/10">Over Line</th><th class="p-4 border-r border-black/10">Odds</th>
              <th class="p-4 border-r border-black/10 text-center">Score</th><th class="p-4">Status</th>
            </tr></thead>
            <tbody id="tips-table-body"></tbody>
          </table>
        </div>
      </div>

      <script>
        function showToast(msg, type='info'){
          const c=document.getElementById('toast-container'); const t=document.createElement('div');
          t.className='toast '+type; t.innerText=msg; c.appendChild(t);
          setTimeout(()=>t.classList.add('show'),10); setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },3000);
        }
        function askConfirm(msg, onYes){ document.getElementById('modal-msg').innerText=msg; document.getElementById('custom-modal').classList.add('active'); document.getElementById('modal-yes').onclick=()=>{ onYes(); closeModal(); }; }
        function closeModal(){ document.getElementById('custom-modal').classList.remove('active'); }

        async function doLogin(){
          const u=document.getElementById('uName').value; const p=document.getElementById('uPass').value; const rem=document.getElementById('rememberMe').checked;
          const res=await fetch('/api/user-login',{method:'POST',body:JSON.stringify({user:u,pass:p})});
          if(res.ok){
            const data=await res.json(); data.remUntil=rem?Date.now()+(5*24*60*60*1000):null;
            localStorage.setItem('winner_user',JSON.stringify(data)); location.reload();
          } else { showToast('Invalid Login Credentials!','error'); }
        }
        function logout(){ localStorage.removeItem('winner_user'); location.reload(); }

        const userData=JSON.parse(localStorage.getItem('winner_user'));
        let isLoggedIn=false;
        if(userData){
          if(userData.remUntil && Date.now()>userData.remUntil){ logout(); }
          else {
            isLoggedIn=true; document.getElementById('login-ui').classList.add('hidden');
            document.getElementById('dashboard-header').classList.remove('hidden');
            document.getElementById('displayUser').innerText=userData.user; document.getElementById('displayCredits').innerText=userData.credits||0;
          }
        }

        async function fetchTips(){
          const res=await fetch('/api/tips'); const {data}=await res.json();
          const unlocked=userData?(userData.unlockedTips||[]):[];
          document.getElementById('tips-table-body').innerHTML = data.map(t=>{
            const isPending=t.status==='Pending'; const isUnlocked=unlocked.includes(t.id)||!isPending;
            // Locked Info Visibility Fix - Yellow-600
            let matchTxt=isUnlocked?t.match:'<span class="text-yellow-600/70 tracking-widest font-black uppercase text-[10px]">Locked Info</span>';
            // Unlock Button Styling Fix
            let tipTxt=isUnlocked?('<span class="text-white font-bold">'+t.tip+'</span>'):
                       (isLoggedIn?'<button onclick="unlockTip(\\''+t.id+'\\')" class="unlock-btn">UNLOCK TIP</button>':
                       '<span class="text-amber-500 font-bold uppercase">Locked 🔒</span>');
            return '<tr class="match-row">'+
              '<td class="p-4 text-zinc-300 text-xs font-bold border-r border-white/5">'+t.date+'</td>'+
              '<td class="p-4 text-yellow-500 font-bold text-lg border-r border-white/5">'+matchTxt+'</td>'+
              '<td class="p-4 border-r border-white/5">'+tipTxt+'</td>'+
              '<td class="p-4 text-zinc-500 font-mono border-r border-white/5">'+(isUnlocked?t.odds:'-')+'</td>'+
              '<td class="p-4 font-black text-2xl text-zinc-300 border-r border-white/5">'+(t.result||'-:-')+'</td>'+
              '<td class="p-4 '+(t.status==='Win'?'win-effect':(t.status==='Lose'?'text-zinc-700':'text-sky-600'))+' italic text-3xl uppercase tracking-tighter">'+t.status+'</td>'+
              '</tr>';
          }).join('');
        }
        async function unlockTip(id){ askConfirm('Use 1 credit to reveal this match?',async()=>{
          const r=await fetch('/api/unlock-tip',{method:'POST',body:JSON.stringify({user:userData.user,pass:userData.pass,tipId:id})});
          if(r.ok){ const d=await r.json(); localStorage.setItem('winner_user',JSON.stringify(d)); location.reload(); } else { showToast(await r.text(),'error'); }
        }); }
        fetchTips();
      </script>
    </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. ADMIN PANEL (With ID Persistence for Editing)
  if (url.pathname === "/admin" && req.method === "GET") {
    let content = "";
    if (!storedPass) {
      content = '<div class="card-bg p-8 rounded-xl"><input type="password" id="newPass" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;" placeholder="Admin Pass"><button onclick="setPass()" class="bg-yellow-600 text-black w-full py-4 rounded font-bold uppercase">SETUP</button></div>' +
                '<script>async function setPass(){ const pass=document.getElementById("newPass").value; await fetch("/api/config",{method:"POST",body:JSON.stringify({pass})}); location.reload(); }</script>';
    } else {
      content = '<div class="card-bg p-8 rounded-2xl mb-12 shadow-2xl border-t-4 border-sky-500"><h3 class="text-sky-500 font-black mb-6 uppercase text-xs">Manage Members</h3><div class="grid grid-cols-2 gap-4"><input type="text" id="targetUser" placeholder="User" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><input type="number" id="targetCredits" placeholder="Credits" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"></div><input type="text" id="targetPass" placeholder="Password" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><input type="password" id="adminKey" placeholder="Admin Secret Key" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><button id="createBtn" class="bg-sky-600 w-full py-4 rounded font-black text-xs uppercase">SAVE MEMBER</button></div>' +
                '<div id="user-list" class="space-y-2 mb-12"></div>' +
                '<div class="card-bg p-8 rounded-2xl border-t-4 border-yellow-500"><h3 class="text-yellow-500 font-black mb-6 uppercase text-xs">Post/Edit Tip</h3>' +
                '<input type="text" id="tipId" placeholder="ID (Persistent for Credit)" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><input type="text" id="date" placeholder="Date" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><input type="text" id="match" placeholder="Match" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><input type="text" id="tip" placeholder="Over Line" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;">' +
                '<div class="grid grid-cols-2 gap-4"><input type="text" id="odds" placeholder="Odds" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><input type="text" id="result" placeholder="Score" class="stripe-input" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"></div><select id="status" style="width:100%; padding:12px; margin-bottom:15px; background:#1a1a1a; border:1px solid #333; color:#fff;"><option value="Pending">Pending</option><option value="Win">Win</option><option value="Lose">Lose</option></select><button id="saveBtn" class="bg-yellow-600 text-black w-full py-4 rounded font-black uppercase">SAVE TIP RECORD</button></div>' +
                '<div id="admin-tips" class="mt-12 space-y-2"></div>' +
                '<script>async function load(){ const r1=await fetch("/api/admin-users"); const u=await r1.json(); document.getElementById("user-list").innerHTML=u.map(x=>\'<div class="card-bg p-3 flex justify-between items-center text-xs"><span>👤 \'+x.user+\' (\'+(x.credits||0)+\' Cr)</span><button onclick=\\\'deleteUser("\'+x.user+\'")\\\' class="text-red-500 underline font-bold uppercase">Del</button></div>\').join(""); ' +
                'const r2=await fetch("/api/tips?admin=true"); const t=await r2.json(); document.getElementById("admin-tips").innerHTML=t.map(y=>\'<div class="card-bg p-3 flex justify-between items-center text-xs"><span>\'+y.match+\'</span><button onclick=\\\'editTip(\'+JSON.stringify(y)+\')\\\' class="text-sky-400 font-black underline uppercase">Edit</button></div>\').join(""); }' +
                'window.editTip=(t)=>{ document.getElementById("tipId").value=t.id; document.getElementById("date").value=t.date; document.getElementById("match").value=t.match; document.getElementById("tip").value=t.tip; document.getElementById("odds").value=t.odds; document.getElementById("result").value=t.result||""; document.getElementById("status").value=t.status; window.scrollTo(0,0); };' +
                'document.getElementById("createBtn").onclick=async()=>{ const d={adminKey:document.getElementById("adminKey").value,user:document.getElementById("targetUser").value,pass:document.getElementById("targetPass").value,credits:parseInt(document.getElementById("targetCredits").value)}; await fetch("/api/create-user",{method:"POST",body:JSON.stringify(d)}); location.reload(); };' +
                'document.getElementById("saveBtn").onclick=async()=>{ const d={password:document.getElementById("adminKey").value,id:document.getElementById("tipId").value,date:document.getElementById("date").value,match:document.getElementById("match").value,tip:document.getElementById("tip").value,odds:document.getElementById("odds").value,result:document.getElementById("result").value,status:document.getElementById("status").value}; await fetch("/api/tips",{method:"POST",body:JSON.stringify(d)}); location.reload(); };' +
                'window.deleteUser=async(u)=>{ const k=document.getElementById("adminKey").value; if(!k||!confirm("Delete User?"))return; await fetch("/api/delete-user",{method:"POST",body:JSON.stringify({adminKey:k,user:u})}); location.reload(); }; load();</script>';
    }
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto"><h2 class="text-3xl font-black text-yellow-500 mb-8 italic uppercase text-center tracking-tighter">Admin Dashboard</h2>${content}</body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API HANDLERS (Same logic with ID Persistence) ---
  if (url.pathname === "/api/unlock-tip" && req.method === "POST") {
    const { user, pass, tipId } = await req.json();
    const uEntry = await kv.get(["users", user]);
    if (!uEntry.value || uEntry.value.pass !== pass) return new Response("Auth Error", { status: 401 });
    const u = uEntry.value; if ((u.credits || 0) <= 0) return new Response("No Credits Left!", { status: 400 });
    if (u.unlockedTips && u.unlockedTips.includes(tipId)) return new Response(JSON.stringify(u));
    const updated = { ...u, credits: u.credits - 1, unlockedTips: [...(u.unlockedTips || []), tipId] };
    await kv.set(["users", user], updated); return new Response(JSON.stringify(updated));
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json(); if (body.password !== storedPass) return new Response("Error", { status: 401 });
    const id = body.id || Date.now().toString(); // ID ရှိရင် ရှိတာသုံးမယ်၊ မရှိရင် အသစ်ထုတ်မယ်
    await kv.set(["tips", id], { ...body, id }); return new Response("OK");
  }

  // Login, Create, Delete User APIs (Same as previous version)
  if (url.pathname === "/api/user-login" && req.method === "POST") {
    const { user, pass } = await req.json(); const entry = await kv.get(["users", user]);
    if (entry.value && entry.value.pass === pass) return new Response(JSON.stringify(entry.value));
    return new Response("Invalid", { status: 401 });
  }
  if (url.pathname === "/api/create-user" && req.method === "POST") {
    const { adminKey, user, pass, credits } = await req.json(); if (adminKey !== storedPass) return new Response("Error", { status: 401 });
    const ex = await kv.get(["users", user]); const old = ex.value || { unlockedTips: [] };
    await kv.set(["users", user], { ...old, user, pass, credits }); return new Response("OK");
  }
  if (url.pathname === "/api/admin-users" && req.method === "GET") {
    const iter = kv.list({ prefix: ["users"] }); const u = []; for await (const res of iter) u.push(res.value); return new Response(JSON.stringify(u));
  }
  if (url.pathname === "/api/delete-user" && req.method === "POST") {
    const { adminKey, user } = await req.json(); if (adminKey !== storedPass) return new Response("Error", { status: 401 });
    await kv.delete(["users", user]); return new Response("OK");
  }
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
    tips.sort((a, b) => Number(b.id) - Number(a.id));
    return new Response(JSON.stringify({ data: tips.slice(0, 15) }));
  }
  if (url.pathname === "/api/config" && req.method === "POST") {
    const { pass } = await req.json(); await kv.set(["config", "admin_password"], pass); return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});
