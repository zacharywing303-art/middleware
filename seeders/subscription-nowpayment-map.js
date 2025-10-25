// seeds/seedSubscriptionNowpaymentPlanMap.js
'use strict';

const {
  Subscription,
  NowpaymentPlan,
  Subscription_NowpaymentPlan_Map,
  sequelize,
} = require('../models');

function key(interval, amount, currency) {
  // normalize to strings to avoid decimal quirks
  return `${String(interval).toLowerCase()}|${String(amount)}|${String(currency).toUpperCase()}`;
}

function titleCaseTier(productId) {
  // 'tier_1' -> 'Tier 1'
  if (!productId) return null;
  const m = /tier[_\s-]?(\d+)/i.exec(productId);
  return m ? `Tier ${m[1]}` : null;
}

async function seedSubscriptionNowpaymentPlanMap() {
  // start a txn so we don’t leave half-done mappings if anything fails
  return sequelize.transaction(async (t) => {
    // 1) Clear existing mappings
    await Subscription_NowpaymentPlan_Map.destroy({ where: {}, transaction: t });

    // 2) Load subs & plans
    const [subs, plans] = await Promise.all([
      Subscription.findAll({ transaction: t }),
      NowpaymentPlan.findAll({ transaction: t }),
    ]);

    // 3) Index plans by primary key (interval+amount+currency)
    const byTriple = new Map();
    for (const p of plans) {
      byTriple.set(
        key(p.interval, p.price_amount, p.price_currency),
        p
      );
    }

    // Also index by (title-case tier name + interval) as a fallback
    const byTierInterval = new Map();
    for (const p of plans) {
      const nm = (p.name || '').trim();
      if (!nm) continue;
      byTierInterval.set(`${nm.toLowerCase()}|${String(p.interval).toLowerCase()}`, p);
    }

    const rows = [];
    for (const s of subs) {
      // try strict match: interval + price + currency
      let plan =
        byTriple.get(key(s.interval, s.price_amount, s.price_currency)) ||
        null;

      // fallback: match by tier title + interval
      if (!plan) {
        const tierName = titleCaseTier(s.product_id);
        if (tierName) {
          plan = byTierInterval.get(`${tierName.toLowerCase()}|${String(s.interval).toLowerCase()}`) || null;
        }
      }

      if (!plan) {
        console.warn(
          `[seed-sub-np-map] No plan match for subscription ${s.id} ` +
          `(product=${s.product_id}, interval=${s.interval}, amount=${s.price_amount} ${s.price_currency})`
        );
        continue;
      }

      rows.push({
        subscriptionId: s.id,
        nowpaymentPlanId: plan.id,
      });
    }

    if (!rows.length) {
      console.log('[seed-sub-np-map] No mappings to insert.');
      return;
    }

    await Subscription_NowpaymentPlan_Map.bulkCreate(rows, {
      transaction: t,
      ignoreDuplicates: true, // in case unique (subscriptionId, nowpaymentPlanId) exists
    });

    console.log(`[seed-sub-np-map] Inserted ${rows.length} mapping(s).`);
  });
}

module.exports = seedSubscriptionNowpaymentPlanMap;

// If you want to run directly: `node seeds/seedSubscriptionNowpaymentPlanMap.js`
if (require.main === module) {
  seedSubscriptionNowpaymentPlanMap()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}