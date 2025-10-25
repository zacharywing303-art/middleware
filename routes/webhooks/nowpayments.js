// routes/webhooks.js
const express = require('express');
const router = express.Router();
const { Payment } = require("../../models");
const { nowpayment_status_transit_to } = require("../../lib/nowpayment_status");
const { NowpaymentWh, Outbox } = require("../../models");
const crypto = require("crypto");
const { NOWPAYMENTS_IPN_SECRET_KEY } = process.env;
const { sequelize } = require("../../models");

verifyNowpayments = (req) => {
    const signature = req.headers["x-nowpayments-sig"];
    const body = req.body;
    const expectedSignature = crypto.createHmac("sha512", NOWPAYMENTS_IPN_SECRET_KEY).update(JSON.stringify(body)).digest("hex");

    return signature === expectedSignature;
}

function normalizeNowpayments(body) {
  // log for debugging
  console.log('NOWPayments webhook body:', body);

  // Which side of the amount you want to store? 
  // Here: fiat order amount (price_amount/price_currency)
  const amount = Number(body.price_amount || 0);
  const currency = body.price_currency || 'usd';

  // normalize to integer "minor units"
  const decimals = currency.toLowerCase() === 'usd' ? 2 : 6; // extend mapping if needed
  const amountMinor = Math.round(amount * Math.pow(10, decimals));

  return {
    payment_id: String(body.invoice_id),
    order_id: body.order_id || null,
    payment_status: body.payment_status,
    price_amount: body.price_amount || null,
    price_currency: body.price_currency ? body.price_currency.toUpperCase() : null,
    pay_amount: body.pay_amount || null,
    pay_currency: body.pay_currency ? body.pay_currency.toUpperCase() : null,
    actually_paid: body.actually_paid || null,
    pay_address: body.pay_address || null,
    created_at_provider: body.created_at || null,
    updated_at_provider: body.updated_at || null,

    // optional normalized values (good for quick queries)
    amount: amountMinor,
    currency: currency.toUpperCase(),

    // always keep raw JSON for audit/debug
    raw: body,
  };
}

/**
 * @openapi
 * /webhooks/nowpayments:
 *   post:
 *     summary: Handle NowPayments webhook event
 *     description: Receives event info from NowPayments
 *     tags: [Webhooks]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookNowPaymentsEventPayload'
 *     responses:
 *       200:
 *         description: Successfully processed event
 */
router.post('/', async (req, res) => {
  try {
    // 1) Verify signature first
    if (!verifyNowpayments(req)) return res.status(400).send('Invalid signature');

    const raw = req.body;
    const event = normalizeNowpayments(raw); // { payment_id, payment_status, ... }

    await sequelize.transaction(async (t) => {
      // 2) Persist one webhook row per identical delivery (saves IO if provider retries same body)
      const nowpaymentWh = await NowpaymentWh.create({
        payment_id: event.payment_id,
        payment_status: event.payment_status,
        raw: raw
      }, { transaction: t });

      // 3) Load & lock payment row (serialize updates)
      const payment = await Payment.findOne({
        where: { provider_payment_id: event.payment_id },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!payment) {
        console.log('Payment not found for webhook:', event);
        return res.sendStatus(200);
      }

      console.log('Payment found for webhook:', payment);

      // 4) FSM-only: compute legal next state
      const next = nowpayment_status_transit_to(payment.status, event.payment_status);

      if (next === payment.status) {
        console.log('No state change for webhook:', event);
        return res.sendStatus(200);
      }

      // 5) Apply state change and enqueue side-effects in the same tx
      await payment.update({ status: next }, { transaction: t });

      await Outbox.create({
        status: 'pending',
        nowpaymentWhId: nowpaymentWh.id,
        userId: payment.user_id
      }, { transaction: t });

      // 6) All good → ack
      res.sendStatus(200);
    });
  } catch (e) {
    console.error('NOWPayments webhook error', e);
    // Fail → let provider retry
    res.sendStatus(500);
  }
});

module.exports = router;