// routes/sessions.js
'use strict';

const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const { verifySecret } = require('../lib/crypto-utils');

const db = require('../models'); // expects Session + User (partner) in your Sequelize models

// Public base of your hosted checkout
const PUBLIC_APP_BASE_URL = process.env.PUBLIC_APP_BASE_URL || 'https://your.app';

// Session TTL (ms)
// 24h = 24 * 60 * 60 * 1000 = 86400000 ms
const SESSION_TTL_MS = parseInt(process.env.SESSION_TTL_MS || '86400000', 10); // 24 hours

/** ----------------------------------------------------------------
 * Helpers: canonical signing string & HMAC
 * ----------------------------------------------------------------*/
function canonicalString(params) {
  // Sign a stable, explicit set of fields in a defined order.
  // Keep this contract consistent.
  // We include: partner_id | sid | plan_id | expires
  const { partner_id, sid, plan_id, expires } = params;
  return `partner_id=${partner_id}|sid=${sid}|plan_id=${plan_id}|expires=${expires}`;
}

function hmacHex(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function timingSafeEq(a, b) {
  const A = Buffer.from(a || '', 'utf8');
  const B = Buffer.from(b || '', 'utf8');
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

/** ----------------------------------------------------------------
 * (Example) Partner auth: verify partner key to create a session.
 * Adjust to your real auth (e.g., db.ApiKey).
 * Expect headers:
 *   x-key-id:    <partner_id>     (public id)
 *   x-api-key:   <partner_secret> (shared secret)
 * ----------------------------------------------------------------*/
async function verifyPartnerAuth(req) {
  const keyId = req.header('x-key-id');     // required
  const given     = req.header('x-api-key');    // required

  if (!keyId || !given) {
    return { ok: false, reason: 'missing partner headers' };
  }

  // Example: load partner from users table (you may use ApiKey table instead)
  const apiKey = await db.ApiKey.findOne({
    where: { key_id: keyId, active: true },
  });

  if (!apiKey || !apiKey.secret_hash) {
    return { ok: false, reason: 'unknown partner' };
  }


  const isVerified = await verifySecret(apiKey.secret_hash, given);
  if (!isVerified) {
    return { ok: false, reason: 'bad key' };
  }

  return { ok: true, apiKey: apiKey };
}

/**
 * @openapi
 * 
 * /sessions/checkout:
 *   post:
 *     summary: Create checkout session
 *     tags: [Sessions]
 *     security: []
 *     parameters:
 *       - name: x-key-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               success_url:
 *                 type: string
 *               cancel_url:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Checkout session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 partner_id:
 *                   type: string
 *                 checkout_url:
 *                   type: string
 *                 expires_at:
 *                   type: string
 *                 sid:
 *                   type: string
 *       '500':
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/checkout', async (req, res) => {
  try {
    // 1) Verify partner
    const auth = await verifyPartnerAuth(req);
    if (!auth.ok) return res.status(403).json({ error: auth.reason });

    const apiKey = auth.apiKey;

    // 2) Read desired session metadata from partner body
    const {
    //   plan_id       = null,
    //   amount        = null,
    //   currency      = null,
    //   redirect_url  = null,
      meta          = null,
    } = req.body || {};

    // if (!plan_id || !amount || !currency) {
    //   return res.status(400).json({ error: 'missing plan_id/amount/currency' });
    // }

    // 3) Create DB session (authoritative record)
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const nonce     = crypto.randomUUID();

    const session = await db.Session.create({
      userId     : apiKey.userId, // partner who created it (optional)
      expires_at : expiresAt,
      used       : false,
      used_at    : null,
      nonce,
      token_hash : null, // not used in this design; you can store a revocation hash if you like
      ip_created : req.ip || null,
      ua_created : req.headers['user-agent'] || null,
      meta: {
        // plan_id,
        // amount,
        // currency,
        // redirect_url: redirect_url || null,
        ...(meta || {}),
      },
      status: 'active',
    });

    const checkoutSession = await db.CheckoutSession.create({
      id: session.id,
      success_url: req.body.success_url,
      cancel_url: req.body.cancel_url,
      amount: req.body.amount,
      currency: req.body.currency,
    });

    // 4) Build signed URL params (NO JWT). Only include what you will verify later.
    const params = {
      partner_id: apiKey.key_id,
      sid       : session.id,
      expires   : Math.floor(expiresAt.getTime() / 1000), // UNIX seconds
    };

    const toSign   = canonicalString(params);
    const signature = hmacHex(apiKey.secret_hash, toSign);

    // 5) Construct public checkout URL with params + signature
    const q = new URLSearchParams({
      partner_id: apiKey.key_id,
      sid      : params.sid,
      expires  : String(params.expires),
      signature,
    });

    const checkoutUrl = `${PUBLIC_APP_BASE_URL}/checkout?${q.toString()}`;

    return res.json({
      partner_id: apiKey.key_id,
      checkout_url: checkoutUrl,
      expires_at  : expiresAt.toISOString(),
      sid         : session.id,
    });
  } catch (err) {
    console.error('POST /checkout error:', err);
    return res.status(500).json({ error: 'internal' });
  }
});

/**
 * @openapi
 * 
 * /sessions/subscription:
 *   post:
 *     summary: Create subscription session
 *     tags: [Sessions]
 *     security: []
 *     parameters:
 *       - name: x-key-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Subscription session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 partner_id:
 *                   type: string
 *                 checkout_url:
 *                   type: string
 *                 expires_at:
 *                   type: string
 *                 sid:
 *                   type: string
 *       '500':
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/subscription', async (req, res) => {
  try {
    // 1) Verify partner
    const auth = await verifyPartnerAuth(req);
    if (!auth.ok) return res.status(403).json({ error: auth.reason });

    const apiKey = auth.apiKey;

    // 2) Read desired session metadata from partner body
    const {
    //   plan_id       = null,
    //   amount        = null,
    //   currency      = null,
    //   redirect_url  = null,
      meta          = null,
    } = req.body || {};

    // if (!plan_id || !amount || !currency) {
    //   return res.status(400).json({ error: 'missing plan_id/amount/currency' });
    // }

    // 3) Create DB session (authoritative record)
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const nonce     = crypto.randomUUID();

    const session = await db.Session.create({
      userId     : apiKey.userId, // partner who created it (optional)
      expires_at : expiresAt,
      used       : false,
      used_at    : null,
      nonce,
      token_hash : null, // not used in this design; you can store a revocation hash if you like
      ip_created : req.ip || null,
      ua_created : req.headers['user-agent'] || null,
      meta: {
        // plan_id,
        // amount,
        // currency,
        // redirect_url: redirect_url || null,
        ...(meta || {}),
      },
      status: 'active',
    });

    console.log(session.id);

    const subscriptionSession = await db.SubscriptionSession.create({
      id: session.id,
      success_url: req.body.success_url,
      cancel_url: req.body.cancel_url,
    });

    // 4) Build signed URL params (NO JWT). Only include what you will verify later.
    const params = {
      partner_id: apiKey.key_id,
      sid       : session.id,
      expires   : Math.floor(expiresAt.getTime() / 1000), // UNIX seconds
    };

    const toSign   = canonicalString(params);
    const signature = hmacHex(apiKey.secret_hash, toSign);

    // 5) Construct public checkout URL with params + signature
    const q = new URLSearchParams({
      partner_id: apiKey.key_id,
      sid      : params.sid,
      expires  : String(params.expires),
      signature,
    });

    const checkoutUrl = `${PUBLIC_APP_BASE_URL}?${q.toString()}`;

    return res.json({
      partner_id: apiKey.key_id,
      checkout_url: checkoutUrl,
      expires_at  : expiresAt.toISOString(),
      sid         : session.id,
    });
  } catch (err) {
    console.error('POST /subscription error:', err);
    return res.status(500).json({ error: 'internal' });
  }
});

router.get('/checkout', async (req, res) => {
  try {
    const checkoutSession = await db.CheckoutSession.findByPk(req.query.sid);
    if (!checkoutSession) return res.status(404).json({ ok: false, error: 'session_not_found' });
    return res.json({
      ok: true,
      sid: checkoutSession.id,
      amount  : checkoutSession.amount,
      currency: checkoutSession.currency,
    });
  } catch (err) {
    console.error('GET /checkout error:', err);
    return res.status(500).json({ ok: false, error: 'internal' });
  }
});
module.exports = router;