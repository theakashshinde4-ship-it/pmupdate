const crypto = require('crypto');

function getRequestId(req) {
  const incoming = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  if (incoming && typeof incoming === 'string' && incoming.trim()) return incoming.trim();
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}`;
}

function correlationIdMiddleware(req, res, next) {
  const id = getRequestId(req);
  req.correlationId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

module.exports = { correlationIdMiddleware };
