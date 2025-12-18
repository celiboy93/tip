import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

// --- Helper: KV ထဲက Password ကို ယူခြင်း ---
async function getStoredPassword() {
  const entry = await kv.get(["config", "admin_password"]);
  return entry.value as string | null;
}

const UI_CSS = `
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0c0c0c; color: #fff; font-family: sans-serif; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #141414; border: 1px solid #222; }
    input, select { background: #1a1a1a; border: 1px solid #333; color: white; padding: 12px; border-radius: 5px; width: 100%; margin-bottom: 12px; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. PUBLIC HOME PAGE
  if (url.pathname === "/" && req.method === "GET") {
    // (အရှေ့က code အတိုင်း ထားနိုင်ပါတယ်...)
    return new Response(`<html><head>${UI_CSS}</head><body class="p-4 max-w-4xl mx-auto">
      <header class="flex justify-between items-center py-4 border-b border-zinc-800 mb-6">
        <h1 class="text-xl font-bold italic text-yellow-500">BESTSOCCERTIPS</h1>
        <a href="/admin" class="bg-zinc-800 px-4 py-1 rounded text-sm text-zinc-400">Admin</a>
      </header>
      <h3 class="text-yellow-500 font-bold mb-4 text-sm tracking-widest uppercase">Latest Premium Tips</h3>
      <div id="tips-list" class="space-y-3"></div>
      <script>
        fetch('/api/tips').then(res => res.json()).then(data => {
          document.getElementById('tips-list').innerHTML = data.map(t => \`
            <div class="card-bg p-4 rounded-lg flex justify-between items-center">
              <div>
                <div class="text-xs text-zinc-500">\${t.date} | \${t.league}</div>
                <div class="font-bold text-yellow-500">\${t.match}</div>
                <div class="text-sm">Tip: <span class="text-white">\${t.tip}</span> | Odds: \${t.odds}</div>
              </div>
              <div class="\${t.status === 'Win' ? 'text-red-500' : (t.status === 'Lose' ? 'text-zinc-500' : 'text-sky-400')} font-bold text-xl">\${t.status}</div>
            </div>
          \`).join('');
        });
      </script>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  // 2. ADMIN PANEL (Setup & Add Tip)
  if (url.pathname === "/admin" && req.method === "GET") {
    // Password မရှိသေးရင် Set Password အရင်လုပ်ခိုင်းမယ်
    if (!storedPass) {
      return new Response(`<html><head>${UI_CSS}</head><body class="p-6 max-w-md mx-auto">
        <h2 class="text-2xl font-bold text-yellow-500 mb-4">Set Admin Password</h2>
        <p class="text-zinc-400 mb-6 text-sm">ပထမဆုံးအကြိမ်မို့လို့ Password အသစ် သတ်မှတ်ပေးပါ။</p>
        <input type="password" id="newPass" placeholder="Enter New Password">
        <button onclick="setPass()" class="bg-yellow-600 w-full py-3 rounded font-bold">Set Password</button>
        <script>
          async function setPass() {
            const pass = document.getElementById('newPass').value;
            await fetch('/api/config', { method: 'POST', body: JSON.stringify({ pass }) });
            location.reload();
          }
        </script>
      </body></html>`, { headers: { "Content-Type": "text/html" } });
    }

    // Password ရှိရင် ပုံမှန် Admin Form ပြမယ်
    return new Response(`<html><head>${UI_CSS}</head><body class="p-6 max-w-md mx-auto">
        <h2 class="text-2xl font-bold text-yellow-500 mb-6">Admin Panel</h2>
        <input type="password" id="pass" placeholder="Admin Password">
        <hr class="border-zinc-800 my-4">
        <input type="text" id="date" placeholder="Date (e.g., 19/12 20:00)">
        <input type="text" id="league" placeholder="League (e.g., FRAC)">
        <input type="text" id="match" placeholder="Match (e.g., Lens - Feignies)">
        <input type="text" id="tip" placeholder="Tip (e.g., Feignies 2.5)">
        <input type="text" id="odds" placeholder="Odds (e.g., 0.95)">
        <select id="status">
          <option value="Pending">Pending</option>
          <option value="Win">Win</option>
          <option value="Lose">Lose</option>
        </select>
        <button id="addBtn" class="bg-yellow-600 w-full py-3 rounded font-bold mt-2">Add Tip</button>
        <script>
          document.getElementById('addBtn').onclick = async () => {
            const data = {
              password: document.getElementById('pass').value,
              date: document.getElementById('date').value,
              league: document.getElementById('league').value,
              match: document.getElementById('match').value,
              tip: document.getElementById('tip').value,
              odds: document.getElementById('odds').value,
              status: document.getElementById('status').value
            };
            const res = await fetch('/api/tips', { method: 'POST', body: JSON.stringify(data) });
            if(res.ok) { alert('✅ Success!'); location.reload(); }
            else { alert('❌ Wrong Password!'); }
          };
        </script>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  // 3. API: CONFIG (Password သတ်မှတ်ရန်)
  if (url.pathname === "/api/config" && req.method === "POST") {
    if (storedPass) return new Response("Already Set", { status: 403 });
    const { pass } = await req.json();
    await kv.set(["config", "admin_password"], pass);
    return new Response(JSON.stringify({ success: true }));
  }

  // 4. API: GET TIPS
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] });
    const tips = [];
    for await (const res of iter) tips.push(res.value);
    return new Response(JSON.stringify(tips.reverse()), { headers: { "Content-Type": "application/json" } });
  }

  // 5. API: POST TIP (KV Password နဲ့ စစ်မယ်)
  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json();
    if (body.password !== storedPass) return new Response("Unauthorized", { status: 401 });
    
    const id = Date.now().toString();
    const newTip = { id, ...body };
    delete newTip.password;
    await kv.set(["tips", id], newTip);
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response("Not Found", { status: 404 });
});
