const { ChangellyFiatClient } = require('@changelly/fiat-api-sdk-node');
const { ChangellyOrder, Payment, Provider } = require('../models');

const client = new ChangellyFiatClient({
    privateKey: process.env.CHANGEL_PRIVATE_KEY,
    publicKey: process.env.CHANGEL_PUBLIC_KEY,
  });

const generateRandomId = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const onrampHandler = async (req, res) => {
    const { amount, provider_code } = req.body;

    const orderData = {
        "externalOrderId": generateRandomId(12),
        "externalUserId": "user-" + generateRandomId(12),
        "providerCode": provider_code,
        "currencyFrom": "USD",
        "currencyTo": "BTC",
        "amountFrom": amount.toString(),
        "country": "US",
        "state": "CA",
        "walletAddress": process.env.CRYPTO_WALLET_ADDRESS, 
      };

      console.log(orderData);
    try {
        const response = await client.createOrder(orderData);

        console.log(response);

        const provider = await Provider.findOne({ where: { name: 'Fiat Onramp' } });
        await Payment.create({
            session_id: req.session.id,
            user_id: req.user.id,
            provider_name: provider.name,
            provider_id: provider.id,
            status: 'pending',
            amount: amount,
            currency: 'USD',
            metadata: req.body.metadata ? req.body.metadata : null,
            raw_response: response
        });

        return res.json(response);
    } catch (error) {
        console.error('Changelly API error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = onrampHandler;