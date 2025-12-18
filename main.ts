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
    @keyframes glow { 0%, 100% { text-shadow: 0 0 10px #ef4444; color: #ef4444; } 50% { text-shadow: 0 0 20px #ef4444; color: #ff5f5f; } }
    .win-effect { animation: glow 1.2s infinite; font-weight: 900; }
    body { background-color: #0c0c0c; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #111; border: 1px solid #222; }
    .match-row { background-color: #141414; border-bottom: 1px solid #222; text-align: center; }
    
    /* Stripe Style Classes */
    .stripe-bg { background-color: #f6f9fc; color: #32325d; }
    .stripe-card { background: white; border-radius: 8px; box-shadow: 0 7px 14px rgba(50,50,93,.1), 0 3px 6px rgba(0,0,0,.08); }
    .stripe-input { width: 100%; padding: 12px; border: 1px solid #e6ebf1; border-radius: 4px; transition: box-shadow .15s ease; color: #32325d; font-size: 16px; }
    .stripe-input:focus { box-shadow: 0 1px 3px rgba(50,50,93,.15), 0 1px 0 rgba(0,0,0,.02); outline: none; border-color: #80bdff; }
    .stripe-label { display: block; margin-bottom: 8px; font-weight: 500; color: #6b7c93; font-size: 14px; }
    .stripe-btn-main { background-color: #c1e1a6; color: #445633; width: 100%; padding: 14px; border-radius: 4px; font-weight: 600; font-size: 17px; transition: all .15s ease; }
    .stripe-btn-main:hover { background-color: #b1d196; }
    .stripe-tab { border: 2px solid transparent; padding: 12px; border-radius: 6px; cursor: pointer; text-align: center; flex: 1; border: 1px solid #e6ebf1; margin: 0 4px; }
    .stripe-tab.active { border-color: #6772e5; color: #6772e5; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. PUBLIC HOME PAGE (Same logic as before)
  if (url.pathname === "/" && req.method === "GET") {
    // ... Home page content remains same ...
    return new Response(`<html><head>${UI_HEAD}</head><body class="p-6">
        <div class="max-w-[1050px] mx-auto">
          <header class="flex flex-col items-center py-12">
            <h1 class="text-6xl font-black italic text-yellow-500 tracking-tighter uppercase">Winner Soccer</h1>
          </header>
          <div class="grid grid-cols-2 gap-10 mb-20 max-w-4xl mx-auto">
              <div class="card-bg rounded-2xl p-10 text-center shadow-2xl">
                  <h2 class="text-6xl font-black mb-6">55$</h2>
                  <a href="/checkout?plan=Standard" class="bg-sky-600 block py-4 rounded-full font-black text-sm uppercase">Get Started</a>
              </div>
              <div class="card-bg rounded-2xl p-10 text-center shadow-2xl">
                  <h2 class="text-6xl font-black mb-6">650$</h2>
                  <a href="/checkout?plan=VIP" class="bg-sky-600 block py-4 rounded-full font-black text-sm uppercase">Join VIP</a>
              </div>
          </div>
          <div class="card-bg rounded-2xl overflow-hidden shadow-2xl">
            <table class="w-full border-collapse"><tbody id="tips-table-body"></tbody></table>
          </div>
          <div id="pagination" class="flex justify-center items-center gap-2 mt-12 mb-24"></div>
        </div>
        <script>
          // Tips fetching script ...
          fetch('/api/tips').then(res => res.json()).then(data => { /* Render logic */ });
        </script>
      </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. STRIPE-STYLE CHECKOUT PAGE
  if (url.pathname === "/checkout" && req.method === "GET") {
    const plan = url.searchParams.get("plan") || "Standard";
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>${UI_HEAD}</head>
      <body class="stripe-bg min-h-screen flex items-center justify-center p-4">
        <div class="stripe-card max-w-[480px] w-full p-8">
          <div class="flex items-center text-gray-400 text-xs font-bold mb-8">
             <span class="mr-2 italic">Billing</span> <span class="mx-2">></span> <span>Payment method</span>
          </div>
          
          <h1 class="text-3xl font-bold text-[#32325d] mb-8">Add payment method</h1>

          <div class="flex mb-8">
             <div class="stripe-tab active flex flex-col items-center">
                <span class="text-blue-600 mb-1">💳</span>
                <span class="text-xs font-bold">Card</span>
             </div>
             <div class="stripe-tab flex flex-col items-center opacity-50">
                <span class="mb-1">🏦</span>
                <span class="text-xs font-bold">Bank</span>
             </div>
             <div class="stripe-tab flex flex-col items-center opacity-50">
                <span class="mb-1">💵</span>
                <span class="text-xs font-bold">Cash App Pay</span>
             </div>
          </div>

          <form id="payForm">
            <div class="mb-6">
              <label class="stripe-label">Card number</label>
              <div class="relative">
                <input type="text" id="cardNum" class="stripe-input" placeholder="1234 1234 1234 1234" maxlength="19" required>
                <span class="absolute right-3 top-3 text-blue-800 font-bold text-xs border border-blue-800 px-1 rounded">VISA</span>
              </div>
            </div>

            <div class="flex gap-4 mb-6">
              <div class="flex-1">
                <label class="stripe-label">Expiry date</label>
                <input type="text" id="expiry" class="stripe-input" placeholder="MM / YY" maxlength="5" required>
              </div>
              <div class="flex-1">
                <label class="stripe-label">Security code</label>
                <input type="text" class="stripe-input" placeholder="CVC" maxlength="3" required>
              </div>
            </div>

            <div class="mb-6">
              <label class="stripe-label">Country</label>
              <select class="stripe-input">
                <option>Seychelles</option>
                <option>United States</option>
                <option>Myanmar</option>
              </select>
            </div>

            <div class="flex items-center mb-8">
              <input type="checkbox" id="default" checked class="w-4 h-4 mr-3">
              <label for="default" class="text-sm text-gray-600 font-medium">Use as default payment method</label>
            </div>

            <p class="text-[11px] text-gray-500 mb-8 leading-relaxed">
              By providing your card information, you allow Deno Land Inc to charge your card for future payments in accordance with their terms.
            </p>

            <button type="submit" id="payBtn" class="stripe-btn-main mb-4">Add</button>
            <button type="button" onclick="history.back()" class="w-full py-2 text-gray-500 font-bold text-sm">Go back</button>
          </form>
          
          <div id="status" class="mt-4 text-center font-bold hidden"></div>
        </div>

        <script>
          // Auto-slash logic for Expiry Date
          const expiryInput = document.getElementById('expiry');
          expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\\D/g, '');
            if (value.length > 2) {
              value = value.substring(0, 2) + ' / ' + value.substring(2, 4);
            }
            e.target.value = value;
          });

          // Card Number formatting (adds spaces)
          document.getElementById('cardNum').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim();
          });

          document.getElementById('payForm').onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('payBtn');
            const status = document.getElementById('status');
            const cardNum = document.getElementById('cardNum').value.replace(/\\s/g, '');
            
            btn.innerText = "Processing..."; btn.disabled = true;

            setTimeout(() => {
              if (cardNum === "${VALID_CARD}") {
                status.innerText = "✅ Success! Card added."; status.className = "mt-4 text-green-600";
                status.classList.remove('hidden'); setTimeout(() => location.href = "/", 1500);
              } else {
                status.innerText = "❌ Your card was declined."; status.className = "mt-4 text-red-600";
                status.classList.remove('hidden'); btn.innerText = "Add"; btn.disabled = false;
              }
            }, 2000);
          };
        </script>
      </body>
      </html>
    `, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API Handlers (Remain unchanged) ---
  if (url.pathname === "/api/tips" && req.method === "GET") {
     const iter = kv.list({ prefix: ["tips"] }); const tips = []; for await (const res of iter) tips.push(res.value);
     tips.sort((a, b) => Number(b.id) - Number(a.id));
     const page = parseInt(url.searchParams.get("page") || "1"); const limit = 15;
     const startIndex = (page - 1) * limit;
     return new Response(JSON.stringify({ data: tips.slice(startIndex, startIndex + limit), totalPages: Math.ceil(tips.length / limit) }), { headers: { "Content-Type": "application/json" } });
  }

  if (url.pathname === "/api/tips" && req.method === "POST") {
    const body = await req.json(); if (body.password !== storedPass) return new Response("Unauthorized", { status: 401 });
    const id = body.id || Date.now().toString(); await kv.set(["tips", id], { ...body, id });
    return new Response("OK");
  }

  // Delete, Config handlers ...
  return new Response("Not Found", { status: 404 });
});
