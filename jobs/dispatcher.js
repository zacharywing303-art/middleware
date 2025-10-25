// jobs/dispatcher.js
'use strict';

const { Sequelize } = require('sequelize');
const db = require('./models');
const { sendMessage } = require('./svix');   // <— NEW

/** Tunables */
const BATCH_SIZE       = parseInt(process.env.DISPATCH_BATCH_SIZE || '50', 10);
const MAX_ATTEMPTS     = parseInt(process.env.DISPATCH_MAX_ATTEMPTS || '12', 10);
const BASE_BACKOFF_S   = parseInt(process.env.DISPATCH_BASE_BACKOFF_SEC || '60', 10);
const MAX_BACKOFF_S    = parseInt(process.env.DISPATCH_MAX_BACKOFF_SEC || '3600', 10);
const POLL_INTERVAL_MS = parseInt(process.env.DISPATCH_POLL_MS || '1000', 10);
const CONCURRENCY      = parseInt(process.env.DISPATCH_CONCURRENCY || '10', 10);

/** Exponential backoff with cap */
function nextBackoffMs(attempts) {
  const seconds = Math.min(MAX_BACKOFF_S, BASE_BACKOFF_S * Math.max(1, 2 ** (attempts - 1)));
  return seconds * 1000;
}

/** Normalize payloads going to Svix (you control this schema) */
function buildPayloadFromNowpayments(row, metadata) {
  return {
    provider: 'nowpayments',
    event: row.payment_status || row.status || 'unknown',
    data: row.raw,                    // original provider payload
    metadata: metadata
  };
}

function buildPayloadFromChangelly(row, metadata) {
  return {
    provider: 'changelly',
    event: row.status || 'unknown',
    data: row.raw,
    metadata: metadata,
  };
}

function buildPayloadFromWhop(row, metadata) {
  return {
    provider: 'whop',
    event: row.action || row.status || 'unknown',
    data: row.raw,
    metadata: metadata
  };
}

/** Claim batch (unchanged) */
async function claimBatch(transaction) {
  const [rows] = await db.sequelize.query(
    `
    WITH cte AS (
      SELECT id
      FROM outbox
      WHERE status = 'pending'
        AND next_attempt_at <= now()
      ORDER BY next_attempt_at
      FOR UPDATE SKIP LOCKED
      LIMIT :batch
    )
    UPDATE outbox o
    SET status = 'processing',
        "updatedAt" = now()
    FROM cte
    WHERE o.id = cte.id
    RETURNING o.*;
    `,
    {
      replacements: { batch: BATCH_SIZE },
      model: db.Outbox,
      mapToModel: true,
      type: Sequelize.QueryTypes.UPDATE,
      transaction,
    }
  );
  if (rows.length) console.log('[claimBatch] claimed:', rows.map(r => r.id));
  return rows;
}

/** Send via Svix (instead of direct HTTP to merchant) */
async function deliverViaSvix({ provider, sourceRow, account, outboxId, metadata }) {
  // Require an app id mapped for the merchant
  const appId = account.svix_app_id;
  console.log('[deliverViaSvix] svix_app_id:', appId + ' ' + account.svix_app_id);
  if (!appId) {
    return { ok: false, errorMsg: 'missing svix_app_id on account' };
  }

  // Build message
  const payload = provider === 'nowpayments'
    ? buildPayloadFromNowpayments(sourceRow, metadata)
    : provider === 'changelly'
    ? buildPayloadFromChangelly(sourceRow, metadata)
    : provider === 'whop'
    ? buildPayloadFromWhop(sourceRow, metadata)
    : { provider: 'unknown', data: sourceRow?.raw || {} };

  try {
    const res = await sendMessage({
      appId,
      eventType: 'payment.updated',
      payload,
      idemKey: String(outboxId), // Idempotency-Key for Svix
    });
    console.log(res.status);
    console.log(res.data);
    const ok = res.status >= 200 && res.status < 300;
    return { ok, errorMsg: ok ? null : `SVIX ${res.status} ${res.statusText}: ${JSON.stringify(res.data).slice(0,400)}` };
  } catch (e) {
    return { ok: false, errorMsg: e.message || 'svix send error' };
  }
}

/** Process one outbox */
async function processOne(claimedRow) {
  // Figure provider + source
  let provider = null;
  let sourceRow = null;

  if (claimedRow.nowpaymentWhId) {
    provider = 'nowpayments';
    sourceRow = await db.NowpaymentWh.findByPk(claimedRow.nowpaymentWhId);
  } else if (claimedRow.changellyWhId) {
    provider = 'changelly';
    sourceRow = await db.ChangellyWh.findByPk(claimedRow.changellyWhId);
  } else if (claimedRow.whopWhId) {
    provider = 'whop';
    sourceRow = await db.WhopWh.findByPk(claimedRow.whopWhId);
  }

  const account = claimedRow.userId ? await db.User.findByPk(claimedRow.userId) : null;
  const payment = claimedRow.paymentId ? await db.Payment.findByPk(claimedRow.paymentId) : null;

  console.log('[processOne]', {
    outbox: claimedRow.id,
    provider,
    hasSource: !!sourceRow,
    hasAccount: !!account
  });

  // Guard checks (we no longer need callback_url/client_secret here)
  const isActive = account && (account.is_active === true || account.enabled === true);
  if (!provider || !sourceRow || !account || !isActive) {
    const reason = !provider ? 'unknown provider'
      : !sourceRow ? 'missing source event'
      : !account ? 'missing account'
      : 'account disabled';

    await db.Outbox.update({
      status: 'failed',
      attempts: claimedRow.attempts + 1,
      next_attempt_at: new Date(Date.now() + nextBackoffMs(claimedRow.attempts + 1)),
      last_error: reason,
    }, { where: { id: claimedRow.id } });
    return;
  }
  
  const { ok, errorMsg } = await deliverViaSvix({
    provider,
    sourceRow,
    account,
    outboxId: claimedRow.id,
    metadata: payment?.metadata || null,
  });

  if (ok) {
    await db.Outbox.update({
      status: 'sent',
      last_error: null,
    }, { where: { id: claimedRow.id } });
  } else {
    const attempts = claimedRow.attempts + 1;
    const next = new Date(Date.now() + nextBackoffMs(attempts));
    await db.Outbox.update({
      status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
      attempts,
      next_attempt_at: next,
      last_error: errorMsg,
    }, { where: { id: claimedRow.id } });
  }
}

module.exports = { processOne, claimBatch };