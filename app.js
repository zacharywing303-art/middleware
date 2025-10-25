var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var providersRouter = require('./routes/provider');
var whopRouter = require('./routes/whop'); // business routes for whop
var paymentRouter = require('./routes/payment');
var authMiddleware = require('./middleware/auth');
var nowpaymentsRouter = require('./routes/webhooks/nowpayments');
var testRouter = require('./routes/test');
var changellyRouter = require('./routes/webhooks/changelly');
var subscriptionRouter = require('./routes/subscription');
var whopWebhookRouter = require('./routes/webhooks/whop'); // ⚠️ renamed to avoid clash
var sessionRouter = require('./routes/session');
var app = express();
var cors = require('cors');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 1) CORS config
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  // include custom headers used by your auth/signature
  allowedHeaders: ['Content-Type','Authorization','x-key-id','x-api-key','x-signature'],
  exposedHeaders: [],
}));

// 2) Preflight: reply 204 (don’t auth-gate)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 3) Skip auth for public endpoints (webhooks, docs, sessions, test)
app.use((req, res, next) => {
  if (
    req.path.startsWith('/webhooks/nowpayments') ||
    req.path.startsWith('/test') ||
    req.path.startsWith('/webhooks/changelly') ||
    req.path.startsWith('/sessions') ||
    req.path.startsWith('/webhooks/whop') ||
    req.path.startsWith('/openapi.json') ||
    req.path.startsWith('/docs')
  ) {
    return next();
  }
  return authMiddleware(req, res, next);
});

// Routers
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/providers', providersRouter);
app.use('/whops', whopRouter);
app.use('/payments', paymentRouter);
app.use('/webhooks/nowpayments', nowpaymentsRouter);
app.use('/test', testRouter);
app.use('/webhooks/changelly', changellyRouter);
app.use('/webhooks/whop', whopWebhookRouter); // use the renamed router here
app.use('/subscriptions', subscriptionRouter);
app.use('/sessions', sessionRouter);

// --- ReDoc + OpenAPI ---
const redoc = require('redoc-express');
const swaggerJSDoc = require('swagger-jsdoc');

const API_BASE = process.env.API_URL || 'http://localhost:3000';

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0', // stable for swagger-jsdoc@6
    info: {
      title: 'Payment Checkout API',
      version: '1.0.0',
      description: 'API docs generated from JSDoc in /routes'
    },
    servers: [{ url: API_BASE }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      headers: {
        'x-key-id': { description: 'Key identifier', schema: { type: 'string' } },
        'x-api-key': { description: 'API key', schema: { type: 'string' } }
      },
      schemas: {
        // (keep your existing WebhookChangelly here if you still use it)
    
        WebhookChangellyEventPayload: {
          type: 'object',
          required: ['id', 'provider', 'order_id', 'status', 'type', 'payin', 'payout', 'occurred_at'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'UUID of changelly_wh row'
            },
            provider: {
              type: 'string',
              enum: ['onramp'],
              description: 'Fixed provider tag for normalization'
            },
            order_id: {
              type: 'string',
              description: 'Provider order id'
            },
            status: {
              type: 'string',
              description: 'Current status reported by provider',
              enum: ['pending', 'processing', 'completed', 'expired', 'failed', 'cancelled', 'refunded', 'unknown']
            },
            type: {
              type: 'string',
              enum: ['buy', 'sell'],
              description: 'Order direction'
            },
            payin: {
              type: 'object',
              required: ['amount', 'currency'],
              properties: {
                amount: { type: 'number' },
                currency: { type: 'string', description: 'e.g., USD, EUR, BTC' }
              }
            },
            payout: {
              type: 'object',
              required: ['amount', 'currency'],
              properties: {
                amount: { type: 'number' },
                currency: { type: 'string' },
                address: {
                  type: 'string',
                  nullable: true,
                  description: 'Destination wallet address, if applicable'
                }
              }
            },
            aliases: {
              type: 'object',
              nullable: true,
              description: 'Provider-specific alias fields used for normalization/mapping',
              properties: {
                currency_from: { type: 'string', nullable: true },
                currency_to: { type: 'string', nullable: true },
                amount_from: { type: 'number', nullable: true }
              }
            },
            geo: {
              type: 'object',
              nullable: true,
              properties: {
                country: { type: 'string', nullable: true },
                state: { type: 'string', nullable: true },
                ip: { type: 'string', format: 'ipv4', nullable: true }
              }
            },
            link: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'Redirect URL (if provided by provider)'
            },
            occurred_at: {
              type: 'string',
              format: 'date-time',
              description: 'provider_updated_at || provider_created_at || createdAt'
            },
            raw: {
              type: 'object',
              additionalProperties: true,
              nullable: true,
              description: 'Original payload blob from provider'
            }
          },
          example: {
            id: "7b3f7c5a-9a7a-4b9f-9c3c-1f2b3a4c5d6e",
            provider: "onramp",
            order_id: "chgly_123456789",
            status: "processing",
            type: "buy",
            payin: { amount: 500, currency: "USD" },
            payout: { amount: 0.0075, currency: "BTC", address: "bc1qexample..." },
            aliases: { currency_from: "USD", currency_to: "BTC", amount_from: 500 },
            geo: { country: "US", state: "CA", ip: "203.0.113.42" },
            link: "https://example.com/redirect/abc",
            occurred_at: "2025-09-22T12:34:56Z",
            raw: { providerCode: "changelly", extra: "..." }
          }
        },

        WebhookWhopPaymentEventPayload: {
          type: 'object',
          required: [
            'provider',
            'id',
            'whop_payment_id',
            'status',
            'subtotal',
            'final_amount',
            'currency',
            'payment_method',
            'user',
            'billing'
          ],
          properties: {
            provider: {
              type: 'string',
              enum: ['credit-card'],
              description: 'Fixed provider tag for normalized credit-card payments from Whop'
            },
            id: {
              type: 'string',
              description: 'Internal record id'
            },
            whop_payment_id: {
              type: 'string',
              description: 'Payment id from Whop'
            },
            status: {
              type: 'string',
              description: 'Payment status',
              enum: [
                'pending','processing','paid','failed','cancelled',
                'refunded','partially_refunded','disputed','unknown'
              ]
            },
            subtotal: { type: 'number', description: 'Amount before fees/discounts/taxes' },
            final_amount: { type: 'number', description: 'Final amount charged' },
            currency: { type: 'string', description: 'ISO currency code, e.g., USD' },
        
            payment_method: {
              type: 'string',
              description: 'Payment method type reported by Whop (e.g., card, apple_pay)'
            },
        
            card: {
              type: 'object',
              nullable: true,
              properties: {
                brand: {
                  type: 'string',
                  description: 'Card network/brand',
                  enum: ['visa','mastercard','amex','discover','jcb','diners','unionpay','unknown']
                },
                last4: {
                  type: 'string',
                  pattern: '^[0-9]{4}$',
                  description: 'Last 4 digits'
                }
              },
              required: ['brand','last4']
            },
        
            user: {
              type: 'object',
              required: ['whop_user_id','email','username'],
              properties: {
                whop_user_id: { type: 'string' },
                email: { type: 'string', format: 'email' },
                username: { type: 'string' }
              }
            },
        
            billing: {
              type: 'object',
              required: ['reason','name','address'],
              properties: {
                reason: { type: 'string', description: 'Billing reason (e.g., subscription, invoice)' },
                name: { type: 'string' },
                address: {
                  type: 'object',
                  required: ['line1','city','postal_code','country'],
                  properties: {
                    line1: { type: 'string' },
                    line2: { type: 'string', nullable: true },
                    city: { type: 'string' },
                    state: { type: 'string', nullable: true },
                    postal_code: { type: 'string' },
                    country: { type: 'string' }
                  }
                }
              }
            },
        
            created_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Derived from created_at_unix (seconds)'
            },
            paid_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Derived from paid_at_unix (seconds)'
            },
            refunded_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Derived from refunded_at_unix (seconds)'
            },
        
            affiliate: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Affiliate info (shape may vary)'
            },
            membership_metadata: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Arbitrary membership metadata'
            },
            acquisition_data: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Acquisition/attribution data'
            },
            billing_usage_ids: {
              type: 'array',
              nullable: true,
              items: { type: 'string' },
              description: 'Usage record ids associated with the bill'
            }
          },
          example: {
            provider: 'credit-card',
            id: 'rec_01HXYZABCD123',
            whop_payment_id: 'pay_abc123',
            status: 'paid',
            subtotal: 299.0,
            final_amount: 299.0,
            currency: 'USD',
            payment_method: 'card',
            card: { brand: 'visa', last4: '4242' },
            user: {
              whop_user_id: 'user_9qwe123',
              email: 'alice@example.com',
              username: 'alice'
            },
            billing: {
              reason: 'subscription',
              name: 'Alice Nguyen',
              address: {
                line1: '123 Market St',
                line2: null,
                city: 'San Francisco',
                state: 'CA',
                postal_code: '94103',
                country: 'US'
              }
            },
            created_at: '2025-09-22T10:20:30Z',
            paid_at: '2025-09-22T10:21:10Z',
            refunded_at: null,
            affiliate: { code: 'AFF123', partner: 'InfluencerX' },
            membership_metadata: { plan: 'pro', seats: 1 },
            acquisition_data: { utm_source: 'adwords', campaign: 'q3_launch' },
            billing_usage_ids: ['usage_001','usage_002']
          }
        },

        WebhookNowPaymentsEventPayload: {
          type: 'object',
          required: [
            'id',
            'provider',
            'provider_payment_id',
            'order_id',
            'status',
            'price',
            'pay',
            'occurred_at'
          ],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'UUID of nowpayment_wh row'
            },
            provider: {
              type: 'string',
              enum: ['crypto'],
              description: 'Fixed provider tag for NowPayments'
            },
            provider_payment_id: {
              type: 'string',
              description: 'Payment ID from NowPayments provider'
            },
            order_id: {
              type: 'string',
              description: 'Your internal order id linked to the payment'
            },
            status: {
              type: 'string',
              description: 'Payment status reported by NowPayments',
              enum: [
                'waiting',
                'confirming',
                'confirmed',
                'finished',
                'failed',
                'refunded'
              ]
            },
            price: {
              type: 'object',
              required: ['amount','currency'],
              properties: {
                amount: { type: 'number' },
                currency: { type: 'string', description: 'Fiat currency, e.g., USD' }
              }
            },
            pay: {
              type: 'object',
              required: ['amount','currency','address'],
              properties: {
                amount: { type: 'number' },
                currency: { type: 'string', description: 'Crypto currency, e.g., BTC, ETH' },
                address: { type: 'string', description: 'Payment address for crypto transfer' },
                actually_paid: {
                  type: 'number',
                  nullable: true,
                  description: 'Amount actually received by provider'
                }
              }
            },
            occurred_at: {
              type: 'string',
              format: 'date-time',
              description: 'updated_at_provider || created_at_provider || createdAt'
            },
            raw: {
              type: 'object',
              nullable: true,
              additionalProperties: true,
              description: 'Raw original payload from NowPayments'
            }
          },
          example: {
            id: "0a5f9b9c-1234-4e7b-bc6a-9f4f1a2b3c4d",
            provider: "crypto",
            provider_payment_id: "npmt_987654321",
            order_id: "order_12345",
            status: "confirming",
            price: {
              amount: 150,
              currency: "USD"
            },
            pay: {
              amount: 0.0025,
              currency: "BTC",
              address: "bc1qexampleaddress123",
              actually_paid: 0.0025
            },
            occurred_at: "2025-09-23T11:00:00Z",
            raw: { provider: "nowpayments", network: "BTC", confirmations: 2 }
          }
        }
      }
    },
    // Default: require bearer on all routes; override with `security: []` in route docs where not needed
    security: [{ bearerAuth: [] }]
  },
  apis: [path.join(__dirname, './routes/**/*.js')]
});

// Spec JSON
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ReDoc UI
app.get(
  '/docs',
  redoc({
    title: 'API Docs',
    specUrl: '/openapi.json',
    // ReDoc options
    redocOptions: {
      jsonSampleExpandLevel: 'all'
    }
  })
);
// 404
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;