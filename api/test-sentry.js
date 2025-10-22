import { withSentry, captureMessage } from '../lib/sentry-server.js';

/**
 * Test endpoint for Sentry integration
 * Visit /api/test-sentry to send a test error to Sentry
 */
export default withSentry(async function handler(req, res) {
  // Send a test message
  captureMessage('🎯 Sentry Test: API endpoint accessed', 'info');
  
  // Throw a test error
  throw new Error('🔥 Sentry Test Error: This is a deliberate error to test Sentry integration!');
  
  // This line will never be reached
  res.status(200).json({ message: 'This should not appear' });
});

