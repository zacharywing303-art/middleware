const { Router } = require("express");
const { WhopWh, Outbox } = require("../../models");
const router = Router();
const { whop_status, whop_status_transit_to } = require("../../lib/whop_status");
const { Payment } = require("../../models");
const { makeWebhookValidator } = require("../../lib/whop-signature");
const { sequelize } = require("../../models");

/**
 * @openapi
 * /webhooks/whop:
 *   post:
 *     summary: Handle Whop webhook event
 *     description: Receives event info from Whop
 *     tags: [Webhooks]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WebhookWhopPaymentEventPayload'
 *     responses:
 *       200:
 *         description: Successfully processed event
 */
router.post("/", async (req, res) => {
  try {
    console.log(req.headers);
    const validator = await makeWebhookValidator({
        webhookSecret: process.env.WHOP_WEBHOOK_SECRET,
        signatureHeaderName: "x-whop-signature",
        maxSkewSeconds: 300,
    });

    const result = validator({
        rawBody: JSON.stringify(req.body),
        getHeader: (name) => req.headers[name.toLowerCase()],
    });

    // if (!result.valid) {
    //     console.error("Whop webhook validation failed", result);
    //     return res.sendStatus(401);
    // }

    const event = normalizeWhopPayment(req.body.data);

    await sequelize.transaction(async (t) => {
      // 2) Upsert one row per order_id (you set unique(order_id))
      //    This lets you keep the latest status/payload for that order.
      const whopWh = await WhopWh.upsert(
        {
          whop_payment_id: event.whop_payment_id,
          action: event.action,
          raw: req.body
        },
        { transaction: t }
      );

      // 3) Load & lock payment row (serialize updates)
      const payment = await Payment.findOne({
        where: { provider_payment_id: event.whop_payment_id /* , provider: 'changelly' */ },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!payment) {
        console.log('Payment not found for whop order:', event.whop_payment_id);
        return res.sendStatus(200);
      }

      // 4) FSM-only: compute legal next state
      const next = whop_status_transit_to(payment.status, event.status);

      if (next === payment.status) {
        console.log('Whop: no state change for order:', event.whop_payment_id);
        return res.sendStatus(200);
      }

      // 5) Apply state change and enqueue side-effects in the same tx
      await payment.update({ status: next }, { transaction: t });

      await Outbox.create(
        {
          status: 'pending',
          // optional: reference the whop webhook via whop_payment_id or add a foreign key if you store id.
          whopWhId: whopWh.id,
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

function normalizeWhopPayment(raw, userIdLocal = null) {
    const addr = raw?.billing_address ?? {};
    const toLower3 = (s) =>
      (s ?? "").toString().trim().toLowerCase().slice(0, 3);
  
    return {
      // Whop IDs
      action: raw?.action ?? null,
      whop_payment_id: raw?.id, // "pay_..."
      membership_id: raw?.membership_id ?? null,
      product_id: raw?.product_id ?? null,
      plan_id: raw?.plan_id ?? null,
      company_id: raw?.company_id ?? null,
      line_item_id: raw?.line_item_id ?? null,
  
      // Timestamps (UNIX seconds; keep as-is for BIGINT cols)
      created_at_unix: raw?.created_at ?? null,
      paid_at_unix: raw?.paid_at ?? null,
      refunded_at_unix: raw?.refunded_at ?? null,
      last_payment_attempt_unix: raw?.last_payment_attempt ?? null,
      next_payment_attempt_unix: raw?.next_payment_attempt ?? null,
  
      // Amounts
      status: raw?.status ?? "pending",
      subtotal: raw?.subtotal ?? 0,
      final_amount: raw?.final_amount ?? 0,
      refunded_amount: raw?.refunded_amount ?? 0,
      currency: toLower3(raw?.currency),
  
      payments_failed: raw?.payments_failed ?? 0,
  
      // Payment method
      payment_method_type: raw?.payment_method_type ?? null,
      card_brand: raw?.card_brand ?? null,
      card_last_4: raw?.card_last_4 ?? null,
      funding_method: raw?.funding_method ?? null,
      wallet_type: raw?.wallet_type ?? null,
      issuer_identification_number: raw?.issuer_identification_number ?? null,
  
      // Billing (flattened)
      billing_reason: raw?.billing_reason ?? null,
      billing_name: addr?.name ?? null,
      billing_line1: addr?.line1 ?? null,
      billing_line2: addr?.line2 ?? null,
      billing_city: addr?.city ?? null,
      billing_state: addr?.state ?? null,
      billing_postal_code: addr?.postal_code ?? null,
      billing_country: addr?.country ?? null,
  
      // User info from Whop
      user_email: raw?.user_email ?? null,
      user_username: raw?.user_username ?? null,
      whop_user_id: raw?.user_id ?? null,
  
      // Extra
      affiliate: raw?.affiliate ?? null,
      membership_metadata: raw?.membership_metadata ?? null,
      acquisition_data: raw?.acquisition_data ?? null,
      billing_usage_ids: Array.isArray(raw?.billing_usage_ids)
        ? raw.billing_usage_ids
        : [],
  
      // Local correlation
      user_id_local: userIdLocal,
    };
  }

module.exports = router;
