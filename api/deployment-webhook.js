/**
 * Vercel Deployment Webhook Handler
 * 
 * This endpoint receives deployment status updates from Vercel
 * and sends appropriate Telegram notifications
 * 
 * Setup in Vercel:
 * 1. Go to Project Settings → Git → Deploy Hooks
 * 2. Add webhook URL: https://your-domain.com/api/deployment-webhook
 * 3. Set secret token in DEPLOYMENT_WEBHOOK_SECRET env var
 */

import { withSentry } from '../lib/sentry-server.js';
import { notifyTelegram } from './lib/telegram.js';

function formatDeploymentMessage(payload) {
  const { deployment, project } = payload;
  
  // Deployment states: BUILDING, READY, ERROR, CANCELED
  const state = deployment?.state || 'UNKNOWN';
  const url = deployment?.url || 'N/A';
  const createdAt = deployment?.createdAt 
    ? new Date(deployment.createdAt).toLocaleString('tr-TR')
    : new Date().toLocaleString('tr-TR');
  const commitMessage = deployment?.meta?.githubCommitMessage || 'No commit message';
  const commitSha = deployment?.meta?.githubCommitSha 
    ? deployment.meta.githubCommitSha.substring(0, 7)
    : 'unknown';

  // Different messages based on deployment state
  switch (state) {
    case 'READY':
      return `
🎉 <b>DEPLOYMENT BAŞARILI</b>

✅ Production deploy tamamlandı
⏰ ${createdAt}
🔗 https://${url}
📝 ${commitMessage}
🔖 Commit: ${commitSha}

<i>Site başarıyla güncellendi! 🚀</i>`;

    case 'ERROR':
      return `
❌ <b>DEPLOYMENT HATASI</b>

🚨 Production deploy başarısız oldu
⏰ ${createdAt}
🔗 https://${url}
📝 ${commitMessage}
🔖 Commit: ${commitSha}

<i>Lütfen Vercel dashboard'da detayları kontrol edin.</i>
<i>https://vercel.com/${project?.name || 'dashboard'}</i>`;

    case 'BUILDING':
      return `
⚙️ <b>DEPLOYMENT BAŞLADI</b>

🔨 Build süreci başladı
⏰ ${createdAt}
📝 ${commitMessage}
🔖 Commit: ${commitSha}

<i>Build tamamlandığında bildirilecek...</i>`;

    case 'CANCELED':
      return `
⚠️ <b>DEPLOYMENT İPTAL EDİLDİ</b>

🛑 Deploy işlemi iptal edildi
⏰ ${createdAt}
📝 ${commitMessage}
🔖 Commit: ${commitSha}`;

    default:
      return `
ℹ️ <b>DEPLOYMENT DURUM GÜNCELLEMESİ</b>

📊 Durum: ${state}
⏰ ${createdAt}
🔗 https://${url}
📝 ${commitMessage}
🔖 Commit: ${commitSha}`;
  }
}

export default withSentry(async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook secret for security
    const webhookSecret = process.env.DEPLOYMENT_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('⚠️ DEPLOYMENT_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const providedSecret = req.headers['x-vercel-signature'] || req.query.secret;

    if (providedSecret !== webhookSecret) {
      console.warn('⚠️ Invalid webhook secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse the payload
    const payload = req.body;

    console.log('📦 Deployment webhook received:', {
      state: payload?.deployment?.state,
      url: payload?.deployment?.url,
      project: payload?.project?.name,
    });

    const message = formatDeploymentMessage(payload);
    await notifyTelegram(message);

    return res.status(200).json({
      success: true,
      message: 'Notification sent',
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

