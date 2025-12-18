import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

async function getStoredPassword() {
  const entry = await kv.get(["config", "admin_password"]);
  return entry.value as string | null;
}

// --- CSS & Large Fonts ---
const UI_CSS = `
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes glow {
      0%, 100% { text-shadow: 0 0 10px #ef4444, 0 0 20px #ef4444; transform: scale(1); }
      50% { text-shadow: 0 0 25px #ef4444, 0 0 40px #ef4444; transform: scale(1.1); }
    }
    .win-effect { animation: glow 1.5s infinite; color: #ef4444; font-weight: 900; }
    body { background-color: #0c0c0c; color: #fff; font-family: sans-serif; font-size: 18px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #141414; border: 1px solid #222; }
    input, select { background: #1a1a1a; border: 1px solid #444; color: white; padding: 15px; border-radius: 8px; width: 100%; margin-bottom: 12px; font-size: 18px; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. PUBLIC HOME PAGE
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(`<html><head>${UI_CSS}</head><body class="p-4 max-w-4xl mx-auto">
      <header class="flex justify-center items-center py-10">
        <h1 class="text-4xl font-black italic text-yellow-500 tracking-tighter uppercase">BestSoccerTips</h1>
      </header>

      <section class="text-center mb-12 px-2">
        <h2 class="text-xl font-bold text-white mb-4 uppercase tracking-widest">Premium Football Intelligence</h2>
        <p class="text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto italic">
          High-accuracy predictions powered by professional market insights. Trust the expert analysis to elevate your winning game.
        </p>
        <div class="mt-8 flex justify-center gap-3">
            <span class="bg-zinc-900 border border-zinc-800 px-5 py-2 rounded-full text-[13px] font-black text-yellow-500 shadow-lg uppercase">✓ 90% Accuracy</span>
            <span class="bg-zinc-900 border border-zinc-800 px-5 py-2 rounded-full text-[13px] font-black text-yellow-500 shadow-lg uppercase">✓ Expert Analysts</span>
        </div>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div class="card-bg rounded-2xl p-8 text-center border-t-4 border-yellow-500 shadow-2xl">
              <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-xl uppercase">Normal Tips</div>
              <h2 class="text-6xl font-black mb-6">55$ <span class="text-sm text-zinc-600">/3 TIPS</span></h2>
              <button class="bg-sky-500 w-full py-5 rounded-full font-black text-xl hover:bg-sky-400 transition-all uppercase">Activate Plan</button>
          </div>
          <div class="card-bg rounded-2xl p-8 text-center border-t-4 border-sky-500 shadow-2xl">
              <div class="gold-gradient text-black font-black py-2 rounded-lg mb-6 text-xl uppercase">VIP Intelligence</div>
              <h2 class="text-6xl font-black mb-6">650$ <span class="text-sm text-zinc-600">/1 TIP</span></h2>
              <button class="bg-sky-500 w-full py-5 rounded-full font-black text-xl hover:bg-sky-400 transition-all uppercase">Join VIP Group</button>
          </div>
      </div>

      <div class="flex justify-between items-end mb-8 border-l-4 border-yellow-500 pl-4">
          <h3 class="text-yellow-500 font-black text-xl uppercase tracking-tighter">Verified Daily Results</h3>
          <span class="text-xs text-zinc-600 font-bold uppercase tracking-widest pb-1">Showing Latest 15</span>
      </div>
      
      <div id="tips-list" class="space-y-4"></div>

      <script>
        fetch('/api/tips').then(res => res.json()).then(data => {
          document.getElementById('tips-list').innerHTML = data.map(t => \`
            <div class="card-bg p-6 rounded-2xl flex justify-between items-center shadow-lg border-b border-zinc-800">
              <div class="flex-1">
                <div class="text-[11px] text-zinc-500 font-black uppercase mb-1 tracking-wider">\${t.date} | \${t.league}</div>
                <div class="text-2xl font-black text-yellow-500">\${t.match}</div>
                <div class="text-lg mt-1 font-medium text-zinc-300">Prediction: <span class="text-white font-bold">\${t.tip}</span> | Odds: \${t.odds}</div>
              </div>
              <div class="text-center px-6">
                 <div class="text-3xl font-black text-zinc-300">\${t.result || '-:-'}</div>
                 <div class="text-[10px] uppercase text-zinc-600 font-black tracking-widest mt-1">Score</div>
              </div>
              <div class="text-right w-24">
                <div class="\${t.status === 'Win' ? 'win-effect' : (t.status === 'Lose' ? 'text-zinc-700' : 'text-sky-500')} font-black text-3xl italic uppercase tracking-tighter">
                  \${t.status}
                </div>
              </div>
            </div>
          \`).join('');
        });
      </script>
      <footer class="mt-20 py-12 border-t border-zinc-900 text-center">
         <p class="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">&copy; 2025 BESTSOCCERTIPS.COM - VERIFIED PLATFORM</p>
      </footer>
    </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. ADMIN PANEL (Hidden)
  if (url.pathname === "/admin" && req.method === "GET") {
    // ... (Admin logic remains mostly the same, ensuring UTF-8 charset)
    return new Response(\`<html><head>\${UI_CSS}</head><body class="p-6 max-w-2xl mx-auto">
        <h2 class="text-3xl font-black text-yellow-500 mb-8 uppercase tracking-tighter italic">Admin Dashboard</h2>
        <script>
            // JS to load tips for admin (all tips shown for management)
            fetch('/api/tips?admin=true').then(res => res.json()).then(data => {
                // Admin management table...
            });
        </script>
    </body></html>\`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API Handlers (Encoding & Limit Fixed) ---
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const isAdmin = url.searchParams.get("admin") === "true";
    const iter = kv.list({ prefix: ["tips"] });
    const tips = [];
    for await (const res of iter) tips.push(res.value);
    
    // နောက်ဆုံးတင်တဲ့ဟာ ထိပ်ဆုံးရောက်အောင် ID နဲ့ Sort လုပ်မယ်
    tips.sort((a, b) => Number(b.id) - Number(a.id));

    // Admin မဟုတ်ရင် နောက်ဆုံး ၁၅ ခုပဲ ပြမယ် (Web ပေါ့ပါးစေရန်)
    const result = isAdmin ? tips : tips.slice(0, 15);
    
    return new Response(JSON.stringify(result), { 
        headers: { "Content-Type": "application/json; charset=UTF-8" } 
    });
  }

  // (Post and Delete logic remains same)
  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json();
    if (body.password !== storedPass) return new Response("Unauthorized", { status: 401 });
    const id = body.id || Date.now().toString(); // Timestamp ကို ID သုံးလို့ Sorting အတွက် ပိုကောင်းတယ်
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
