import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

async function getStoredPassword() {
  const entry = await kv.get(["config", "admin_password"]);
  return entry.value as string | null;
}

// Mobile မှာ Desktop site ပြောင်းစရာမလိုဘဲ အချိုးကျစေမည့် CSS
const UI_HEAD = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <title>Winner Soccer Tips</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes glow {
      0%, 100% { text-shadow: 0 0 8px #ef4444, 0 0 15px #ef4444; transform: scale(1); }
      50% { text-shadow: 0 0 20px #ef4444, 0 0 30px #ef4444; transform: scale(1.05); }
    }
    .win-effect { animation: glow 1.5s infinite; color: #ef4444; font-weight: 900; }
    body { background-color: #0c0c0c; color: #fff; font-family: sans-serif; overflow-x: hidden; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #141414; border: 1px solid #222; }
    input, select { background: #1a1a1a; border: 1px solid #444; color: white; padding: 12px; border-radius: 8px; width: 100%; margin-bottom: 10px; font-size: 16px; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. PUBLIC HOME PAGE
  if (url.pathname === "/" && req.method === "GET") {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>${UI_HEAD}</head>
      <body class="p-3 md:p-6 max-w-4xl mx-auto">
        <header class="flex justify-center items-center py-8">
          <h1 class="text-3xl md:text-5xl font-black italic text-yellow-500 tracking-tighter uppercase">Winner Soccer</h1>
        </header>

        <section class="text-center mb-10 px-2">
          <h2 class="text-lg md:text-xl font-bold text-white mb-3 uppercase tracking-widest">Premium Football Intelligence</h2>
          <p class="text-zinc-500 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto italic">
            High-accuracy predictions powered by professional market insights. Elevate your winning game with us.
          </p>
          <div class="mt-6 flex justify-center gap-2">
              <span class="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full text-[11px] font-black text-yellow-500 uppercase">&check; 90% Accuracy</span>
              <span class="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full text-[11px] font-black text-yellow-500 uppercase">&check; Expert Analysts</span>
          </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div class="card-bg rounded-2xl p-6 text-center border-t-4 border-yellow-500">
                <div class="gold-gradient text-black font-black py-1 rounded-lg mb-4 text-sm uppercase font-bold">Normal Tips Plan</div>
                <h2 class="text-5xl font-black mb-4">55$</h2>
                <button class="bg-sky-500 w-full py-4 rounded-full font-black text-lg uppercase">Activate Plan</button>
            </div>
            <div class="card-bg rounded-2xl p-6 text-center border-t-4 border-sky-500">
                <div class="gold-gradient text-black font-black py-1 rounded-lg mb-4 text-sm uppercase font-bold">VIP Intelligence</div>
                <h2 class="text-5xl font-black mb-4">650$</h2>
                <button class="bg-sky-500 w-full py-4 rounded-full font-black text-lg uppercase">Join VIP Group</button>
            </div>
        </div>

        <div class="flex justify-between items-center mb-6 border-l-4 border-yellow-500 pl-3">
            <h3 class="text-yellow-500 font-black text-lg uppercase tracking-tighter">Verified Daily Results</h3>
        </div>
        
        <div id="tips-list" class="space-y-3"></div>

        <div class="flex justify-center gap-4 mt-10 mb-20">
            <button id="prevBtn" class="bg-zinc-800 px-6 py-2 rounded-lg font-bold text-zinc-400 hidden">Previous</button>
            <button id="nextBtn" class="bg-zinc-800 px-6 py-2 rounded-lg font-bold text-yellow-500 hidden">Next Page</button>
        </div>

        <script>
          let currentPage = 1;
          const limit = 15;

          async function fetchTips(page = 1) {
            const res = await fetch(\`/api/tips?page=\${page}&limit=\${limit}\`);
            const { data, hasNext, hasPrev } = await res.json();
            
            const list = document.getElementById('tips-list');
            list.innerHTML = data.map(t => {
              const statusClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : 'text-sky-500');
              return \`
                <div class="card-bg p-4 md:p-6 rounded-2xl flex justify-between items-center shadow-lg border-b border-zinc-800">
                  <div class="flex-1">
                    <div class="text-[10px] text-zinc-500 font-black uppercase mb-1">\${t.date} | \${t.league}</div>
                    <div class="text-xl md:text-2xl font-black text-yellow-500 leading-tight">\${t.match}</div>
                    <div class="text-sm md:text-lg mt-1 font-medium text-zinc-400">Tip: <span class="text-white font-bold">\${t.tip}</span> | Odds: \${t.odds}</div>
                  </div>
                  <div class="text-center px-3">
                     <div class="text-2xl md:text-3xl font-black text-zinc-300">\${t.result || '-:-'}</div>
                     <div class="text-[9px] uppercase text-zinc-600 font-black mt-1">Score</div>
                  </div>
                  <div class="text-right w-20">
                    <div class="\${statusClass} font-black text-2xl italic uppercase tracking-tighter">\${t.status}</div>
                  </div>
                </div>\`;
            }).join('');

            // Pagination Logic
            const nextBtn = document.getElementById('nextBtn');
            const prevBtn = document.getElementById('prevBtn');
            
            if (hasNext) { nextBtn.classList.remove('hidden'); } else { nextBtn.classList.add('hidden'); }
            if (hasPrev) { prevBtn.classList.remove('hidden'); } else { prevBtn.classList.add('hidden'); }
            window.scrollTo({ top: list.offsetTop - 100, behavior: 'smooth' });
          }

          document.getElementById('nextBtn').onclick = () => { currentPage++; fetchTips(currentPage); };
          document.getElementById('prevBtn').onclick = () => { currentPage--; fetchTips(currentPage); };

          fetchTips(currentPage);
        </script>

        <footer class="mt-10 py-10 border-t border-zinc-900 text-center">
           <p class="text-zinc-700 text-[10px] font-black uppercase tracking-widest">&copy; 2025 WINNER-SOCCER.COM</p>
        </footer>
      </body>
      </html>
    `;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. ADMIN PANEL (Hidden Route) - ဖုန်းဖြင့်ပြင်ဆင်ရန်
  if (url.pathname === "/admin" && req.method === "GET") {
    const adminHtml = `
      <!DOCTYPE html>
      <html><head>${UI_HEAD}</head>
      <body class="p-4 max-w-2xl mx-auto">
        <h2 class="text-2xl font-black text-yellow-500 mb-6 uppercase italic">Admin Dashboard</h2>
        ${!storedPass ? `
          <div class="card-bg p-6 rounded-2xl">
            <h3 class="mb-3 font-bold text-yellow-500">Setup Admin Password</h3>
            <input type="password" id="newPass" placeholder="Secret Password">
            <button onclick="setPass()" class="bg-yellow-600 w-full py-4 rounded-lg font-black mt-2">SAVE</button>
          </div>
          <script>
            async function setPass() {
              const pass = document.getElementById('newPass').value;
              await fetch('/api/config', { method: 'POST', body: JSON.stringify({ pass }) });
              location.reload();
            }
          </script>
        ` : `
          <div class="card-bg p-6 rounded-2xl mb-8 shadow-2xl">
            <input type="hidden" id="tipId">
            <input type="password" id="pass" placeholder="Secret Key" class="mb-4">
            <div class="grid grid-cols-2 gap-3">
              <input type="text" id="date" placeholder="Date">
              <input type="text" id="league" placeholder="League">
            </div>
            <input type="text" id="match" placeholder="Home - Away">
            <input type="text" id="tip" placeholder="Prediction">
            <div class="grid grid-cols-2 gap-3">
              <input type="text" id="odds" placeholder="Odds">
              <input type="text" id="result" placeholder="Result (2:1)">
            </div>
            <select id="status">
              <option value="Pending">Pending</option>
              <option value="Win">Win</option>
              <option value="Lose">Lose</option>
            </select>
            <button id="saveBtn" class="bg-yellow-600 w-full py-4 rounded-xl font-black text-lg">SAVE DATA</button>
          </div>
          <div id="admin-tips-list" class="space-y-3"></div>
          <script>
            async function loadAdminTips() {
              const res = await fetch('/api/tips?admin=true');
              const { data } = await res.json();
              document.getElementById('admin-tips-list').innerHTML = data.map(t => \`
                <div class="card-bg p-4 rounded-xl flex justify-between items-center text-sm">
                  <div>
                    <div class="font-bold text-yellow-500">\${t.match}</div>
                    <div class="text-zinc-600 text-[10px] uppercase font-bold">\${t.date} | \${t.status}</div>
                  </div>
                  <div class="flex gap-2">
                    <button onclick='editTip(\${JSON.stringify(t)})' class="bg-zinc-800 px-3 py-1 rounded font-bold text-sky-400 text-xs">EDIT</button>
                    <button onclick='deleteTip("\${t.id}")' class="bg-red-900/20 px-3 py-1 rounded font-bold text-red-500 text-xs">DEL</button>
                  </div>
                </div>\`).join('');
            }
            window.editTip = (t) => {
              document.getElementById('tipId').value = t.id;
              document.getElementById('date').value = t.date;
              document.getElementById('league').value = t.league;
              document.getElementById('match').value = t.match;
              document.getElementById('tip').value = t.tip;
              document.getElementById('odds').value = t.odds;
              document.getElementById('result').value = t.result || '';
              document.getElementById('status').value = t.status;
              window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            window.deleteTip = async (id) => {
              const pass = document.getElementById('pass').value;
              if(!pass || !confirm('Delete this?')) return;
              await fetch('/api/tips/' + id, { method: 'DELETE', headers: { 'Authorization': pass } });
              location.reload();
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
                result: document.getElementById('result').value,
                status: document.getElementById('status').value
              };
              const res = await fetch('/api/tips', { method: 'POST', body: JSON.stringify(data) });
              if(res.ok) location.reload(); else alert('Error!');
            };
            loadAdminTips();
          </script>
        `}
      </body></html>
    `;
    return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API Handlers (Pagination Fixed) ---
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const isAdmin = url.searchParams.get("admin") === "true";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "15");
    
    const iter = kv.list({ prefix: ["tips"] });
    const tips = [];
    for await (const res of iter) { tips.push(res.value); }
    
    // Newest first sorting
    tips.sort((a, b) => Number(b.id) - Number(a.id));

    if (isAdmin) {
      return new Response(JSON.stringify({ data: tips }), { headers: { "Content-Type": "application/json" } });
    }

    // Pagination Logic
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = tips.slice(startIndex, endIndex);

    return new Response(JSON.stringify({
      data: paginatedData,
      hasNext: endIndex < tips.length,
      hasPrev: page > 1
    }), { headers: { "Content-Type": "application/json; charset=UTF-8" } });
  }

  // Post & Delete logic (Remains same)
  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json();
    if (body.password !== storedPass) return new Response("Unauthorized", { status: 401 });
    const id = body.id || Date.now().toString(); 
    await kv.set(["tips", id], { ...body, id, password: undefined });
    return new Response("OK");
  }

  if (url.pathname.startsWith("/api/tips/") && req.method === "DELETE") {
    const auth = req.headers.get("Authorization");
    if (auth !== storedPass) return new Response("Unauthorized", { status: 401 });
    const id = url.pathname.split("/")[3];
    await kv.delete(["tips", id]);
    return new Response("OK");
  }

  if (url.pathname === "/api/config" && req.method === "POST") {
    if (storedPass) return new Response("Forbidden", { status: 403 });
    const { pass } = await req.json();
    await kv.set(["config", "admin_password"], pass);
    return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});
