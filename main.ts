import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();
const ADMIN_PASSWORD = "your_password"; // Admin Page ဝင်ဖို့ Password

// --- HTML UI (ညီကို့ Screenshot အတိုင်း Design) ---
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best Soccer Tips</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #0c0c0c; color: #fff; font-family: sans-serif; }
        .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
        .card-bg { background-color: #141414; border: 1px solid #222; }
    </style>
</head>
<body class="p-4 max-w-4xl mx-auto">
    <header class="flex justify-between items-center py-4 border-b border-zinc-800 mb-6">
        <h1 class="text-xl font-bold italic text-yellow-500">BESTSOCCERTIPS</h1>
        <button class="bg-zinc-800 px-4 py-1 rounded text-sm">Sign In</button>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div class="card-bg rounded-lg overflow-hidden text-center p-6">
            <div class="gold-gradient text-black font-bold py-2 mb-4">3 NORMAL TIPS</div>
            <h2 class="text-4xl font-bold mb-4">55$ <span class="text-sm text-zinc-500">/3 TIPS</span></h2>
            <ul class="text-zinc-400 text-sm mb-6 text-left space-y-2">
                <li>✓ Activate account immediately</li>
                <li>✓ 3 days access (75% Confidence)</li>
            </ul>
            <button class="bg-sky-500 hover:bg-sky-600 w-full py-2 rounded-full font-bold">Buy Now</button>
        </div>
        <div class="card-bg rounded-lg overflow-hidden text-center p-6">
            <div class="gold-gradient text-black font-bold py-2 mb-4">30 NORMAL TIPS</div>
            <h2 class="text-4xl font-bold mb-4">350$ <span class="text-sm text-zinc-500">/30 TIPS</span></h2>
            <ul class="text-zinc-400 text-sm mb-6 text-left space-y-2">
                <li>✓ 1 month access (75% Confidence)</li>
                <li>✓ 1 month support</li>
            </ul>
            <button class="bg-sky-500 hover:bg-sky-600 w-full py-2 rounded-full font-bold">Buy Now</button>
        </div>
    </div>

    <h3 class="text-yellow-500 font-bold mb-4 tracking-widest text-sm">LATEST 10 PREMIUM TIPS</h3>
    <div class="overflow-x-auto">
        <table class="w-full text-xs md:text-sm text-left border-collapse">
            <thead>
                <tr class="gold-gradient text-black font-bold">
                    <th class="p-2 border border-black/10">DATE</th>
                    <th class="p-2 border border-black/10">LEAGUE</th>
                    <th class="p-2 border border-black/10">MATCH</th>
                    <th class="p-2 border border-black/10">TIPS</th>
                    <th class="p-2 border border-black/10">ODDS</th>
                    <th class="p-2 border border-black/10">STATUS</th>
                </tr>
            </thead>
            <tbody id="tips-body">
                </tbody>
        </table>
    </div>

    <script>
        async function loadTips() {
            const res = await fetch('/api/tips');
            const tips = await res.json();
            const body = document.getElementById('tips-body');
            body.innerHTML = tips.map(t => \`
                <tr class="bg-zinc-900 border-b border-zinc-800">
                    <td class="p-3 text-zinc-400">\${t.date}</td>
                    <td class="p-3">\${t.league}</td>
                    <td class="p-3 text-yellow-500">\${t.match}</td>
                    <td class="p-3 text-yellow-500 font-bold">\${t.tip}</td>
                    <td class="p-3 font-mono">\${t.odds}</td>
                    <td class="p-3 \${t.status === 'Win' ? 'text-red-600' : 'text-zinc-500'} font-bold">\${t.status}</td>
                </tr>
            \`).join('');
        }
        loadTips();
    </script>
</body>
</html>
`;

// --- Server Logic ---
serve(async (req) => {
  const url = new URL(req.url);

  // 1. Home Page - HTML ကို ပြန်ပို့ပေးမယ်
  if (url.pathname === "/" && req.method === "GET") {
    return new Response(HTML_CONTENT, { headers: { "Content-Type": "text/html" } });
  }

  // 2. API: Get Tips - KV ထဲက ဒေတာတွေ ထုတ်ပေးမယ်
  if (url.pathname === "/api/tips" && req.method === "GET") {
    const iter = kv.list({ prefix: ["tips"] });
    const tips = [];
    for await (const res of iter) tips.push(res.value);
    return new Response(JSON.stringify(tips.reverse()), { headers: { "Content-Type": "application/json" } });
  }

  // 3. API: Post Tip - ဒေတာအသစ် ထည့်မယ်
  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json();
    if (body.password !== ADMIN_PASSWORD) return new Response("Unauthorized", { status: 401 });
    
    const id = Date.now().toString();
    const newTip = { id, ...body };
    delete newTip.password; // password ကို KV ထဲ မသိမ်းပါ
    
    await kv.set(["tips", id], newTip);
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response("Not Found", { status: 404 });
});
