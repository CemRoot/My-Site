#!/bin/bash

###############################################################################
# Post-Deployment Hook for Vercel
# 
# Automatically runs after successful Vercel deployment
# Configures Telegram bot menu and sends notification
###############################################################################

echo "🚀 Post-Deployment Hook Started"
echo "=================================="

# Check if this is a production deployment
if [ "$VERCEL_ENV" = "production" ]; then
    echo "✅ Production deployment detected"
    
    # Wait a bit for deployment to fully complete
    echo "⏳ Waiting 10 seconds for deployment to stabilize..."
    sleep 10
    
    # Call our API endpoint to setup Telegram menu
    echo "🤖 Setting up Telegram bot menu..."
    
    if [ -n "$TELEGRAM_CONTROL_API_SECRET" ]; then
        # With API secret
        RESPONSE=$(curl -s -X POST "${VERCEL_URL}/api/telegram-control?action=setup-menu" \
            -H "Authorization: Bearer ${TELEGRAM_CONTROL_API_SECRET}" \
            -H "Content-Type: application/json")
    else
        # Without API secret (not recommended for production)
        RESPONSE=$(curl -s -X POST "${VERCEL_URL}/api/telegram-control?action=setup-menu" \
            -H "Content-Type: application/json")
    fi
    
    echo "Response: $RESPONSE"
    
    # Send deployment notification
    echo "📢 Sending deployment notification to Telegram..."
    
    DEPLOY_MESSAGE="🚀 <b>DEPLOYMENT BAŞARILI</b>%0A%0A✅ Production deployment tamamlandı%0A⏰ Zaman: $(date -u +'%Y-%m-%d %H:%M:%S UTC')%0A🔗 URL: ${VERCEL_URL}%0A📦 Commit: ${VERCEL_GIT_COMMIT_MESSAGE}%0A%0A<i>Bot menüsü otomatik olarak güncellendi</i>"
    
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_CHAT_ID}" \
        -d "text=${DEPLOY_MESSAGE}" \
        -d "parse_mode=HTML" \
        -d "disable_web_page_preview=true" > /dev/null
    
    echo "✅ Post-deployment hook completed successfully"
else
    echo "ℹ️  Non-production deployment (${VERCEL_ENV}), skipping bot setup"
fi

echo "=================================="
echo "🎉 Hook Finished"

