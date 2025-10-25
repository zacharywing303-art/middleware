const axios = require('axios');
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';
const { NOWPAYMENTS_API_KEY } = process.env;
const { Payment } = require('../models');
const { Provider } = require('../models');
const { nowpayment_status } = require('../lib/nowpayment_status');

exports.handlerCryptoInvoice = async function handlerCryptoInvoice(req, res) {
    const payload = {
        price_amount: req.body.price_amount,
        price_currency: req.body.price_currency,
        pay_currency: req.body.pay_currency,
        success_url: req.body.success_url,
        cancel_url: req.body.cancel_url,
        ipn_callback_url: req.body.ipn_callback_url,
        is_fixed_rate: req.body.is_fixed_rate || false,
        is_fee_paid_by_user: req.body.is_fee_paid_by_user || true,
    };

  if (!NOWPAYMENTS_API_KEY) {
    console.log('Missing NOWPAYMENTS_API_KEY in environment variables.');
    return res.status(500).json({ error: 'Missing NOWPAYMENTS_API_KEY in environment variables.' });
  }
  if (
    !payload ||
    typeof payload.price_amount !== 'number' ||
    !payload.price_currency
    // || !payload.success_url
    // || !payload.cancel_url
    // || !payload.ipn_callback_url
    // || !payload.order_id
    // || !payload.order_description
    || typeof payload.is_fixed_rate !== 'boolean'
    || typeof payload.is_fee_paid_by_user !== 'boolean'
  ) {
    console.log('Missing required fields');
    console.log(payload);
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    console.log('Creating invoice...');
    const response = await axios.post(NOWPAYMENTS_BASE_URL + '/invoice', payload, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      }
    });
  
    console.log(response.data);
    const provider = await Provider.findOne({ where: { name: 'Crypto' } });
    
    await Payment.create({
        provider_payment_id: response.data.id,
        session_id: req.session.id,
        user_id: req.user.id,
        provider_name: provider.name,
        provider_id: provider.id,
        amount: payload.price_amount,
        currency: payload.price_currency,
        status: nowpayment_status.WAITING,
        raw_response: response.data,
        metadata: req.body.metadata ? req.body.metadata : null,
    });

    return res.json(response.data);
  } catch (err) {
    // Normalize axios errors for easier debugging
    if (err.response) {
      const { status, data } = err.response;
      const msg = `NOWPayments Create Invoice failed (${status}): ${
        typeof data === 'string' ? data : JSON.stringify(data)
      }`;
    //   throw new Error(msg);
    console.log(msg);
    return res.status(status).json({ error: msg });
    }
    if (err.request) {
      console.log('NOWPayments request made but no response received.');
      return res.status(500).json({ error: 'NOWPayments request made but no response received.' });
    }
    console.log(`NOWPayments error: ${err.message}`);
    return res.status(500).json({ error: `NOWPayments error: ${err.message}` });
  }
}

exports.handlerCryptoSubscription =  async function handlerCryptoSubscription(req, res) {
    const payload = {
        email: req.body.email,
        subscription_plan_id: req.body.subscription_plan_id
    };

    if (!NOWPAYMENTS_API_KEY) { 
        console.log('Missing NOWPAYMENTS_API_KEY in environment variables.');
        return res.status(500).json({ error: 'Missing NOWPAYMENTS_API_KEY in environment variables.' });
    }

    if (
        !payload ||
        !payload.subscription_plan_id
        || !payload.email
    ) {
        console.log('Missing required fields');
        console.log(payload);
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const token = await handlerAuthentication();
        console.log('Creating subscription...');
        const response = await axios.post(NOWPAYMENTS_BASE_URL + '/subscriptions', payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log('Subscription created successfully');
        return res.json(response.data);
    } catch (error) {
        console.log('Subscription creation failed');
        console.log(error);
        return res.status(500).json({ error: 'Subscription creation failed' });
    }
}

async function handlerAuthentication(req, res) {
    const payload   = {
        "email": process.env.NOWPAYMENTS_ADMIN_EMAIL,
        "password": process.env.NOWPAYMENTS_ADMIN_PASSWORD 
    }

    const response = await axios.post(NOWPAYMENTS_BASE_URL + '/auth', payload,{
        headers: {
            'Content-Type': 'application/json'
        },
    });

    return response.data.token;
}
    

    

