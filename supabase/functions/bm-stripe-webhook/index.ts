// Stripe webhook: when a Checkout for the full game is paid, records the purchase for that player.
// Deploy with "Verify JWT" OFF (Stripe does not send a Supabase token); the Stripe signature is checked instead.
// Secrets: STRIPE_WEBHOOK_SECRET (whsec_…). SUPABASE_URL and SUPABASE_SECRET_KEYS are provided by Supabase.
import { createClient } from "jsr:@supabase/supabase-js@2";

// New-style project keys come as JSON dictionaries; fall back to the legacy service role key.
const keyOf = (name: string, legacy: string) => {
  try { const o = JSON.parse(Deno.env.get(name) || "{}"); const v = o.default || Object.values(o)[0]; if (v) return String(v); } catch (_) { /* not JSON */ }
  return Deno.env.get(legacy) || "";
};
const SECRET = keyOf("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
function same(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }

async function verified(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]).filter((p) => p.length === 2 && p[0] === "t"));
  const t = parts.t; const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const want = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)));
  return sigs.some((s) => same(s, want));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const payload = await req.text();
  if (!(await verified(payload, req.headers.get("Stripe-Signature") || "", Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""))) {
    return new Response("bad signature", { status: 400 });
  }
  const ev = JSON.parse(payload);
  if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
    const s = ev.data.object;
    const uid = s.client_reference_id || s.metadata?.user_id;
    if (uid && s.payment_status === "paid") {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, SECRET, { auth: { persistSession: false } });
      const { error } = await admin.from("purchases").upsert(
        { user_id: uid, product: "full_game", stripe_session: s.id, amount: s.amount_total, currency: s.currency, paid_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
      if (error) { console.error("purchase", error.message); return new Response("db", { status: 500 }); }   // Stripe retries
    }
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
