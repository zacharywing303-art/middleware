const { NowpaymentPlan } = require('../models');

const nowpaymentPlan = [
    {
        name: 'Tier 1',
        description: 'Tier 1',
        interval: 'month',
        interval_count: 1,
        price_amount: 299,
        price_currency: 'USD',
        provider_code: 'nowpayments',
        provider_plan_id: '1867250118',
        active: true
    },
    {
        name: 'Tier 2',
        description: 'Tier 2',
        interval: 'month',
        interval_count: 1,
        price_amount: 599,
        price_currency: 'USD',
        provider_code: 'nowpayments',
        provider_plan_id: '179293089',
        active: true
    },
    {
        name: 'Tier 3',
        description: 'Tier 3',
        interval: 'month',
        interval_count: 1,
        price_amount: 1599,
        price_currency: 'USD',
        provider_code: 'nowpayments',
        provider_plan_id: '1161420163',
        active: true
    },
    {   
        name: 'Tier 1 - Yearly',
        description: 'Tier 1 - Yearly',
        interval: 'year',
        interval_count: 1,
        price_amount: 2490,
        price_currency: 'USD',
        provider_code: 'nowpayments',
        provider_plan_id: '137413114',
        active: true
    },
    {   
        name: 'Tier 2 - Yearly',
        description: 'Tier 2 - Yearly',
        interval: 'year',
        interval_count: 1,
        price_amount: 4990,
        price_currency: 'USD',
        provider_code: 'nowpayments',
        provider_plan_id: '980930450',
        active: true
    },
    {   
        name: 'Tier 3 - Yearly',
        description: 'Tier 3 - Yearly',
        interval: 'year',
        interval_count: 1,
        price_amount: 12990,
        price_currency: 'USD',
        provider_code: 'nowpayments',
        provider_plan_id: '145014206',
        active: true
    }
]

const seedNowpaymentPlan = async () => {
    await NowpaymentPlan.destroy({ where: {} });
    await NowpaymentPlan.bulkCreate(nowpaymentPlan);
}

module.exports = seedNowpaymentPlan;
