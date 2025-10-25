// —— helpers ——

// whop-verify.ts  — no external imports

// const  { createHmac, timingSafeEqual } = re"crypto";
const { createHmac, timingSafeEqual } = require('crypto');

const DEFAULT_SIGNATURE_HEADER_NAME = "x-whop-signature";

// Minimal shape — adjust if you want stricter typing for `data`
class WhopWebhookRequestBody {
  api_version = "v5";
  action = "";           // e.g. "payment.failed" | "payment.succeeded" | ...
  data = {};
}

const payment_action = {
  PENDING:   "payment.pending",
  SUCCEEDED: "payment.succeeded",
  FAILED:    "payment.failed",
};

/**
 * Create a validator. Use with Express (by providing rawBody + header getter)
 * or any server framework where you can access raw bytes and header string.
 */
function makeWebhookValidator({
  webhookSecret,
  signatureHeaderName,
  maxSkewSeconds = 300, // ±5 minutes
}) {
  console.log({ webhookSecret, signatureHeaderName, maxSkewSeconds });
  const headerName = (signatureHeaderName ?? DEFAULT_SIGNATURE_HEADER_NAME).toLowerCase();
  const secretBuf = Buffer.from(webhookSecret, "utf8");

  return async function validateWebhook({
    rawBody,         // MUST be the exact bytes Whop sent
    getHeader,       // function to read headers case-insensitively
  }) {
    const header = getHeader(headerName);
    if (!header) throw new Error("Missing Whop signature header");

    // Expect "t=<unix>,v1=<hex>"
    const parts = parseSigHeader(header);
    if (!parts?.t || !parts?.v1) throw new Error("Invalid signature header format");

    // Freshness check
    const ts = Number(parts.t);
    if (!Number.isFinite(ts)) throw new Error("Invalid timestamp");
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - ts) > maxSkewSeconds) throw new Error("Stale timestamp");

    // Compute expected signature: HMAC_SHA256(secret, `${t}.${rawBody}`)
    const signedString = String(ts) + "." + rawBody;
    console.log({ signedString });
    const signedPayload = Buffer.from(signedString, "utf8");
    const expectedHex = createHmac("sha256", secretBuf).update(signedPayload).digest("hex");

    console.log({ ts, rawBody, parts });
    const sig = createHmac("sha256", secretBuf)
    .update(Buffer.from(`${ts}.${rawBody}`, "utf8"))
    .digest("hex");

    console.log({ sig, expectedHex, parts });
    // Constant-time compare
    const ok = timingSafeEqual(Buffer.from(expectedHex, "hex"), Buffer.from(parts.v1, "hex"));
    // if (!ok) throw new Error("Signature mismatch");

    // Parse JSON (from raw bytes to avoid re-stringify differences)
    // const parsed = JSON.parse(rawBody.toString("utf8"));
    // if (!isValidWebhook(parsed)) throw new Error("Invalid webhook payload");
    return { valid: ok };
  };
}

// —— helpers ——

function parseSigHeader(h) {
    // Accept forms like: "t=12345,v1=abcdef" (possibly with spaces)
    const out = {};
    for (const kv of h.split(",")) {
      const [k, v] = kv.split("=");
      if (!k || !v) continue;
      const key = k.trim();
      const val = v.trim();
      if (!key || !val) continue;
  
      // Support multiple v1 entries: "t=...,v1=abc,v1=def"
      if (key === "v1" && out.v1) {
        out.v1 += `,v1=${val}`;
      } else {
        out[key] = val;
      }
    }
    return out;
  }
  
  function isValidWebhook(x) {
    if (!x || typeof x !== "object") return false;
    const obj = x;
    if (obj.api_version !== "v5") return false;
    if (typeof obj.action !== "string") return false;
    if (typeof obj.data !== "object" || obj.data === null) return false;
    return true;
  }

  module.exports = {
    makeWebhookValidator
  };
    