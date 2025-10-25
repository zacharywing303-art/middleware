const express = require('express');
const router = express.Router();
const { ChangellyWh, Outbox } = require("../../models");
const { sequelize } = require("../../models");
const { Payment } = require("../../models");
const { changelly_status_transit_to } = require("../../lib/changelly_status");

function normalizeChangelly(evt) {
  const up = (s) => (typeof s === 'string' ? s.toUpperCase() : null);

  return {
    // identifiers
    order_id: evt.orderId,
    external_user_id: evt.externalUserId ?? null,
    external_order_id: evt.externalOrderId ?? null,
    provider_code: evt.providerCode ?? null,

    // status/type
    status: evt.status,          // e.g. 'pending' | 'expired' | 'completed'
    type: evt.type ?? null,      // 'buy' | 'sell'

    // amounts & currencies
    payin_amount: evt.payinAmount ?? null,     // DECIMAL column; keep as string/number
    payout_amount: evt.payoutAmount ?? null,   // DECIMAL column
    payin_currency: up(evt.payinCurrency) ?? null,
    payout_currency: up(evt.payoutCurrency) ?? null,

    // aliases present in some payloads
    currency_from: up(evt.currencyFrom) ?? null,
    currency_to: up(evt.currencyTo) ?? null,
    amount_from: evt.amountFrom ?? null,

    // geo / client info
    country: evt.country ?? null,          // 'US'
    state: evt.state ?? null,              // 'CA'
    ip: evt.ip ?? null,

    // wallet / refund
    wallet_address: evt.walletAddress ?? null,
    wallet_extra_id: evt.walletExtraId ?? null,
    refund_address: evt.refundAddress ?? null,

    // payment method & UA
    payment_method: evt.paymentMethod ?? null,
    user_agent: evt.userAgent ?? null,

    // links / metadata
    redirect_url: evt.redirectUrl ?? null,
    metadata: evt.metadata ?? null,

    // provider timestamps
    provider_created_at: evt.createdAt ? new Date(evt.createdAt) : null,
    provider_updated_at: evt.updatedAt ? new Date(evt.updatedAt) : null,

    // keep the whole thing for audit/debug
    raw: evt,
  };
}

/**
 * @openapi
 * /webhooks/payment:
 *   post:
 *     summary: Handle payment webhook event
 *     description: Receives event info from payment providers
 *     tags: [Webhooks]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookChangellyEventPayload'
 *     responses:
 *       200:
 *         description: Successfully processed event
 */
router.post('/', async (req, res) => {
  try {
    const raw = req.body;
    const event = normalizeChangelly(raw);

    await sequelize.transaction(async (t) => {
      // 2) Upsert one row per order_id (you set unique(order_id))
      //    This lets you keep the latest status/payload for that order.
      const changellyWh = await ChangellyWh.upsert(
        {
          order_id: event.order_id,
          status: event.status,
          raw: event.raw
        },
        { transaction: t }
      );

      // 3) Load & lock payment row (serialize updates)
      const payment = await Payment.findOne({
        where: { provider_payment_id: event.order_id /* , provider: 'changelly' */ },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!payment) {
        console.log('Payment not found for changelly order:', event.order_id);
        return res.sendStatus(200);
      }

      // 4) FSM-only: compute legal next state
      const next = changelly_status_transit_to(payment.status, event.status);

      if (next === payment.status) {
        console.log('Changelly: no state change for order:', event.order_id);
        return res.sendStatus(200);
      }

      // 5) Apply state change and enqueue side-effects in the same tx
      await payment.update({ status: next }, { transaction: t });

      await Outbox.create(
        {
          status: 'pending',
          // optional: reference the changelly webhook via order_id or add a foreign key if you store id.
          changellyWhId: changellyWh.id,
          userId: payment.user_id,
          attempts: 0
        },
        { transaction: t }
      );

      // 6) All good → ack
      res.sendStatus(200);
    });
  } catch (e) {
    console.error('Changelly webhook error', e);
    // Fail → let provider retry
    res.sendStatus(500);
  }
});

module.exports = router;