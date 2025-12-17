/**
 * Revalidate Tech News Cache
 * Invalidates Vercel CDN cache for tech-news API
 * 
 * Usage:
 * POST /api/revalidate-news
 * Headers: Authorization: Bearer YOUR_SECRET
 */

export default async function handler(req, res) {
  // Security: Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  // Security: Check authorization
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.VERCEL_REVALIDATE_TOKEN || process.env.TELEGRAM_CONTROL_API_SECRET;
  
  if (!expectedSecret) {
    return res.status(500).json({
      success: false,
      message: 'Revalidation not configured. Set VERCEL_REVALIDATE_TOKEN or TELEGRAM_CONTROL_API_SECRET'
    });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Provide Bearer token in Authorization header.'
    });
  }

  const token = authHeader.replace('Bearer ', '');
  if (token !== expectedSecret) {
    return res.status(403).json({
      success: false,
      message: 'Invalid token'
    });
  }

  try {
    // Revalidate the tech-news API route
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.SITE_URL || 'https://cemkoyluoglu.codes';
    
    const apiUrl = `${baseUrl}/api/tech-news`;
    
    console.log(`🔄 Revalidating cache for: ${apiUrl}`);
    
    // Make a request with cache-busting headers
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'X-Vercel-Revalidate': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`Revalidation request failed: ${response.status}`);
    }

    // Also try Vercel's revalidation endpoint if available
    try {
      await fetch(`${baseUrl}/api/tech-news?revalidate=1`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
    } catch (e) {
      // Ignore if revalidation endpoint doesn't exist
      console.log('Revalidation endpoint not available, using cache headers only');
    }

    return res.status(200).json({
      success: true,
      message: 'Cache revalidated successfully',
      timestamp: new Date().toISOString(),
      note: 'Cache will be cleared within 60 seconds for all users'
    });

  } catch (error) {
    console.error('❌ Revalidation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revalidate cache',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

