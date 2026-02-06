const Bull = require('bull');

function createQueue(name, opts = {}) {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;

  const hasUrl = typeof redisUrl === 'string' && redisUrl.trim();
  const hasHost = typeof redisHost === 'string' && redisHost.trim();

  if (!hasUrl && !hasHost) {
    return null;
  }

  const bullOpts = { ...opts };

  if (hasUrl) {
    bullOpts.redis = redisUrl;
  } else {
    bullOpts.redis = {
      host: redisHost,
      port: redisPort ? Number(redisPort) : 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined
    };
  }

  return new Bull(name, bullOpts);
}

module.exports = { createQueue };
