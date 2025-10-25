const { UserWhopMap, Whop, WhopPlan } = require('../models');
const axios = require('axios');

const createWhopPlan = async (amount, api_key, product_id) => {
  try {
  const postData = JSON.stringify({
    plan_type: 'one_time',
    base_currency: 'usd',
    initial_price: amount,
    product_id: product_id,
    unlimited_stock: true
  });

  const options = {
    hostname: 'api.whop.com',
    path: '/v2/plans',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const response = await axios.post(
    'https://api.whop.com/api/v2/plans',
    postData,
    options
  );

  return response.data;
  } catch (error) {
    console.error('Whop API error:', error.response?.data || error.message);
    
    return {
      error: true,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message,
      raw: error.response?.data || null
    };
  }
};

// {
// 	"id": "ch_fZ4TJGPICtPNrWS",
// 	"redirect_url": null,
// 	"affiliate_code": null,
// 	"metadata": {},
// 	"plan_id": "plan_SiYBztFqluMZa",
// 	"purchase_url": "https://whop.com/checkout/plan_SiYBztFqluMZa/?session=ch_fZ4TJGPICtPNrWS",
// 	"company_id": "biz_1bYgjqiHdnMQLW"
// }
const createWhopCheckoutSession = async (plan_id, api_key) => {
    try {
        const response = await axios.post(
          'https://api.whop.com/api/v2/checkout_sessions',
          {
            plan_id: plan_id,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${api_key}`
            },
          }
        );
        return response.data;
      } catch (error) {
        console.error('Whop API error:', error.response?.data || error.message);
        
        return {
          error: true,
          status: error.response?.status || 500,
          message: error.response?.data?.message || error.message,
          raw: error.response?.data || null
        };
      }
};

const handler = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;

  try {
    // Get userWhopMap
    const userWhopMap = await UserWhopMap.findOne({ where: { userId } });
    if (!userWhopMap) {
      return res.status(400).json({ error: 'Whop not configured for user' });
    }

    // Get whop account
    const whop = await Whop.findByPk(userWhopMap.whopId);
    if (!whop) {
      return res.status(400).json({ error: 'Whop account not found' });
    }

    // Try to find existing Whop plan
    let whopPlan = await WhopPlan.findOne({
      where: { whopId: whop.id, price: amount }
    });

    if (!whopPlan) {
      // Create a new plan via API
      const plan = await createWhopPlan(amount, whop.api_key, whop.product_id);

      console.log(plan);
      if (plan.error) {
        return res.status(plan.status).json({ error: plan.message });
      }

      // Optionally persist it to DB
      whopPlan = await WhopPlan.create({
        id: plan.id, // assuming the API returns `id`
        whopId: whop.id,
        name: `${amount}$ Plan`,
        price: amount,
        currency: "USD"
      });
    } 

    const checkoutSession = await createWhopCheckoutSession(whopPlan.id, whop.api_key);

    if (checkoutSession.error) {
      return res.status(checkoutSession.status).json({ error: checkoutSession.message });
    }
    return res.json(checkoutSession);

  } catch (error) {
    console.error('Whop handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = handler;
