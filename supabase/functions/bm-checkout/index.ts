// Starts a Stripe Checkout for the one-time "full game" unlock of the signed-in player.
// Secrets (Supabase > Edge Functions > Secrets): STRIPE_SECRET_KEY, STRIPE_PRICE_ID, SITE_URL (https://hooperstroopers.pages.dev).
// SUPABASE_URL and SUPABASE_SECRET_KEYS are provided by Supabase.
import { createClient } from "jsr:@supabase/supabase-js@2";

// New-style project keys come as JSON dictionaries; fall back to the legacy service role key.
const keyOf = (name: string, legacy: string) => {
  try { const o = JSON.parse(Deno.env.get(name) || "{}"); const v = o.default || Object.values(o)[0]; if (v) return String(v); } catch (_) { /* not JSON */ }
  return Deno.env.get(legacy) || "";
};
const SECRET = keyOf("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

const SITE = (Deno.env.get("SITE_URL") || "https://hooperstroopers.pages.dev").replace(/\/$/, "");
const ALLOWED = new Set([SITE, "http://localhost:8796"]);
const cors = (origin: string) => ({
  "Access-Control-Allow-Origin": ALLOWED.has(origin) ? origin : SITE,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const json = (body: unknown, status: number, origin: string) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "method" }, 405, origin);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, SECRET, { auth: { persistSession: false } });
  const { data: { user } } = await admin.auth.getUser(jwt);
  if (!user) return json({ error: "Sign in first." }, 401, origin);

  const { data: owned } = await admin.from("purchases").select("user_id").eq("user_id", user.id).maybeSingle();
  if (owned) return json({ paid: true }, 200, origin);

  const back = ALLOWED.has(origin) ? origin : SITE;
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": Deno.env.get("STRIPE_PRICE_ID")!,
    "line_items[0][quantity]": "1",
    client_reference_id: user.id,
    "metadata[user_id]": user.id,
    "payment_intent_data[metadata][user_id]": user.id,
    success_url: `${back}/play/?paid=1`,
    cancel_url: `${back}/play/?paid=0`,
  });
  if (user.email) form.set("customer_email", user.email);
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("STRIPE_SECRET_KEY")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const s = await r.json();
  if (!r.ok || !s.url) { console.error("stripe", r.status, s?.error?.message); return json({ error: "The payment page could not be opened." }, 502, origin); }
  return json({ url: s.url }, 200, origin);
});
