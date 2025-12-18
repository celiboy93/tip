import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

async function getStoredPassword() {
  const entry = await kv.get(["config", "admin_password"]);
  return entry.value as string | null;
}

// --- CSS with Larger Fonts ---
const UI_CSS = `
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0c0c0c; color: #fff; font-family: sans-serif; font-size: 18px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #141414; border: 1px solid #222; }
    input, select { background: #1a1a1a; border: 1px solid #444; color: white; padding: 15px; border-radius: 8px; width: 100%; margin-bottom: 15px; font-size: 18px; }
    button { transition: all 0.2s; }
    button:active { transform: scale(0.95); }
    .table-cell { padding: 15px 10px; border-bottom: 1px solid #222; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. PUBLIC HOME PAGE
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<html><head>${UI_CSS}</head><body class="p-4 max-w-4xl mx-auto">
      <header class="flex justify-between items-center py-6 border-b border-zinc-800 mb-8">
        <h1 class="text-2xl font-bold italic text-yellow-500">BESTSOCCERTIPS</h1>
        <a href="/admin" class="bg-zinc-800 px-5 py-2 rounded-lg text-sm font-bold text-zinc-400">ADMIN</a>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div class="card-bg rounded-xl p-8 text-center">
              <div class="gold-gradient text-black font-black py-2 rounded-t-lg mb-6 text-xl">3 NORMAL TIPS</div>
              <h2 class="text-5xl font-black mb-6">55$</h2>
              <button class="bg-sky-500 w-full py-4 rounded-full font-black text-xl">BUY NOW</button>
          </div>
          <div class="card-bg rounded-xl p-8 text-center border-yellow-600/30">
              <div class="gold-gradient text-black font-black py-2 rounded-t-lg mb-6 text-xl">1 VIP TIP</div>
              <h2 class="text-5xl font-black mb-6">650$</h2>
              <button class="bg-sky-500 w-full py-4 rounded-full font-black text-xl">BUY NOW</button>
          </div>
      </div>

      <h3 class="text-yellow-500 font-black mb-6 text-lg tracking-widest uppercase">Latest Premium Tips</h3>
      <div id="tips-list" class="space-y-4"></div>

      <script>
        fetch('/api/tips').then(res => res.json()).then(data => {
          document.getElementById('tips-list').innerHTML = data.map(t => \`
            <div class="card-bg p-5 rounded-xl flex justify-between items-center shadow-lg">
              <div>
                <div class="text-sm text-zinc-500 font-bold mb-1">\${t.date} | \${t.league}</div>
                <div class="text-2xl font-black text-yellow-500 mb-1">\${t.match}</div>
                <div class="text-lg">Tip: <span class="text-white font-bold">\${t.tip}</span> | Odds: <span class="font-mono">\${t.odds}</span></div>
              </div>
              <div class="\${t.status === 'Win' ? 'text-red-500' : (t.status === 'Lose' ? 'text-zinc-600' : 'text-sky-400')} font-black text-3xl italic">\${t.status}</div>
            </div>
          \`).join('');
        });
      </script>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  // 2. ADMIN PANEL (WITH EDIT LIST)
  if (url.pathname === "/admin" && req.method === "GET") {
    if (!storedPass) {
       return new Response(`<html><head>${UI_CSS}</head><body class="p-6 max-w-md mx-auto">
        <h2 class="text-3xl font-black text-yellow-500 mb-6">Set Password</h2>
        <input type="password" id="newPass" placeholder="New Password">
        <button onclick="setPass()" class="bg-yellow-600 w-full py-4 rounded-lg font-black text-xl">SAVE</button>
        <script>
          async function setPass() {
            const pass = document.getElementById('newPass').value;
            await fetch('/api/config', { method: 'POST', body: JSON.stringify({ pass }) });
            location.reload();
          }
        </script>
      </body></html>`, { headers: { "Content-Type": "text/html" } });
    }

    return new Response(`<html><head>${UI_CSS}</head><body class="p-4 max-w-2xl mx-auto">
        <h2 class="text-3xl font-black text-yellow-500 mb-8">Admin Panel</h2>
        
        <div class="card-bg p-6 rounded-xl mb-10">
          <input type="hidden" id="tipId">
          <input type="password" id="pass" placeholder="Admin Password">
          <div class="grid grid-cols-2 gap-3">
            <input type="text" id="date" placeholder="Date (19/12 20:00)">
            <input type="text" id="league" placeholder="League (FRAC)">
          </div>
          <input type="text" id="match" placeholder="Match (Team A - Team B)">
          <input type="text" id="tip" placeholder="Tip (Over 2.5)">
          <input type="text" id="odds" placeholder="Odds (0.95)">
          <select id="status">
            <option value="Pending">Pending</option>
            <option value="Win">Win</option>
            <option value="Lose">Lose</option>
          </select>
          <button id="saveBtn" class="bg-yellow-600 w-full py-4 rounded-lg font-black text-xl">SAVE / UPDATE TIP</button>
        </div>

        <h3 class="text-zinc-500 font-bold mb-4 uppercase text-sm">Manage Existing Tips</h3>
        <div id="admin-tips-list" class="space-y-3 text-sm"></div>

        <script>
          const loadAdminTips = () => {
            fetch('/api/tips').then(res => res.json()).then(data => {
              document.getElementById('admin-tips-list').innerHTML = data.map(t => \`
                <div class="card-bg p-4 rounded-lg flex justify-between items-center border-l-4 \${t.status === 'Win' ? 'border-red-500' : 'border-zinc-700'}">
                  <div>
                    <div class="font-bold text-yellow-500">\${t.match}</div>
                    <div class="text-zinc-500">\${t.date} | \${t.status}</div>
                  </div>
                  <button onclick='editTip(\${JSON.stringify(t)})' class="bg-zinc-800 px-4 py-2 rounded font-bold text-sky-400 text-xs">EDIT</button>
                </div>
              \`).join('');
            });
          };

          window.editTip = (t) => {
            document.getElementById('tipId').value = t.id;
            document.getElementById('date').value = t.date;
            document.getElementById('league').value = t.league;
            document.getElementById('match').value = t.match;
            document.getElementById('tip').value = t.tip;
            document.getElementById('odds').value = t.odds;
            document.getElementById('status').value = t.status;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          };

          document.getElementById('saveBtn').onclick = async () => {
            const data = {
              id: document.getElementById('tipId').value || null,
              password: document.getElementById('pass').value,
              date: document.getElementById('date').value,
              league: document.getElementById('league').value,
              match: document.getElementById('match').value,
              tip: document.getElementById('tip').value,
              odds: document.getElementById('odds').value,
              status: document.getElementById('status').value
            };
            const res = await fetch('/api/tips', { method: 'POST', body: JSON.stringify(data) });
            if(res.ok) { alert('✅ Done!'); location.reload(); }
            else { alert('❌ Error/Wrong Password'); }
          };
          loadAdminTips();
        </script>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  // --- APIs (GET, POST, CONFIG) ---
  if (url.pathname === "/api/config" && req.method === "POST") {
    if (storedPass) return new Response("Forbidden", { status: 403 });
    const { pass } = await req.json();
    await kv.set(["config", "admin_password"], pass);
    return new Response("OK");
  }

  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] });
    const tips = [];
    for await (const res of iter) tips.push(res.value);
    return new Response(JSON.stringify(tips.reverse()), { headers: { "Content-Type": "application/json" } });
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json();
    if (body.password !== storedPass) return new Response("Unauthorized", { status: 401 });
    
    // Edit ဆိုရင် ID ဟောင်းယူမယ်၊ အသစ်ဆိုရင် အသစ်ထုတ်မယ်
    const id = body.id || Date.now().toString();
    const newTip = { ...body, id };
    delete newTip.password;
    
    await kv.set(["tips", id], newTip);
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response("Not Found", { status: 404 });
});
