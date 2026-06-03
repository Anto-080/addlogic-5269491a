// Phone OTP via Twilio connector gateway.
//
// Actions:
//   POST { action: "start", phone: "+15558675310" }
//   POST { action: "verify", phone: "+15558675310", code: "123456" }
//
// On `verify` success:
//   - Updates auth.users.phone via service role
//   - Upserts profiles.phone
//   - Deletes the challenge row

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PHONE_RE = /^\+[1-9]\d{6,14}$/; // E.164
const CODE_RE = /^\d{6}$/;
const MAX_ATTEMPTS = 5;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendTwilioSms(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const twilioKey = Deno.env.get("TWILIO_API_KEY");
  const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER") ?? Deno.env.get("TWILIO_PHONE_NUMBER");
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");

  if (!lovableKey) return { ok: false, error: "LOVABLE_API_KEY missing" };
  if (!twilioKey) return { ok: false, error: "TWILIO_API_KEY missing (Twilio connector not linked)" };
  if (!fromNumber && !messagingServiceSid) {
    return { ok: false, error: "Set TWILIO_FROM_NUMBER (or TWILIO_MESSAGING_SERVICE_SID) secret" };
  }

  const params = new URLSearchParams({ To: to, Body: body });
  if (messagingServiceSid) params.set("MessagingServiceSid", messagingServiceSid);
  else if (fromNumber) params.set("From", fromNumber);

  const r = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    console.error("twilio send error", r.status, text);
    return { ok: false, error: `Twilio ${r.status}: ${text.slice(0, 200)}` };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const token = auth.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  let body: { action?: string; phone?: string; code?: string } = {};
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  const phone = (body.phone ?? "").trim();
  if (!PHONE_RE.test(phone)) return json({ error: "Invalid phone (use E.164, e.g. +15558675310)" }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  if (body.action === "start") {
    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await sha256Hex(code);

    // Wipe any prior challenges for this user
    await admin.from("phone_otp_challenges").delete().eq("user_id", userId);

    const { error: insertErr } = await admin.from("phone_otp_challenges").insert({
      user_id: userId,
      phone,
      code_hash: codeHash,
    });
    if (insertErr) return json({ error: insertErr.message }, 500);

    const sent = await sendTwilioSms(phone, `Your AddLogic verification code is ${code}. Expires in 10 minutes.`);
    if (!sent.ok) {
      await admin.from("phone_otp_challenges").delete().eq("user_id", userId);
      return json({ error: sent.error ?? "SMS send failed" }, 502);
    }
    return json({ ok: true });
  }

  if (body.action === "verify") {
    const code = (body.code ?? "").trim();
    if (!CODE_RE.test(code)) return json({ error: "Invalid code format" }, 400);

    const { data: ch, error: chErr } = await admin
      .from("phone_otp_challenges")
      .select("*")
      .eq("user_id", userId)
      .eq("phone", phone)
      .maybeSingle();
    if (chErr) return json({ error: chErr.message }, 500);
    if (!ch) return json({ error: "No active challenge. Request a new code." }, 400);
    if (new Date(ch.expires_at as string).getTime() < Date.now()) {
      await admin.from("phone_otp_challenges").delete().eq("id", ch.id);
      return json({ error: "Code expired. Request a new one." }, 400);
    }
    if ((ch.attempts as number) >= MAX_ATTEMPTS) {
      await admin.from("phone_otp_challenges").delete().eq("id", ch.id);
      return json({ error: "Too many attempts. Request a new code." }, 429);
    }

    const codeHash = await sha256Hex(code);
    if (codeHash !== ch.code_hash) {
      await admin.from("phone_otp_challenges").update({ attempts: (ch.attempts as number) + 1 }).eq("id", ch.id);
      return json({ error: "Wrong code" }, 400);
    }

    // Success — attach phone to auth.users and profiles
    const { error: updateErr } = await admin.auth.admin.updateUserById(userId, { phone });
    if (updateErr) {
      // If phone already in use by another auth user, surface error
      return json({ error: updateErr.message }, 400);
    }
    await admin.from("profiles").update({ phone }).eq("user_id", userId);
    await admin.from("phone_otp_challenges").delete().eq("id", ch.id);
    return json({ ok: true, phone });
  }

  return json({ error: "unknown action" }, 400);
});
