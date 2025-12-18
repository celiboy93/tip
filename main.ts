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
    .page-btn { background: #222; color: #888; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .page-btn.active { background: #f3ca52; color: #000; }
    .vip-badge { background: #f3ca52; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 900; vertical-align: middle; margin-left: 5px; }
    .stripe-input { width: 100%; padding: 12px; border: 1px solid #e6ebf1; border-radius: 5px; color: #32325d; font-size: 16px; margin-bottom: 15px; }
    .stripe-btn { background-color: #c1e1a6; color: #445633; width: 100%; padding: 14px; border-radius: 5px; font-weight: 700; font-size: 17px; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. HOME PAGE
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<!DOCTYPE html><html lang="en"><head>${UI_HEAD}</head><body class="p-6">
        <div class="max-w-[1050px] mx-auto text-center">
          <header class="py-12"><h1 class="text-6xl font-black italic text-yellow-500 tracking-tighter uppercase">Winner Soccer</h1></header>
          
          <section class="mb-16 px-10">
            <h2 class="text-2xl font-bold mb-4 uppercase tracking-widest">Premium Football Intelligence</h2>
            <p class="text-zinc-500 text-xl italic max-w-3xl mx-auto">Welcome to Winner Soccer. Our expert analysis combines deep statistical data with professional market insights to deliver high-accuracy predictions.</p>
          </section>

          <div class="grid grid-cols-2 gap-10 mb-20 max-w-4xl mx-auto">
              <div class="card-bg rounded-2xl p-10 border-b-4 border-yellow-600">
                  <h2 class="text-6xl font-black mb-6">55$</h2>
                  <a href="/checkout?plan=Standard" class="bg-sky-600 block py-4 rounded-full font-black text-sm uppercase">Get Started</a>
              </div>
              <div class="card-bg rounded-2xl p-10 border-b-4 border-sky-600">
                  <h2 class="text-6xl font-black mb-6">650$</h2>
                  <a href="/checkout?plan=VIP" class="bg-sky-600 block py-4 rounded-full font-black text-sm uppercase">Join VIP</a>
              </div>
          </div>

          <div class="text-left border-l-8 border-yellow-500 pl-6 mb-6">
              <h3 class="text-yellow-500 font-black text-2xl uppercase">Verified Daily History</h3>
          </div>
          
          <div class="card-bg rounded-2xl overflow-hidden shadow-2xl">
            <table class="w-full border-collapse">
              <thead><tr class="gold-gradient text-black text-[11px] font-black uppercase">
                <th class="p-4 border-r border-black/10">Date</th><th class="p-4 border-r border-black/10">League</th><th class="p-4 border-r border-black/10">Match</th>
                <th class="p-4 border-r border-black/10">Prediction</th><th class="p-4 border-r border-black/10">Odds</th><th class="p-4 border-r border-black/10">Score</th><th class="p-4">Status</th>
              </tr></thead>
              <tbody id="tips-table-body"></tbody>
            </table>
          </div>
          <div id="pagination" class="flex justify-center items-center gap-2 mt-12 mb-24"></div>
          <footer class="py-16 border-t border-zinc-900 text-[10px] font-black text-zinc-800 uppercase tracking-widest">&copy; 2025 WINNER-SOCCER.COM</footer>
        </div>
        <script>
          let currentPage = 1; const limit = 15;
          async function fetchTips(page = 1) {
            const res = await fetch(\`/api/tips?page=\${page}&limit=\${limit}\`);
            const { data, totalPages } = await res.json();
            document.getElementById('tips-table-body').innerHTML = data.map(t => {
              const statusClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : 'text-sky-600');
              return \`
                <tr class="match-row \${t.status === 'Win' ? 'win-row' : ''}">
                  <td class="p-4 text-zinc-500 text-xs font-bold border-r border-white/5">\${t.date}</td>
                  <td class="p-4 text-zinc-400 font-black uppercase text-[10px] border-r border-white/5">\${t.league}</td>
                  <td class="p-4 text-yellow-500 font-bold text-lg border-r border-white/5">\${t.match} \${t.isVip ? '<span class="vip-badge">VIP</span>' : ''}</td>
                  <td class="p-4 font-bold text-zinc-200 border-r border-white/5">\${t.tip}</td>
                  <td class="p-4 text-zinc-500 font-mono border-r border-white/5">\${t.odds}</td>
                  <td class="p-4 font-black text-2xl text-zinc-300 border-r border-white/5">\${t.result || '-:-'}</td>
                  <td class="p-4 \${statusClass} italic text-3xl uppercase tracking-tighter">\${t.status}</td>
                </tr>\`;
            }).join('');
            let pgHtml = ''; for(let i=1; i<=totalPages; i++) pgHtml += \`<button onclick="changePage(\${i})" class="page-btn \${i === page ? 'active' : ''}">\${i}</button>\`;
            document.getElementById('pagination').innerHTML = pgHtml;
          }
          window.changePage = (p) => { currentPage = p; fetchTips(p); window.scrollTo({ top: 600, behavior: 'smooth' }); }
          fetchTips(currentPage);
        </script>
      </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. GLOBAL STRIPE CHECKOUT PAGE
  if (url.pathname === "/checkout" && req.method === "GET") {
    const plan = url.searchParams.get("plan") || "Standard";
    const price = plan === "VIP" ? "650.00" : "55.00";
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="bg-[#f6f9fc] text-[#32325d] flex items-center justify-center min-h-screen p-4">
      <div class="bg-white p-8 rounded-xl shadow-2xl max-w-[480px] w-full">
        <h1 class="text-3xl font-bold mb-8">Pay $${price}</h1>
        <form id="payForm">
          <label class="stripe-label">Email address</label><input type="email" class="stripe-input" required>
          <label class="stripe-label">Card information</label>
          <div class="relative"><input type="text" id="cardNum" class="stripe-input" placeholder="1234 1234 1234 1234" maxlength="19" required><span class="absolute right-3 top-3 text-blue-800 font-bold text-[10px] border border-blue-800 px-1 rounded">VISA</span></div>
          <div class="flex gap-4"><input type="text" id="expiry" class="stripe-input" placeholder="MM / YY" maxlength="7" required><input type="text" class="stripe-input" placeholder="CVC" maxlength="3" required></div>
          <label class="stripe-label">Country</label>
          <select id="country" class="stripe-input"></select>
          <button type="submit" id="payBtn" class="stripe-btn mt-4">PAY NOW</button>
        </form>
        <div id="status" class="mt-4 text-center font-bold hidden"></div>
      </div>
      <script>
        const countries = ["United States", "United Kingdom", "Myanmar", "Seychelles", "Singapore", "Thailand", "Germany", "France", "Japan", "Others..."];
        document.getElementById('country').innerHTML = countries.map(c => \`<option value="\${c}">\${c}</option>\`).join('');
        
        document.getElementById('expiry').addEventListener('input', (e) => {
          let v = e.target.value.replace(/\\D/g, '');
          if (v.length > 2) v = v.substring(0,2) + ' / ' + v.substring(2,4);
          e.target.value = v;
        });

        document.getElementById('cardNum').addEventListener('input', (e) => {
          e.target.value = e.target.value.replace(/\\D/g, '').replace(/(.{4})/g, '$1 ').trim();
        });

        document.getElementById('payForm').onsubmit = async (e) => {
          e.preventDefault(); const btn = document.getElementById('payBtn'); const status = document.getElementById('status');
          btn.innerText = "Processing..."; btn.disabled = true;
          setTimeout(() => {
            if (document.getElementById('cardNum').value.replace(/\\s/g,'') === "${VALID_CARD}") {
              status.innerText = "✅ Success!"; status.className = "mt-4 text-green-600";
              status.classList.remove('hidden'); setTimeout(() => location.href = "/", 1500);
            } else {
              status.innerText = "❌ Declined."; status.className = "mt-4 text-red-600";
              status.classList.remove('hidden'); btn.innerText = "PAY NOW"; btn.disabled = false;
            }
          }, 2000);
        };
      </script></body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 3. ADMIN PANEL
  if (url.pathname === "/admin" && req.method === "GET") {
     const adminHtml = `<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto">
      <h2 class="text-3xl font-black text-yellow-500 mb-8 uppercase italic">Admin Dashboard</h2>
      ${!storedPass ? `<div class="card-bg p-8 rounded-xl"><input type="password" id="newPass" class="bg-zinc-900 p-4 w-full rounded mb-4 text-white"><button onclick="setPass()" class="bg-yellow-600 w-full py-4 font-black rounded-lg">SAVE</button></div>` : `
        <div class="card-bg p-8 rounded-2xl mb-12 shadow-2xl border-t-4 border-yellow-500">
          <input type="hidden" id="tipId"><input type="password" id="pass" placeholder="Secret Key" class="bg-zinc-900 p-4 w-full rounded mb-6 text-white font-bold">
          <div class="grid grid-cols-2 gap-4 mb-4"><input type="text" id="date" placeholder="Date" class="bg-zinc-900 p-4 rounded text-white"><input type="text" id="league" placeholder="League" class="bg-zinc-900 p-4 rounded text-white"></div>
          <input type="text" id="match" placeholder="Match" class="bg-zinc-900 p-4 w-full rounded mb-4 text-white">
          <input type="text" id="tip" placeholder="Tip" class="bg-zinc-900 p-4 w-full rounded mb-4 text-white">
          <div class="grid grid-cols-2 gap-4 mb-4"><input type="text" id="odds" placeholder="Odds" class="bg-zinc-900 p-4 rounded text-white"><input type="text" id="result" placeholder="Score" class="bg-zinc-900 p-4 rounded text-white"></div>
          <div class="flex items-center gap-4 mb-6 bg-zinc-900 p-4 rounded"><label class="text-yellow-500 uppercase text-xs font-bold">VIP Tip?</label><input type="checkbox" id="isVip" class="w-6 h-6"></div>
          <select id="status" class="bg-zinc-900 p-4 w-full rounded mb-8 text-white font-bold"><option value="Pending">Pending</option><option value="Win">Win</option><option value="Lose">Lose</option></select>
          <button id="saveBtn" class="bg-yellow-600 w-full py-5 rounded-xl font-black text-xl uppercase tracking-widest">Post Record</button>
        </div>
        <div id="admin-list" class="space-y-2"></div>
      `}
      <script>
        async function loadAdmin(){ const res = await fetch('/api/tips?admin=true'); const { data } = await res.json(); document.getElementById('admin-list').innerHTML = data.map(t => \`<div class="card-bg p-3 flex justify-between items-center text-xs"><span>\${t.match} (\${t.status})</span><button onclick='editTip(\${JSON.stringify(t)})' class="text-sky-400 font-bold underline uppercase">Edit</button></div>\`).join(''); }
        // (Other Admin JS same as before)
        loadAdmin();
      </script></body></html>`;
     return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API HANDLERS ---
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
    tips.sort((a, b) => Number(b.id) - Number(a.id));
    const page = parseInt(url.searchParams.get("page") || "1"); const limit = 15;
    const startIndex = (page - 1) * limit;
    return new Response(JSON.stringify({ data: tips.slice(startIndex, startIndex + limit), totalPages: Math.ceil(tips.length / limit) }), { headers: { "Content-Type": "application/json" } });
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json(); if (body.password !== storedPass) return new Response("Unauthorized", { status: 401 });
    const id = body.id || Date.now().toString(); await kv.set(["tips", id], { ...body, id, password: undefined });
    return new Response("OK");
  }

  if (url.pathname === "/api/config" && req.method === "POST") {
    const { pass } = await req.json(); await kv.set(["config", "admin_password"], pass); return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});
