const util = require('util');

function maskSensitive(input) {
  if (!input || typeof input !== 'object') {
    return input;
  }
  const clone = JSON.parse(JSON.stringify(input));
  const sensitiveKeys = ['password', 'token', 'authorization'];
  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      clone[key] = '[redacted]';
    }
  }
  return clone;
}

function requestLogger(req, res, next) {
  const start = Date.now();
  const sanitizedBody = maskSensitive(req.body);
  console.log(`[HTTP] --> ${req.method} ${req.originalUrl}`);
  if (sanitizedBody && Object.keys(sanitizedBody).length > 0) {
    console.log(`[HTTP] Body: ${util.inspect(sanitizedBody, { depth: null })}`);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] <-- ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = { requestLogger };
