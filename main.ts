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
    .match-row:hover { background-color: #1a1a1a; }
    .win-row { background-color: rgba(239, 68, 68, 0.05); }
    .page-btn { background: #222; color: #888; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .page-btn.active { background: #f3ca52; color: #000; }
    .vip-badge { background: #f3ca52; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 900; vertical-align: middle; margin-left: 5px; }
    .stripe-input { width: 100%; padding: 12px; border: 1px solid #e6ebf1; border-radius: 5px; color: #32325d; font-size: 16px; margin-bottom: 15px; outline: none; }
    .spinner { border: 4px solid rgba(0,0,0,0.1); border-top: 4px solid #3182ce; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .success-icon { width: 70px; height: 70px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: white; font-size: 35px; }
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
            <h2 class="text-2xl font-bold mb-4 uppercase tracking-[0.2em]">Premium Football Intelligence</h2>
            <p class="text-zinc-500 text-xl leading-relaxed italic max-w-3xl mx-auto">
              Welcome to Winner Soccer. Our expert analysis combines deep statistical data with professional market insights to deliver high-accuracy predictions. Elevate your winning game today.
            </p>
            <div class="mt-8 flex justify-center gap-6">
                <span class="text-xs font-black text-yellow-500 uppercase tracking-widest border-b-2 border-yellow-500 pb-1">✓ 90% Accuracy</span>
                <span class="text-xs font-black text-yellow-500 uppercase tracking-widest border-b-2 border-yellow-500 pb-1">✓ Expert Analysis</span>
            </div>
          </section>

          <div class="grid grid-cols-2 gap-10 mb-20 max-w-4xl mx-auto">
              <div class="card-bg rounded-2xl p-10 border-b-4 border-yellow-600 shadow-2xl transition hover:-translate-y-1">
                  <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-sm uppercase tracking-widest">Normal Access</div>
                  <h2 class="text-6xl font-black mb-6">55$ <span class="text-xs text-zinc-600">/3 TIPS</span></h2>
                  <a href="/checkout?plan=Standard" class="bg-sky-600 hover:bg-sky-500 block py-4 rounded-full font-black text-sm uppercase tracking-widest">Get Started</a>
              </div>
              <div class="card-bg rounded-2xl p-10 border-b-4 border-sky-600 shadow-2xl transition hover:-translate-y-1">
                  <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-sm uppercase tracking-widest">VIP Intelligence</div>
                  <h2 class="text-6xl font-black mb-6">650$ <span class="text-xs text-zinc-600">/1 TIP</span></h2>
                  <a href="/checkout?plan=VIP" class="bg-sky-600 hover:bg-sky-500 block py-4 rounded-full font-black text-sm uppercase tracking-widest">Join VIP</a>
              </div>
          </div>

          <div class="text-left border-l-8 border-yellow-500 pl-6 mb-6">
              <h3 class="text-yellow-500 font-black text-2xl uppercase tracking-tighter">Verified Daily History</h3>
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
          <footer class="py-16 border-t border-zinc-900 text-[10px] font-black text-zinc-800 uppercase tracking-widest">&copy; 2025 WINNER-SOCCER.COM | POWERED BY DENO PRO</footer>
        </div>
        <script>
          let currentPage = 1; const limit = 15;
          async function fetchTips(page = 1) {
            const res = await fetch('/api/tips?page=' + page + '&limit=' + limit);
            const { data, totalPages } = await res.json();
            document.getElementById('tips-table-body').innerHTML = data.map(t => {
              const statusClass = t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : 'text-sky-600');
              const rowClass = t.status === 'Win' ? 'match-row win-row' : 'match-row';
              const vipBadge = t.isVip ? '<span class="vip-badge">VIP</span>' : '';
              return '<tr class="' + rowClass + '">' +
                '<td class="p-4 text-zinc-500 text-xs font-bold border-r border-white/5">' + t.date + '</td>' +
                '<td class="p-4 text-zinc-400 font-black uppercase text-[10px] border-r border-white/5">' + t.league + '</td>' +
                '<td class="p-4 text-yellow-500 font-bold text-lg border-r border-white/5">' + t.match + ' ' + vipBadge + '</td>' +
                '<td class="p-4 font-bold text-zinc-200 border-r border-white/5">' + t.tip + '</td>' +
                '<td class="p-4 text-zinc-500 font-mono border-r border-white/5">' + t.odds + '</td>' +
                '<td class="p-4 font-black text-2xl text-zinc-300 border-r border-white/5">' + (t.result || '-:-') + '</td>' +
                '<td class="p-4 ' + statusClass + ' italic text-3xl uppercase tracking-tighter">' + t.status + '</td>' +
                '</tr>';
            }).join('');
            let pgHtml = ''; for(let i=1; i<=totalPages; i++) pgHtml += '<button onclick="changePage(' + i + ')" class="page-btn ' + (i === page ? 'active' : '') + '">' + i + '</button>';
            document.getElementById('pagination').innerHTML = pgHtml;
          }
          window.changePage = (p) => { currentPage = p; fetchTips(p); window.scrollTo({ top: 600, behavior: 'smooth' }); }
          fetchTips(currentPage);
        </script>
      </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. CHECKOUT PAGE
  if (url.pathname === "/checkout" && req.method === "GET") {
    const plan = url.searchParams.get("plan") || "Standard";
    const price = plan === "VIP" ? "650.00" : "55.00";
    return new Response(`<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="bg-[#f6f9fc] text-[#32325d] flex items-center justify-center min-h-screen p-4">
      <div class="bg-white p-8 rounded-xl shadow-2xl max-w-[450px] w-full" id="paymentBox">
        <h1 class="text-3xl font-bold mb-8 italic text-[#32325d]">Add payment method</h1>
        <form id="payForm">
          <label class="block text-gray-500 font-medium mb-2 text-sm uppercase">Email address</label>
          <input type="email" class="stripe-input" placeholder="email@example.com" required>
          <label class="block text-gray-500 font-medium mb-2 text-sm uppercase">Card information</label>
          <div class="relative mb-4">
            <input type="text" id="cardNum" class="stripe-input !mb-0" placeholder="1234 1234 1234 1234" maxlength="19" required>
            <span id="cardIcon" class="absolute right-3 top-3 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 tracking-tighter uppercase">CARD</span>
          </div>
          <div class="flex gap-4"><input type="text" id="expiry" class="stripe-input" placeholder="MM / YY" maxlength="7" required><input type="text" class="stripe-input" placeholder="CVC" maxlength="3" required></div>
          <label class="block text-gray-500 font-medium mb-2 text-sm uppercase">Country</label>
          <select id="country" class="stripe-input"></select>
          <button type="submit" id="payBtn" class="bg-[#c1e1a6] text-[#445633] w-full py-4 rounded font-black text-lg mt-4 uppercase tracking-widest">Pay $${price}</button>
        </form>
      </div>

      <div id="overlay" class="fixed inset-0 bg-white flex flex-col items-center justify-center hidden">
          <div id="spinner" class="spinner border-blue-600 border-t-blue-100 !w-16 !h-16 !border-8"></div>
          <div id="successAnim" class="hidden text-center">
              <div class="success-icon">&check;</div>
              <h2 class="text-3xl font-bold mb-2 text-[#32325d]">Payment Successful!</h2>
              <p class="text-gray-500 italic">Redirecting to Winner Soccer...</p>
          </div>
          <div id="errorMsg" class="hidden text-center text-red-600 font-bold p-6">
              <div class="text-5xl mb-4">❌</div>
              <h2 class="text-2xl mb-2 italic">Transaction Declined</h2>
              <p class="mb-6 font-medium text-gray-500">Please check your card details and try again.</p>
              <button onclick="location.reload()" class="bg-gray-100 px-8 py-2 rounded text-black font-black uppercase text-sm">Retry</button>
          </div>
      </div>

      <script>
        const countries = ["United States", "United Kingdom", "Myanmar", "Seychelles", "Singapore", "Thailand", "Germany", "France", "Japan", "Others..."];
        document.getElementById('country').innerHTML = countries.map(c => '<option value="' + c + '">' + c + '</option>').join('');

        const cardNum = document.getElementById('cardNum');
        const cardIcon = document.getElementById('cardIcon');
        const expiry = document.getElementById('expiry');

        cardNum.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\\D/g, '');
          e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
          if(v.startsWith('4')) { cardIcon.innerText = "VISA"; cardIcon.className = "absolute right-3 top-3 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-black"; }
          else if(v.startsWith('5')) { cardIcon.innerText = "MASTER"; cardIcon.className = "absolute right-3 top-3 bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-black"; }
          else if(v.startsWith('3')) { cardIcon.innerText = "AMEX"; cardIcon.className = "absolute right-3 top-3 bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-black"; }
          else { cardIcon.innerText = "CARD"; cardIcon.className = "absolute right-3 top-3 bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black"; }
        });

        expiry.addEventListener('input', (e) => {
          let v = e.target.value.replace(/\\D/g, '');
          if(v.length > 2) v = v.substring(0,2) + ' / ' + v.substring(2,4);
          e.target.value = v;
        });

        document.getElementById('payForm').onsubmit = (e) => {
          e.preventDefault();
          document.getElementById('overlay').classList.remove('hidden');
          setTimeout(() => {
            document.getElementById('spinner').classList.add('hidden');
            if (cardNum.value.replace(/\\s/g,'') === "${VALID_CARD}") {
              document.getElementById('successAnim').classList.remove('hidden');
              setTimeout(() => location.href = "/", 2500);
            } else {
              document.getElementById('errorMsg').classList.remove('hidden');
            }
          }, 2500);
        };
      </script></body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 3. ADMIN PANEL
  if (url.pathname === "/admin" && req.method === "GET") {
    let adminContent = "";
    if (!storedPass) {
      adminContent = `<div class="card-bg p-8 rounded-xl shadow-2xl"><input type="password" id="newPass" placeholder="Set Password" class="bg-zinc-900 border border-zinc-700 p-4 w-full rounded mb-4 text-white"><button onclick="setPass()" class="bg-yellow-600 w-full py-4 font-black rounded-lg">SAVE PASSWORD</button></div>
          <script>async function setPass(){ const pass=document.getElementById('newPass').value; await fetch('/api/config',{method:'POST',body:JSON.stringify({pass})}); location.reload(); }</script>`;
    } else {
      adminContent = `<div class="card-bg p-8 rounded-2xl mb-12 shadow-2xl border-t-4 border-yellow-500">
          <input type="hidden" id="tipId"><input type="password" id="pass" placeholder="Secret Key" class="bg-zinc-900 p-4 w-full rounded mb-6 text-white font-bold">
          <div class="grid grid-cols-2 gap-4 mb-4"><input type="text" id="date" placeholder="19/12 20:00" class="bg-zinc-900 p-4 rounded text-white"><input type="text" id="league" placeholder="ENG PR" class="bg-zinc-900 p-4 rounded text-white"></div>
          <input type="text" id="match" placeholder="Home - Away" class="bg-zinc-900 p-4 w-full rounded mb-4 text-white">
          <input type="text" id="tip" placeholder="Prediction" class="bg-zinc-900 p-4 w-full rounded mb-4 text-white">
          <div class="grid grid-cols-2 gap-4 mb-4"><input type="text" id="odds" placeholder="Odds" class="bg-zinc-900 p-4 rounded text-white"><input type="text" id="result" placeholder="Score" class="bg-zinc-900 p-4 rounded text-white"></div>
          <div class="flex items-center gap-4 mb-6 bg-zinc-900 p-4 rounded"><label class="text-yellow-500 uppercase text-xs font-bold">VIP Tip?</label><input type="checkbox" id="isVip" class="w-6 h-6"></div>
          <select id="status" class="bg-zinc-900 p-4 w-full rounded mb-8 text-white font-bold"><option value="Pending">Pending</option><option value="Win">Win</option><option value="Lose">Lose</option></select>
          <button id="saveBtn" class="bg-yellow-600 w-full py-5 rounded-xl font-black text-xl uppercase tracking-widest">Post Record</button>
        </div>
        <div id="admin-list" class="space-y-3"></div>
        <script>
          async function loadAdmin(){ const res=await fetch('/api/tips?admin=true'); const {data}=await res.json(); document.getElementById('admin-list').innerHTML=data.map(t=> '<div class="card-bg p-4 flex justify-between items-center text-xs"><span class="font-bold text-yellow-500">' + t.match + ' (' + t.status + ')</span><div class="flex gap-4"><button onclick=\\'editTip(' + JSON.stringify(t) + ')\\' class="text-sky-400 font-bold underline">EDIT</button><button onclick=\\'deleteTip("' + t.id + '")\\' class="text-red-500 font-bold underline">DEL</button></div></div>').join(''); }
          window.editTip=(t)=>{ document.getElementById('tipId').value=t.id; document.getElementById('date').value=t.date; document.getElementById('league').value=t.league; document.getElementById('match').value=t.match; document.getElementById('tip').value=t.tip; document.getElementById('odds').value=t.odds; document.getElementById('result').value=t.result||''; document.getElementById('status').value=t.status; document.getElementById('isVip').checked=t.isVip||false; window.scrollTo(0,0); };
          window.deleteTip=async(id)=>{ const pass=document.getElementById('pass').value; if(!pass||!confirm('Delete?'))return; await fetch('/api/tips/'+id,{method:'DELETE',headers:{'Authorization':pass}}); location.reload(); };
          document.getElementById('saveBtn').onclick=async()=>{ const d={ id:document.getElementById('tipId').value||null, password:document.getElementById('pass').value, date:document.getElementById('date').value, league:document.getElementById('league').value, match:document.getElementById('match').value, tip:document.getElementById('tip').value, odds:document.getElementById('odds').value, result:document.getElementById('result').value, status:document.getElementById('status').value, isVip:document.getElementById('isVip').checked }; await fetch('/api/tips',{method:'POST',body:JSON.stringify(d)}); location.reload(); };
          loadAdmin();
        </script>`;
    }

    const adminHtml = `<!DOCTYPE html><html><head>${UI_HEAD}</head><body class="p-6 max-w-2xl mx-auto"><h2 class="text-3xl font-black text-yellow-500 mb-8 italic uppercase">Admin Dashboard</h2>${adminContent}</body></html>`;
    return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API HANDLERS ---
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const isAdmin = url.searchParams.get("admin") === "true";
    const page = parseInt(url.searchParams.get("page") || "1");
    const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
    tips.sort((a, b) => Number(b.id) - Number(a.id));
    if (isAdmin) return new Response(JSON.stringify({ data: tips }), { headers: { "Content-Type": "application/json" } });
    const limit = 15; const startIndex = (page - 1) * limit;
    return new Response(JSON.stringify({ data: tips.slice(startIndex, startIndex + limit), totalPages: Math.ceil(tips.length / limit) }), { headers: { "Content-Type": "application/json; charset=UTF-8" } });
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json(); if (body.password !== storedPass) return new Response("Error", { status: 401 });
    const id = body.id || Date.now().toString(); await kv.set(["tips", id], { ...body, id, password: undefined });
    return new Response("OK");
  }

  if (url.pathname.startsWith("/api/tips/") && req.method === "DELETE") {
    const auth = req.headers.get("Authorization"); if (auth !== storedPass) return new Response("Error", { status: 401 });
    const id = url.pathname.split("/")[3]; await kv.delete(["tips", id]); return new Response("OK");
  }

  if (url.pathname === "/api/config" && req.method === "POST") {
    if (storedPass) return new Response("Forbidden", { status: 403 });
    const { pass } = await req.json(); await kv.set(["config", "admin_password"], pass); return new Response("OK");
  }

  return new Response("Not Found", { status: 404 });
});
