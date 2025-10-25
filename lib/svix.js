const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');

let cachedJwt = null;

function getJwt() {
    if (cachedJwt) return cachedJwt;
    
    const secret = process.env.SVIX_JWT_SECRET;
    
    if (!secret) throw new Error('SVIX_JWT_SECRET not set');

    cachedJwt = jwt.sign(
    { sub: 'org_23rb8YdGqMT0qIzpgGwdXfHirMu', iat: Math.floor(Date.now() / 1000) },
    secret,
    { algorithm: 'HS256', expiresIn: '1h' }
  );

  return cachedJwt;
}

async function createApp(name) {
    const app = await axios.create({
        baseURL: process.env.SVIX_BASE_URL || 'http://localhost:8071',
        timeout: 10_000,
        validateStatus: () => true,
      });
    
    const res = await app.post('/api/v1/app', {
        name
    }, {
        headers: {
            Authorization: 'Bearer ' + getJwt(),
        }
    })

    return res.data;
}

async function createEndpoint(url, appId) {
    const app = await axios.create({
        baseURL: process.env.SVIX_BASE_URL || 'http://localhost:8071',
        timeout: 10_000,
        validateStatus: () => true,
      });
    
    const res = await app.post('/api/v1/app/' + appId + '/endpoint', {
        url
    }, {
        headers: {
            Authorization: 'Bearer ' + getJwt(),
        }
    })

    return res.data;
}

async function updateEndpoint(url, appId, endpointId) {
    const app = await axios.create({
        baseURL: process.env.SVIX_BASE_URL || 'http://localhost:8071',
        timeout: 10_000,
        validateStatus: () => true,
      });
    
    const res = await app.patch('/api/v1/app/' + appId + '/endpoint/' + endpointId, {
        url
    }, {
        headers: {
            Authorization: 'Bearer ' + getJwt(),
        }
    })

    return res.data;
}

module.exports = { createApp, createEndpoint, updateEndpoint };