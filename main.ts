import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

async function getStoredPassword() {
  const entry = await kv.get(["config", "admin_password"]);
  return entry.value as string | null;
}

// Desktop Feel ရအောင် Viewport နဲ့ Font Size ကို ညှိထားပါတယ်
const UI_HEAD = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1024"> 
  <title>Winner Soccer Tips</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes glow {
      0%, 100% { text-shadow: 0 0 5px #ef4444; transform: scale(1); }
      50% { text-shadow: 0 0 15px #ef4444; transform: scale(1.02); }
    }
    .win-effect { animation: glow 1.5s infinite; color: #ef4444; font-weight: 800; }
    body { background-color: #0c0c0c; color: #fff; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 14px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #111; border: 1px solid #222; }
    .match-row { background-color: #141414; border-bottom: 1px solid #222; transition: background 0.2s; }
    .match-row:hover { background-color: #1a1a1a; }
    .page-btn { background: #222; color: #888; padding: 5px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    .page-btn.active { background: #f3ca52; color: #000; }
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
      <body class="p-6">
        <div class="max-w-[1100px] mx-auto">
          <header class="flex flex-col items-center py-6 border-b border-zinc-800 mb-8">
            <h1 class="text-4xl font-black italic text-yellow-500 tracking-tighter uppercase">Winner Soccer</h1>
            <p class="text-zinc-500 text-sm mt-2 tracking-[0.3em] uppercase font-bold">Premium Football Intelligence</p>
          </header>

          <div class="grid grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
              <div class="card-bg rounded-lg p-6 text-center shadow-xl">
                  <div class="gold-gradient text-black font-bold py-1 rounded mb-4 text-xs uppercase">Normal Tips Plan</div>
                  <h2 class="text-4xl font-black mb-4">55$ <span class="text-xs text-zinc-600">/3 TIPS</span></h2>
                  <button class="bg-sky-600 hover:bg-sky-500 w-full py-2 rounded font-bold text-sm uppercase">Activate Now</button>
              </div>
              <div class="card-bg rounded-lg p-6 text-center shadow-xl">
                  <div class="gold-gradient text-black font-bold py-1 rounded mb-4 text-xs uppercase">VIP Intelligence</div>
                  <h2 class="text-4xl font-black mb-4">650$ <span class="text-xs text-zinc-600">/1 TIP</span></h2>
                  <button class="bg-sky-600 hover:bg-sky-500 w-full py-2 rounded font-bold text-sm uppercase">Join VIP Group</button>
              </div>
          </div>

          <div class="flex justify-between items-center mb-4 border-l-4 border-yellow-500 pl-3">
              <h3 class="text-yellow-500 font-bold text-lg uppercase">Latest Verified Results</h3>
          </div>
          
          <div class="card-bg rounded-lg overflow-hidden overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr class="gold-gradient text-black text-xs font-black uppercase">
                  <th class="p-3">Date</th>
                  <th class="p-3">League</th>
                  <th class="p-3">Match</th>
                  <th class="p-3">Tip</th>
                  <th class="p-3">Odds</th>
                  <th class="p-3 text-center">Result</th>
                  <th class="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody id="tips-table-body">
                </tbody>
            </table>
          </div>

          <div id="pagination" class="flex justify-center items-center gap-2 mt-8 mb-16"></div>

          <footer class="mt-10 py-8 border-t border-zinc-900 text-center">
             <p class="text-zinc-700 text-[10px] font-black uppercase tracking-widest">&copy; 2025 WINNER-SOCCER.COM</p>
          </footer>
        </div>

        <script>
          let currentPage = 1;
          const limit = 15;

          async function fetchTips(page = 1) {
            const res = await fetch(\`/api/tips?page=\${page}&limit=\${limit}\`);
            const { data, total, totalPages } = await res.json();
            
            const tbody = document.getElementById('tips-table-body');
            tbody.innerHTML = data.map(t => {
              const statusClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-600' : 'text-sky-500');
              return \`
                <tr class="match-row">
                  <td class="p-3 text-zinc-500 text-xs">\${t.date}</td>
                  <td class="p-3 text-zinc-400 font-bold uppercase text-[11px]">\${t.league}</td>
                  <td class="p-3 text-yellow-500 font-bold">\${t.match}</td>
                  <td class="p-3 font-semibold">\${t.tip}</td>
                  <td class="p-3 text-zinc-400 font-mono">\${t.odds}</td>
                  <td class="p-3 text-center font-black text-lg text-zinc-300">\${t.result || '-:-'}</td>
                  <td class="p-3 text-right \${statusClass} italic text-xl">\${t.status}</td>
                </tr>\`;
            }).join('');

            // Pagination Logic
            const pgContainer = document.getElementById('pagination');
            let pgHtml = '';
            for(let i=1; i<=totalPages; i++) {
              pgHtml += \`<button onclick="changePage(\${i})" class="page-btn \${i === page ? 'active' : ''}">\${i}</button>\`;
            }
            pgContainer.innerHTML = pgHtml;
          }

          window.changePage = (p) => {
            currentPage = p;
            fetchTips(p);
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }

          fetchTips(currentPage);
        </script>
      </body></html>
    `;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // (Admin logic can remain mostly same, focusing on Desktop scale for inputs)
  if (url.pathname === "/admin" && req.method === "GET") {
     const adminHtml = `<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto">
      <h2 class="text-2xl font-black text-yellow-500 mb-6 uppercase">Admin Dashboard</h2>
      ${!storedPass ? `
          <div class="card-bg p-6 rounded-lg">
            <input type="password" id="newPass" placeholder="Setup Password" class="bg-zinc-900 border border-zinc-700 p-3 w-full rounded mb-4 text-white">
            <button onclick="setPass()" class="bg-yellow-600 w-full py-3 font-bold">SAVE PASSWORD</button>
          </div>
          <script>
            async function setPass() {
              const pass = document.getElementById('newPass').value;
              await fetch('/api/config', { method: 'POST', body: JSON.stringify({ pass }) });
              location.reload();
            }
          </script>
      ` : `
        <div class="card-bg p-6 rounded-lg mb-8">
          <input type="hidden" id="tipId">
          <input type="password" id="pass" placeholder="Secret Key" class="bg-zinc-900 border border-zinc-700 p-3 w-full rounded mb-4 text-white">
          <div class="grid grid-cols-2 gap-3 mb-4">
            <input type="text" id="date" placeholder="Date" class="bg-zinc-900 border border-zinc-700 p-3 rounded text-white text-sm">
            <input type="text" id="league" placeholder="League" class="bg-zinc-900 border border-zinc-700 p-3 rounded text-white text-sm">
          </div>
          <input type="text" id="match" placeholder="Home - Away" class="bg-zinc-900 border border-zinc-700 p-3 w-full rounded mb-4 text-white text-sm">
          <input type="text" id="tip" placeholder="Prediction" class="bg-zinc-900 border border-zinc-700 p-3 w-full rounded mb-4 text-white text-sm">
          <div class="grid grid-cols-2 gap-3 mb-4">
            <input type="text" id="odds" placeholder="Odds" class="bg-zinc-900 border border-zinc-700 p-3 rounded text-white text-sm">
            <input type="text" id="result" placeholder="Result (2:1)" class="bg-zinc-900 border border-zinc-700 p-3 rounded text-white text-sm">
          </div>
          <select id="status" class="bg-zinc-900 border border-zinc-700 p-3 w-full rounded mb-4 text-white text-sm">
            <option value="Pending">Pending</option>
            <option value="Win">Win</option>
            <option value="Lose">Lose</option>
          </select>
          <button id="saveBtn" class="bg-yellow-600 w-full py-3 font-bold rounded">SAVE RECORD</button>
        </div>
        <div id="admin-list" class="space-y-2"></div>
        <script>
          async function loadAdmin() {
            const res = await fetch('/api/tips?admin=true');
            const { data } = await res.json();
            document.getElementById('admin-list').innerHTML = data.map(t => \`
              <div class="card-bg p-3 flex justify-between items-center text-xs">
                <span>\${t.match} (\${t.status})</span>
                <div class="flex gap-2">
                  <button onclick='editTip(\${JSON.stringify(t)})' class="text-sky-400 font-bold underline">EDIT</button>
                  <button onclick='deleteTip("\${t.id}")' class="text-red-500 font-bold underline">DEL</button>
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
            window.scrollTo(0,0);
          };
          window.deleteTip = async (id) => {
             const pass = document.getElementById('pass').value;
             if(!pass || !confirm('Delete?')) return;
             await fetch('/api/tips/'+id, { method: 'DELETE', headers: { 'Authorization': pass } });
             location.reload();
          };
          document.getElementById('saveBtn').onclick = async () => {
            const d = {
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
            const r = await fetch('/api/tips', { method: 'POST', body: JSON.stringify(d) });
            if(r.ok) location.reload(); else alert('Error!');
          };
          loadAdmin();
        </script>
      `}</body></html>`;
     return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API ---
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const isAdmin = url.searchParams.get("admin") === "true";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "15");
    
    const iter = kv.list({ prefix: ["tips"] });
    const tips = [];
    for await (const res of iter) { tips.push(res.value); }
    tips.sort((a, b) => Number(b.id) - Number(a.id));

    if (isAdmin) {
      return new Response(JSON.stringify({ data: tips }), { headers: { "Content-Type": "application/json" } });
    }

    const startIndex = (page - 1) * limit;
    const paginatedData = tips.slice(startIndex, startIndex + limit);

    return new Response(JSON.stringify({
      data: paginatedData,
      total: tips.length,
      totalPages: Math.ceil(tips.length / limit)
    }), { headers: { "Content-Type": "application/json; charset=UTF-8" } });
  }

  // (Post/Delete/Config APIs remain functional)
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
