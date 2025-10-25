// middleware/authSignedCheckout.js
'use strict';

const crypto = require('crypto');
const db = require('../models'); // { User, Session, ... }

/** ---- helpers ---- */
function canonicalString({ partner_id, sid, plan_id, expires }) {
  return `partner_id=${partner_id}|sid=${sid}|plan_id=${plan_id}|expires=${expires}`;
}

function hmacHex(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function timingSafeEq(a, b) {
  const A = Buffer.from(a || '', 'utf8');
  const B = Buffer.from(b || '', 'utf8');
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

/**
 * Auth middleware for signed checkout URLs.
 * Expects query params: partner_id, sid, plan_id, expires, signature
 * Attaches: req.partner, req.sessionRow
 */
module.exports = async function authSignedCheckout(req, res, next) {
  try {
    const { partner_id, sid, expires, signature } = req.query || {};

    if (!partner_id || !sid || !expires || !signature) {
      return res.status(400).json({ error: 'missing_params' });
    }

    const apiKey = await db.ApiKey.findOne({
      where: { key_id: partner_id, active: true },
    });

    if (!apiKey) {
      return res.status(403).json({ error: 'unknown_partner' });
    }

    const toSign = canonicalString({ partner_id, sid, expires: String(expires) });
    const expected = hmacHex(apiKey.secret_hash, toSign);
    if (!timingSafeEq(signature, expected)) {
      return res.status(401).json({ error: 'bad_signature' });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > Number(expires)) {
      return res.status(410).json({ error: 'expired' });
    }

    const session = await db.Session.findByPk(sid);
    if (!session) return res.status(404).json({ error: 'session_not_found' });
    if (session.status !== 'active') return res.status(409).json({ error: 'session_inactive' });
    if (session.used) return res.status(409).json({ error: 'session_used' });

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      return res.status(410).json({ error: 'session_expired' });
    }

    if (session.meta?.plan_id && session.meta.plan_id !== plan_id) {
      return res.status(409).json({ error: 'plan_mismatch' });
    }

    const user = await db.User.findByPk(apiKey.userId);
    req.user = user;
    req.session = session;

    return next();
  } catch (err) {
    console.error('authSignedCheckout error:', err);
    return res.status(500).json({ error: 'internal' });
  }
};