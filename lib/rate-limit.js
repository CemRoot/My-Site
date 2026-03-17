/**
 * Rate Limiting Helper
 * In-memory rate limiting for Vercel serverless functions
 * 
 * NOTE: This implementation uses in-memory cache which resets on cold starts.
 * For production, consider using Upstash Redis or Vercel Edge Config
 * 
 * Install for production:
 * npm install @upstash/ratelimit @upstash/redis
 */

// In-memory cache for rate limiting
const rateLimitCache = new Map();

// Cleanup old entries every 10 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of rateLimitCache.entries()) {
    const validRequests = requests.filter(time => now - time < 3600000); // Keep last hour
    if (validRequests.length === 0) {
      rateLimitCache.delete(key);
    } else {
      rateLimitCache.set(key, validRequests);
    }
  }
}, 600000);

// Allow the process to exit even if the interval is still active
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Check if request should be rate limited
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} { success: boolean, remaining: number, resetAt: Date }
 */
export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userKey = `ratelimit:${identifier}`;

  // Get existing requests
  if (!rateLimitCache.has(userKey)) {
    rateLimitCache.set(userKey, []);
  }

  // Filter requests within window
  const requests = rateLimitCache.get(userKey).filter(time => now - time < windowMs);

  // Check if limit exceeded
  if (requests.length >= maxRequests) {
    const oldestRequest = Math.min(...requests);
    const resetAt = new Date(oldestRequest + windowMs);
    
    return {
      success: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000)
    };
  }

  // Add current request
  requests.push(now);
  rateLimitCache.set(userKey, requests);

  const resetAt = new Date(now + windowMs);
  
  return {
    success: true,
    remaining: maxRequests - requests.length,
    resetAt,
    retryAfter: 0
  };
}

/**
 * Get client identifier from request
 * @param {object} req - HTTP request object
 * @returns {string} Client identifier (IP address or forwarded IP)
 */
export function getClientIdentifier(req) {
  // Try to get real IP from headers (Vercel sets these)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }
  
  // Fallback to connection remote address
  return req.connection?.remoteAddress || 'unknown';
}

/**
 * Send rate limit exceeded response
 * @param {object} res - HTTP response object
 * @param {object} limitInfo - Rate limit info from checkRateLimit
 */
export function sendRateLimitResponse(res, limitInfo) {
  res.setHeader('X-RateLimit-Limit', limitInfo.limit || 'N/A');
  res.setHeader('X-RateLimit-Remaining', limitInfo.remaining);
  res.setHeader('X-RateLimit-Reset', limitInfo.resetAt.toISOString());
  res.setHeader('Retry-After', limitInfo.retryAfter);
  
  return res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: limitInfo.retryAfter,
    resetAt: limitInfo.resetAt.toISOString()
  });
}
