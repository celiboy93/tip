
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const kv = await Deno.openKv();

// ညီကို အောင်မြင်စေချင်တဲ့ ကတ်နံပတ်ကို ဒီမှာ ပြင်ပါ (Space မပါဘဲ ရိုက်ရပါမယ်)
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
    body { background-color: #0c0c0c; color: #fff; font-family: 'Segoe UI', sans-serif; font-size: 14px; }
    .gold-gradient { background: linear-gradient(180deg, #f3ca52 0%, #a87f00 100%); }
    .card-bg { background-color: #111; border: 1px solid #222; }
    .stripe-input { background: #fff; color: #000; padding: 12px; border-radius: 4px; width: 100%; border: 1px solid #ddd; margin-bottom: 15px; }
  </style>
`;

serve(async (req) => {
  const url = new URL(req.url);
  const storedPass = await getStoredPassword();

  // 1. HOME PAGE
  if (url.pathname === "/" && req.method === "GET") {
    // (အရှေ့က HTML အတိုင်းဖြစ်ပြီး Button Link ပြောင်းထားသည်)
    return new Response(`<html><head>${UI_HEAD}</head><body class="p-6">
      <div class="max-w-[1050px] mx-auto text-center">
        <h1 class="text-6xl font-black italic text-yellow-500 py-10 uppercase">Winner Soccer</h1>
        
        <div class="grid grid-cols-2 gap-10 mb-20 max-w-4xl mx-auto">
          <div class="card-bg rounded-2xl p-10 border-b-4 border-yellow-600">
            <h2 class="text-4xl font-black mb-6">55$</h2>
            <a href="/checkout?plan=Standard" class="bg-sky-600 block py-4 rounded-full font-black text-sm uppercase tracking-widest">Get Started</a>
          </div>
          <div class="card-bg rounded-2xl p-10 border-b-4 border-sky-600">
            <h2 class="text-4xl font-black mb-6">650$</h2>
            <a href="/checkout?plan=VIP" class="bg-sky-600 block py-4 rounded-full font-black text-sm uppercase tracking-widest">Join VIP</a>
          </div>
        </div>
        
        <div id="tips-list"></div>
        <script>
           // ... (Tips Loading JS)
        </script>
      </div>
    </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // 2. FAKE STRIPE CHECKOUT PAGE
  if (url.pathname === "/checkout" && req.method === "GET") {
    const plan = url.searchParams.get("plan") || "Standard";
    const price = plan === "VIP" ? "650.00" : "55.00";

    return new Response(`<html><head>${UI_HEAD}</head><body class="bg-gray-100 text-black flex items-center justify-center min-h-screen p-4">
      <div class="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
        <div class="flex items-center mb-6 text-gray-400 font-bold uppercase text-xs">
          <span class="text-blue-600 mr-2">●</span> Winner Soccer Payment
        </div>
        <h2 class="text-3xl font-bold mb-2">Pay $${price}</h2>
        <p class="text-gray-500 mb-8">${plan} Plan Access</p>
        
        <form id="payForm">
          <label class="block text-sm font-bold mb-2">Email address</label>
          <input type="email" class="stripe-input" placeholder="email@example.com" required>
          
          <label class="block text-sm font-bold mb-2">Card information</label>
          <input type="text" id="cardNum" class="stripe-input" placeholder="1234 5678 1234 5678" required>
          
          <div class="grid grid-cols-2 gap-4">
            <input type="text" class="stripe-input" placeholder="MM / YY" required>
            <input type="text" class="stripe-input" placeholder="CVC" required>
          </div>
          
          <button type="submit" id="payBtn" class="bg-blue-600 text-white w-full py-3 rounded font-bold text-lg mt-4">Pay Now</button>
        </form>
        
        <div id="status" class="mt-6 text-center font-bold hidden"></div>
      </div>

      <script>
        document.getElementById('payForm').onsubmit = async (e) => {
          e.preventDefault();
          const btn = document.getElementById('payBtn');
          const status = document.getElementById('status');
          const cardNum = document.getElementById('cardNum').value.replace(/\\s/g, '');
          
          btn.innerText = "Processing...";
          btn.disabled = true;

          setTimeout(async () => {
            if (cardNum === "${VALID_CARD}") {
              status.innerText = "✅ Payment Successful! Redirecting...";
              status.className = "mt-6 text-center font-bold text-green-600";
              status.classList.remove('hidden');
              // ၂ စက္ကန့်နေရင် Home ကို ပြန်ပို့မယ်
              setTimeout(() => location.href = "/", 2000);
            } else {
              status.innerText = "❌ Your card was declined. Please try again.";
              status.className = "mt-6 text-center font-bold text-red-600";
              status.classList.remove('hidden');
              btn.innerText = "Pay Now";
              btn.disabled = false;
            }
          }, 2000);
        };
      </script>
    </body></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  }

  // --- API Handlers (Tips, Config, etc.) ---
  // (အရင် code အတိုင်း ဆက်ထားနိုင်ပါတယ်)
});
