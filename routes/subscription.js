// routes/subscriptions.js
'use strict';

const express = require('express');
const router = express.Router();
const db = require('../models');

// GET /subscriptions
router.get('/', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const where = { userId: req.user.id };

    const rows = await db.Subscription.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.Subscription_NowpaymentPlan_Map,
          as: 'nowpay_maps',            // matches Subscription.hasMany alias
          required: false,
          include: [
            {
              model: db.NowpaymentPlan,  // no alias here (you didn't define one)
              required: false,
              attributes: [
                'id',
                'name',
                'interval',
                'interval_count',
                'price_amount',
                'price_currency',
                'provider_plan_id',
                'active',
              ],
            },
          ],
        },
      ],
    });

    const data = rows.map((s) => ({
      id: s.id,
      userId: s.userId,
      product_id: s.product_id,
      interval: s.interval,
      price_amount: s.price_amount,
      price_currency: s.price_currency,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      nowpayments_plans: (s.nowpay_maps || []).map((m) => ({
        mapping_id: m.id,
        nowpaymentPlanId: m.nowpaymentPlanId,
        plan: m.NowpaymentPlan
          ? {
              id: m.NowpaymentPlan.id,
              name: m.NowpaymentPlan.name,
              interval: m.NowpaymentPlan.interval,
              interval_count: m.NowpaymentPlan.interval_count,
              price_amount: m.NowpaymentPlan.price_amount,
              price_currency: m.NowpaymentPlan.price_currency,
              provider_plan_id: m.NowpaymentPlan.provider_plan_id,
              active: m.NowpaymentPlan.active,
            }
          : null,
      })),
    }));

    res.json({ items: data, count: data.length });
  } catch (err) {
    console.error('GET /subscriptions error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;