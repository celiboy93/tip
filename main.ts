import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

// အောင်မြင်စေချင်သော ကတ်နံပတ်
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
    .win-row { background-color: rgba(239, 68, 68, 0.05); }
    .stripe-input { width: 100%; padding: 12px; border: 1px solid #333; background: #1a1a1a; border-radius: 5px; color: #fff; font-size: 16px; margin-bottom: 15px; outline: none; }
    .btn-main { background: #f3ca52; color: #000; width: 100%; padding: 14px; border-radius: 5px; font-weight: 900; cursor: pointer; }
    .vip-badge { background: #f3ca52; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 900; vertical-align: middle; margin-left: 5px; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. HOME PAGE & USER DASHBOARD
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6">
      <div class="max-w-[1050px] mx-auto text-center">
        <header class="py-12"><h1 class="text-6xl font-black italic text-yellow-500 uppercase tracking-tighter">Winner Soccer</h1></header>
        
        <section class="text-center mb-12 px-10">
          <h2 class="text-2xl font-bold text-white mb-4 uppercase tracking-[0.2em]">Premium Football Intelligence</h2>
          <p class="text-zinc-500 text-lg leading-relaxed italic max-w-3xl mx-auto">
            Welcome to Winner Soccer. Our expert analysis combines deep statistical data with professional market insights to deliver high-accuracy predictions. Elevate your winning game today.
          </p>
          <div class="mt-8 flex justify-center gap-6">
              <span class="bg-zinc-900 border border-zinc-700 px-5 py-2 rounded-full text-[13px] font-black text-yellow-500 uppercase tracking-widest">&check; 90% ACCURACY</span>
              <span class="bg-zinc-900 border border-zinc-700 px-5 py-2 rounded-full text-[13px] font-black text-yellow-500 uppercase tracking-widest">&check; EXPERT ANALYSTS</span>
          </div>
        </section>

        <div id="login-ui" class="max-w-md mx-auto card-bg p-10 rounded-2xl shadow-2xl border-t-4 border-yellow-500 mb-20">
           <h2 class="text-2xl font-black mb-6 italic uppercase">Member Access</h2>
           <input type="text" id="uName" class="stripe-input" placeholder="Username">
           <input type="password" id="uPass" class="stripe-input" placeholder="Password">
           <button onclick="doLogin()" class="btn-main uppercase tracking-widest">Login to Dashboard</button>
        </div>

        <div id="plans-ui" class="grid grid-cols-2 gap-10 mb-20 max-w-4xl mx-auto">
            <div class="card-bg rounded-2xl p-10 text-center shadow-2xl border-b-4 border-yellow-600 transition hover:-translate-y-2">
                <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-sm uppercase">Standard Access</div>
                <h2 class="text-6xl font-black mb-6">$30 <span class="text-xs text-zinc-600">/3 TIPS</span></h2>
                <a href="/checkout?plan=Standard" class="bg-sky-600 hover:bg-sky-500 block py-4 rounded-full font-black text-sm uppercase tracking-widest">Get Started</a>
            </div>
            <div class="card-bg rounded-2xl p-10 text-center shadow-2xl border-b-4 border-sky-600 transition hover:-translate-y-2">
                <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-sm uppercase">VIP Intelligence</div>
                <h2 class="text-6xl font-black mb-6">$300 <span class="text-xs text-zinc-600">/1 TIP</span></h2>
                <a href="/checkout?plan=VIP" class="bg-sky-600 hover:bg-sky-500 block py-4 rounded-full font-black text-sm uppercase tracking-widest">Join VIP</a>
            </div>
        </div>

        <div id="dashboard-ui" class="hidden">
           <div class="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 mb-8 flex justify-between items-center text-left">
              <div>
                <h2 class="text-yellow-500 font-black text-2xl uppercase italic">Member: <span id="displayUser" class="text-white"></span></h2>
                <p class="text-zinc-500 text-sm font-bold mt-1 uppercase">Status: <span class="text-green-500">Active</span> | <span class="text-red-500">Expiry: <span id="displayExp"></span></span></p>
              </div>
              <button onclick="logout()" class="bg-zinc-800 px-6 py-2 rounded font-bold text-xs uppercase border border-zinc-700">Logout</button>
           </div>
           
           <div class="card-bg rounded-2xl overflow-hidden shadow-2xl">
            <table class="w-full border-collapse">
              <thead><tr class="gold-gradient text-black text-[11px] font-black uppercase">
                <th class="p-4 border-r border-black/10">Date</th><th class="p-4 border-r border-black/10">Match</th>
                <th class="p-4 border-r border-black/10">Prediction</th><th class="p-4 border-r border-black/10">Odds</th><th class="p-4 border-r border-black/10">Score</th><th class="p-4">Status</th>
              </tr></thead>
              <tbody id="tips-table-body"></tbody>
            </table>
           </div>
        </div>
        <footer class="py-16 text-[10px] font-black text-zinc-800 uppercase tracking-widest">&copy; 2025 WINNER-SOCCER.COM</footer>
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
          } else { alert('Invalid account or password!'); }
        }

        function logout() { localStorage.removeItem('winner_user'); location.reload(); }

        const userData = JSON.parse(localStorage.getItem('winner_user'));
        if(userData) {
          const now = Date.now();
          if(now > userData.expiry) {
            alert('Your account has expired!'); logout();
          } else {
            document.getElementById('login-ui').classList.add('hidden');
            document.getElementById('plans-ui').classList.add('hidden');
            document.getElementById('dashboard-ui').classList.remove('hidden');
            document.getElementById('displayUser').innerText = userData.user;
            document.getElementById('displayExp').innerText = new Date(userData.expiry).toLocaleDateString('en-GB');
            fetchTips();
          }
        }

        async function fetchTips() {
          const res = await fetch('/api/tips');
          const { data } = await res.json();
          document.getElementById('tips-table-body').innerHTML = data.map(t => {
            const statusClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : 'text-sky-600');
            const rowClass = t.status === 'Win' ? 'match-row win-row' : 'match-row';
            const vipBadge = t.isVip ? '<span class="vip-badge">VIP</span>' : '';
            return '<tr class="' + rowClass + '">' +
              '<td class="p-4 text-zinc-500 text-xs font-bold border-r border-white/5">' + t.date + '</td>' +
              '<td class="p-4 text-yellow-500 font-bold text-lg border-r border-white/5">' + t.match + ' ' + vipBadge + '</td>' +
              '<td class="p-4 font-bold text-zinc-200 border-r border-white/5">' + t.tip + '</td>' +
              '<td class="p-4 text-zinc-500 font-mono border-r border-white/5">' + t.odds + '</td>' +
              '<td class="p-4 font-black text-2xl text-zinc-300 border-r border-white/5">' + (t.result || '-:-') + '</td>' +
              '<td class="p-4 ' + statusClass + ' italic text-3xl uppercase tracking-tighter">' + t.status + '</td>' +
              '</tr>';
          }).join('');
        }
      </script>
    </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. CHECKOUT PAGE (Stripe Style)
  if (url.pathname === "/checkout" && req.method === "GET") {
    const plan = url.searchParams.get("plan") || "Standard";
    const price = plan === "VIP" ? "300.00" : "30.00";
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="bg-[#f6f9fc] flex items-center justify-center min-h-screen p-4 text-[#32325d]">
      <div class="bg-white p-8 rounded-xl shadow-2xl max-w-[450px] w-full">
        <h1 class="text-3xl font-bold mb-8 italic">Add payment method</h1>
        <form id="payForm">
          <label class="block text-gray-500 font-medium mb-2 text-sm uppercase">Card information</label>
          <div class="relative mb-4">
            <input type="text" id="cardNum" class="stripe-input !mb-0 !text-black" placeholder="1234 1234 1234 1234" maxlength="19" required>
            <span id="cardIcon" class="absolute right-3 top-3 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 uppercase">CARD</span>
          </div>
          <div class="flex gap-4"><input type="text" id="expiry" class="stripe-input !text-black" placeholder="MM / YY" maxlength="7" required><input type="text" class="stripe-input !text-black" placeholder="CVC" maxlength="3" required></div>
          <label class="block text-gray-500 font-medium mb-2 text-sm uppercase">Country</label>
          <select id="country" class="stripe-input !text-black"></select>
          <button type="submit" id="payBtn" class="bg-[#c1e1a6] text-[#445633] w-full py-4 rounded font-black text-lg mt-4 uppercase">Pay $${price}</button>
        </form>
      </div>
      <div id="overlay" class="fixed inset-0 bg-white flex flex-col items-center justify-center hidden">
          <div id="spinner" class="spinner border-blue-600 border-t-blue-100 !w-16 !h-16 !border-8"></div>
          <div id="successAnim" class="hidden text-center"><div class="success-icon">&check;</div><h2 class="text-3xl font-bold mb-2 text-black">Payment Successful!</h2></div>
          <div id="errorMsg" class="hidden text-center text-red-600 font-bold p-6">❌ Declined. Check card details.</div>
      </div>
      <script>
        const countries = ["United States", "United Kingdom", "Myanmar", "Seychelles", "Thailand", "Others..."];
        document.getElementById('country').innerHTML = countries.map(c => '<option value="' + c + '">' + c + '</option>').join('');
        const cardNum = document.getElementById('cardNum');
        const cardIcon = document.getElementById('cardIcon');
        const expiry = document.getElementById('expiry');
        cardNum.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\\D/g, ''); e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
          if(v.startsWith('4')) { cardIcon.innerText = "VISA"; cardIcon.className = "absolute right-3 top-3 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-black"; }
          else if(v.startsWith('5')) { cardIcon.innerText = "MASTER"; cardIcon.className = "absolute right-3 top-3 bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-black"; }
          else { cardIcon.innerText = "CARD"; cardIcon.className = "absolute right-3 top-3 bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black"; }
        });
        expiry.addEventListener('input', (e) => { let v = e.target.value.replace(/\\D/g, ''); if(v.length > 2) v = v.substring(0,2) + ' / ' + v.substring(2,4); e.target.value = v; });
        document.getElementById('payForm').onsubmit = (e) => { e.preventDefault(); document.getElementById('overlay').classList.remove('hidden');
          setTimeout(() => { document.getElementById('spinner').classList.add('hidden');
            if (cardNum.value.replace(/\\s/g,'') === "${VALID_CARD}") { document.getElementById('successAnim').classList.remove('hidden'); setTimeout(() => location.href = "/", 2000); }
            else { document.getElementById('errorMsg').classList.remove('hidden'); setTimeout(() => location.reload(), 2000); }
          }, 2000);
        };
      </script></body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 3. ADMIN PANEL (User Management & Tip Posting)
  if (url.pathname === "/admin" && req.method === "GET") {
    let content = "";
    if (!storedPass) {
      content = '<div class="card-bg p-8 rounded-xl shadow-2xl"><input type="password" id="newPass" placeholder="Set Password" class="stripe-input"><button onclick="setPass()" class="btn-main">INITIAL SETUP</button></div>' +
                '<script>async function setPass(){ const pass=document.getElementById("newPass").value; await fetch("/api/config",{method:"POST",body:JSON.stringify({pass})}); location.reload(); }</script>';
    } else {
      content = '<div class="card-bg p-8 rounded-2xl mb-12 shadow-2xl border-t-4 border-sky-500">' +
                '<h3 class="text-sky-500 font-black mb-6 uppercase tracking-widest text-sm">Create Member Account</h3>' +
                '<input type="password" id="adminKey" placeholder="Admin Secret Key" class="stripe-input">' +
                '<div class="grid grid-cols-2 gap-4"><input type="text" id="targetUser" placeholder="Username" class="stripe-input"><input type="text" id="targetPass" placeholder="Password" class="stripe-input"></div>' +
                '<input type="date" id="expDate" class="stripe-input"><button id="createBtn" class="bg-sky-600 w-full py-4 rounded-lg font-black uppercase text-xs">Create Member</button></div>' +
                '<div id="user-list" class="space-y-2 mb-12"></div>' +
                '<div class="card-bg p-8 rounded-2xl shadow-2xl border-t-4 border-yellow-500">' +
                '<h3 class="text-yellow-500 font-black mb-6 uppercase tracking-widest text-sm">Post New Tip</h3>' +
                '<input type="text" id="date" placeholder="Date" class="stripe-input">' +
                '<input type="text" id="match" placeholder="Match" class="stripe-input">' +
                '<input type="text" id="tip" placeholder="Prediction" class="stripe-input">' +
                '<div class="grid grid-cols-2 gap-4"><input type="text" id="odds" placeholder="Odds" class="stripe-input"><input type="text" id="result" placeholder="Score" class="stripe-input"></div>' +
                '<div class="flex items-center gap-4 mb-6 bg-zinc-900 p-4 rounded"><label class="text-yellow-500 uppercase text-xs font-bold">VIP Tip?</label><input type="checkbox" id="isVip" class="w-6 h-6"></div>' +
                '<select id="status" class="stripe-input !bg-zinc-900"><option value="Pending">Pending</option><option value="Win">Win</option><option value="Lose">Lose</option></select>' +
                '<button id="saveBtn" class="bg-yellow-600 w-full py-4 rounded-lg font-black">SAVE TIP</button></div>' +
                '<script>' +
                'async function loadAdminData(){ const res=await fetch("/api/admin-users"); const users=await res.json(); document.getElementById("user-list").innerHTML=users.map(u => \'<div class="card-bg p-4 flex justify-between items-center text-xs"><span>👤 \' + u.user + \' (Exp: \' + new Date(u.expiry).toLocaleDateString() + \')</span><button onclick=\\\'deleteUser("\' + u.user + \'")\\\' class="text-red-500 font-black underline">DEL</button></div>\').join(""); }' +
                'document.getElementById("createBtn").onclick=async()=>{ const d={ adminKey:document.getElementById("adminKey").value, user:document.getElementById("targetUser").value, pass:document.getElementById("targetPass").value, expiry:new Date(document.getElementById("expDate").value).getTime() }; await fetch("/api/create-user",{method:"POST",body:JSON.stringify(d)}); location.reload(); };' +
                'window.deleteUser=async(u)=>{ const k=document.getElementById("adminKey").value; if(!k||!confirm("Delete?"))return; await fetch("/api/delete-user",{method:"POST",body:JSON.stringify({adminKey:k,user:u})}); location.reload(); };' +
                'document.getElementById("saveBtn").onclick=async()=>{ const d={ password:document.getElementById("adminKey").value, date:document.getElementById("date").value, match:document.getElementById("match").value, tip:document.getElementById("tip").value, odds:document.getElementById("odds").value, result:document.getElementById("result").value, status:document.getElementById("status").value, isVip:document.getElementById("isVip").checked }; await fetch("/api/tips",{method:"POST",body:JSON.stringify(d)}); location.reload(); };' +
                'loadAdminData();</script>';
    }
    const adminHtml = `<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto"><h2 class="text-3xl font-black text-yellow-500 mb-8 italic uppercase tracking-tighter">Admin Dashboard</h2>${content}</body></html>`;
    return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API HANDLERS ---
  if (url.pathname === "/api/user-login" && req.method === "POST") {
    const { user, pass } = await req.json();
    const entry = await kv.get(["users", user]);
    if (entry.value && entry.value.pass === pass) return new Response(JSON.stringify(entry.value));
    return new Response("Error", { status: 401 });
  }

  if (url.pathname === "/api/create-user" && req.method === "POST") {
    const { adminKey, user, pass, expiry } = await req.json();
    if (adminKey !== storedPass) return new Response("Error", { status: 401 });
    await kv.set(["users", user], { user, pass, expiry }); return new Response("OK");
  }

  if (url.pathname === "/api/admin-users" && req.method === "GET") {
    const iter = kv.list({ prefix: ["users"] }); const users = []; for await (const res of iter) users.push(res.value);
    return new Response(JSON.stringify(users));
  }

  if (url.pathname === "/api/delete-user" && req.method === "POST") {
    const { adminKey, user } = await req.json();
    if (adminKey !== storedPass) return new Response("Error", { status: 401 });
    await kv.delete(["users", user]); return new Response("OK");
  }

  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
    tips.sort((a, b) => Number(b.id) - Number(a.id));
    return new Response(JSON.stringify({ data: tips.slice(0, 15) }));
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json(); if (body.password !== storedPass) return new Response("Error", { status: 401 });
    const id = Date.now().toString(); await kv.set(["tips", id], { ...body, id, password: undefined });
    return new Response("OK");
  }

  if (url.pathname === "/api/config" && req.method === "POST") {
    if (storedPass) return new Response("Error", { status: 403 });
    const { pass } = await req.json(); await kv.set(["config", "admin_password"], pass); return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});
