/**
 * LinkedInOpsService — digests, groups, clean pending, digest callbacks to n8n.
 */

import { getSocialMenuKeyboard, getMainMenuKeyboard } from '../keyboards.js';

export class LinkedInOpsService {
  constructor(deps) {
    this.sendTelegramMessage = deps.sendTelegramMessage;
    this.callTelegramApi = deps.callTelegramApi;
    this.supabase = deps.supabase;
    this.env = deps.env;
    this.config = deps.config;
  }

  /**
   * Handle Social Media Submenu
   */
  async handleSocialMenu() {
    const text = `
📱 <b>SOCIAL MEDIA</b>

Manage automated social posts:
• <b>LinkedIn Digests:</b> View, approve, or reject daily digests
• <b>LinkedIn Groups:</b> Trigger group-specific automated digests`;

    await this.sendTelegramMessage(text, {
      reply_markup: getSocialMenuKeyboard()
    });
  }

  /**
   * Handle /linkedin command - Show pending LinkedIn digests
   */
  async handleLinkedInCommand() {
    try {
      await this.sendTelegramMessage('📱 <b>LinkedIn Digest\'ler Yükleniyor...</b>');

      const { data: digests, error } = await this.supabase
        .from('linkedin_digest_posts')
        .select('*')
        .in('status', ['pending', 'posting', 'posted', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!digests || digests.length === 0) {
        await this.sendTelegramMessage(
          '📱 <b>LinkedIn Digest\'ler</b>\n\n' +
          'ℹ️ Henüz digest bulunamadı.\n\n' +
          'Digest\'ler her gün saat 16:30\'da otomatik olarak oluşturulur.\n\n' +
          '👇 Manuel olarak digest oluşturmak için butona tıklayın:',
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚀 Manuel Digest Oluştur', callback_data: 'action_create_digest' }],
                [{ text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' }]
              ]
            }
          }
        );
        return;
      }

      const pending = digests.filter(d => d.status === 'pending');
      const posting = digests.filter(d => d.status === 'posting');
      const posted = digests.filter(d => d.status === 'posted');
      const rejected = digests.filter(d => d.status === 'rejected');
      const stuckDigests = [...pending, ...posting];

      let messageText = '📱 <b>LINKEDİN DIGEST YÖNETİMİ</b>\n\n';

      if (posting.length > 0) {
        messageText += '<b>⚠️ Takılı Kalmış (Posting):</b>\n';
        posting.forEach(d => {
          messageText += `🔴 ${d.digest_date} | 📊 ${d.article_count} haber (LinkedIn hatası)\n`;
        });
        messageText += '\n';
      }

      if (pending.length > 0) {
        messageText += '<b>⏳ Onay Bekleyen:</b>\n';
        pending.forEach(d => {
          messageText += `📅 ${d.digest_date} | 📊 ${d.article_count} haber\n`;
        });
        messageText += '\n';
      }

      if (posted.length > 0) {
        messageText += '<b>✅ Paylaşılan:</b>\n';
        posted.slice(0, 3).forEach(d => {
          const date = new Date(d.posted_at).toLocaleDateString('tr-TR');
          messageText += `✓ ${d.digest_date} (${date})\n`;
        });
        if (posted.length > 3) {
          messageText += `<i>... ve ${posted.length - 3} daha</i>\n`;
        }
        messageText += '\n';
      }

      if (rejected.length > 0) {
        messageText += '<b>❌ Reddedilen:</b>\n';
        rejected.slice(0, 2).forEach(d => {
          messageText += `✗ ${d.digest_date}\n`;
        });
        messageText += '\n';
      }

      const buttons = [];

      if (pending.length > 0) {
        pending.forEach(digest => {
          buttons.push([
            {
              text: `📅 ${digest.digest_date} - Görüntüle`,
              callback_data: `view_${digest.id}`
            },
            {
              text: '✅ Onayla',
              callback_data: `approve_${digest.id}`
            }
          ]);
        });
      }

      buttons.push([
        { text: '🚀 Manuel Digest Oluştur', callback_data: 'action_create_digest' }
      ]);

      if (stuckDigests.length > 0) {
        buttons.push([
          { text: '🗑️ Takılı Digest\'leri Temizle', callback_data: 'action_clean_pending' }
        ]);
      }

      buttons.push([
        { text: '🔙 Ana Menü', callback_data: 'action_refresh_menu' }
      ]);

      await this.sendTelegramMessage(messageText, {
        reply_markup: { inline_keyboard: buttons }
      });

    } catch (error) {
      console.error('LinkedIn command error:', error);
      await this.sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
    }
  }

  /**
   * Handle LinkedIn Groups Daily Digest - Trigger GitHub Action
   */
  async handleLinkedInGroupsDigest(groupId = null) {
    try {
      await this.sendTelegramMessage(
        '🔵 <b>LinkedIn Groups Digest Oluşturuluyor...</b>\n\n' +
        '🤖 AI Model: Groq (Llama 3.3 70B)\n' +
        '📊 Mod: Daily Digest\n\n' +
        '⏳ GitHub Actions workflow tetikleniyor...'
      );

      if (this.config.GITHUB_TOKEN) {
        const [owner, repo] = this.config.GITHUB_REPO.split('/');

        const inputs = {
          mode: 'daily'
        };

        if (groupId) {
          inputs.group_id = groupId;
        }

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/workflows/linkedin-groups.yml/dispatches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.config.GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ref: 'main',
              inputs
            })
          }
        );

        if (response.ok) {
          await this.sendTelegramMessage(
            '✅ <b>LinkedIn Groups Digest Başlatıldı!</b>\n\n' +
            '📊 GitHub Actions workflow tetiklendi\n' +
            '⏳ İşlem adımları:\n' +
            '  1️⃣ Son 48 saatin haberleri çekiliyor\n' +
            '  2️⃣ Grup için relevance skoru hesaplanıyor\n' +
            '  3️⃣ En iyi 3 haber seçiliyor\n' +
            '  4️⃣ AI ile içerik oluşturuluyor\n' +
            '  5️⃣ Telegram\'a gönderiliyor\n\n' +
            '🔔 İçerik hazır olduğunda bildirim alacaksınız!\n\n' +
            '<i>Tahmini süre: 30-60 saniye</i>'
          );
        } else {
          const errorText = await response.text();
          throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
        }
      } else {
        throw new Error('GITHUB_TOKEN not configured');
      }
    } catch (error) {
      console.error('LinkedIn Groups Digest error:', error);
      await this.sendTelegramMessage(
        `❌ <b>LinkedIn Groups Digest Başlatılamadı!</b>\n\n` +
        `<code>${error.message}</code>\n\n` +
        `💡 Alternatif:\n` +
        `Lokal olarak çalıştırın:\n` +
        `<code>node scripts/linkedin-groups-digest.js daily</code>`
      );
    }
  }

  /**
   * Handle action_create_digest - Trigger manual digest creation
   */
  async handleCreateDigestAction() {
    try {
      await this.sendTelegramMessage('🔍 <b>Digest kontrolü yapılıyor...</b>');

      const today = new Date().toISOString().split('T')[0];

      const { data: existingDigest, error: checkError } = await this.supabase
        .from('linkedin_digest_posts')
        .select('*')
        .eq('digest_date', today)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingDigest) {
        if (existingDigest.status === 'pending') {
          await this.sendTelegramMessage(
            '⚠️ <b>Bugün için digest zaten mevcut!</b>\n\n' +
            `📅 Tarih: ${existingDigest.digest_date}\n` +
            `📊 Durum: ${existingDigest.status}\n` +
            `📝 Haber sayısı: ${existingDigest.article_count}\n\n` +
            'Digest zaten oluşturulmuş ve onay bekliyor.\n' +
            'LinkedIn Posts menüsünden görüntüleyebilirsiniz.'
          );
          return;
        } else if (existingDigest.status === 'posted') {
          await this.sendTelegramMessage(
            '✅ <b>Bugün için digest zaten paylaşılmış!</b>\n\n' +
            `📅 Tarih: ${existingDigest.digest_date}\n` +
            `📊 Paylaşım: ${new Date(existingDigest.posted_at).toLocaleString('tr-TR')}\n\n` +
            'Yeni bir digest oluşturmak için yarın tekrar deneyin.'
          );
          return;
        } else if (existingDigest.status === 'rejected') {
          await this.sendTelegramMessage('🔄 <b>Reddedilen digest siliniyor, yenisi oluşturuluyor...</b>');

          const { error: deleteError } = await this.supabase
            .from('linkedin_digest_posts')
            .delete()
            .eq('id', existingDigest.id);

          if (deleteError) {
            throw new Error(`Silme hatası: ${deleteError.message}`);
          }
        }
      }

      await this.sendTelegramMessage('🚀 <b>Manuel Digest Oluşturuluyor...</b>\n\nLütfen bekleyin, bu işlem 30-60 saniye sürebilir.');

      const N8N_WEBHOOK_URL = process.env.N8N_LINKEDIN_WORKFLOW_WEBHOOK;

      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N_LINKEDIN_WORKFLOW_WEBHOOK environment variable not configured. Please add it to Vercel.');
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: 'manual',
          chat_id: this.env.TELEGRAM_CHAT_ID,
          timestamp: new Date().toISOString(),
          force_recreate: existingDigest?.status === 'rejected'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n webhook error (${response.status}): ${errorText}`);
      }

      await this.sendTelegramMessage('⏳ <b>Digest oluşturuluyor...</b>');

    } catch (error) {
      console.error('Create digest error:', error);
      await this.sendTelegramMessage(
        `❌ <b>Digest oluşturma hatası!</b>\n\n<code>${error.message}</code>\n\n` +
        'Lütfen tekrar deneyin veya /help ile destek alın.'
      );
    }
  }

  /**
   * Handle clean pending digests action
   */
  async handleCleanPendingAction() {
    try {
      await this.sendTelegramMessage('🔍 <b>Takılı Digest\'ler Kontrol Ediliyor...</b>');

      const { data: stuckDigests, error } = await this.supabase
        .from('linkedin_digest_posts')
        .select('*')
        .in('status', ['pending', 'posting'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!stuckDigests || stuckDigests.length === 0) {
        await this.sendTelegramMessage(
          '✅ <b>Temizlenecek Takılı Digest Yok!</b>\n\n' +
          'Sistem şu anda temiz durumda.'
        );
        return;
      }

      const digestsFormatted = stuckDigests.map(d => ({
        id: d.id,
        date: d.digest_date,
        status: d.status,
        articles: d.article_count,
        created: new Date(d.created_at).toLocaleString('tr-TR'),
        age: Math.floor((Date.now() - new Date(d.created_at)) / (1000 * 60)) + ' minutes'
      }));

      let confirmText = '🗑️ <b>Takılı Digest Temizleme</b>\n\n';
      confirmText += `<b>Silinecek digest sayısı:</b> ${stuckDigests.length}\n\n`;
      confirmText += '<b>Digest Listesi:</b>\n';

      digestsFormatted.forEach(d => {
        const statusEmoji = d.status === 'posting' ? '🔴' : '⏳';
        confirmText += `${statusEmoji} ${d.date} - ${d.articles} haber (${d.status}) - ${d.age}\n`;
      });

      confirmText += '\n⚠️ <b>DİKKAT:</b> Bu işlem geri alınamaz!\n';
      confirmText += 'Tüm pending digest\'ler silinecek.\n\n';
      confirmText += 'Onaylıyor musunuz?';

      await this.sendTelegramMessage(confirmText, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Evet, Sil', callback_data: 'action_confirm_clean' },
              { text: '❌ İptal', callback_data: 'action_linkedin' }
            ]
          ]
        }
      });

    } catch (error) {
      console.error('Clean pending action error:', error);
      await this.sendTelegramMessage(`❌ <b>Hata!</b>\n\n${error.message}`);
    }
  }

  /**
   * Handle confirm clean action - actually delete pending digests
   */
  async handleConfirmCleanAction() {
    try {
      await this.sendTelegramMessage('🗑️ <b>Takılı Digest\'ler Siliniyor...</b>');

      const { data: stuckDigests, error: fetchError } = await this.supabase
        .from('linkedin_digest_posts')
        .select('*')
        .in('status', ['pending', 'posting']);

      if (fetchError) throw fetchError;

      let successText = '✅ <b>Temizleme Tamamlandı!</b>\n\n';

      if (stuckDigests && stuckDigests.length > 0) {
        const { error: deleteError } = await this.supabase
          .from('linkedin_digest_posts')
          .delete()
          .in('status', ['pending', 'posting']);

        if (deleteError) throw deleteError;

        successText += `<b>Silinen digest sayısı:</b> ${stuckDigests.length}\n\n`;
        successText += '<b>Silinen Digest\'ler:</b>\n';
        stuckDigests.forEach(d => {
          const statusEmoji = d.status === 'posting' ? '🔴' : '⏳';
          successText += `${statusEmoji} ${d.digest_date} - ${d.article_count} haber (${d.status})\n`;
        });
      } else {
        successText += 'Silinecek digest bulunamadı.';
      }

      successText += '\n\nArtık yeni digest oluşturabilirsiniz.';

      await this.sendTelegramMessage(successText, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🚀 Yeni Digest Oluştur', callback_data: 'action_create_digest' }
            ],
            [
              { text: '🔙 LinkedIn Menü', callback_data: 'action_linkedin' }
            ]
          ]
        }
      });

    } catch (error) {
      console.error('Confirm clean action error:', error);
      await this.sendTelegramMessage(`❌ <b>Silme Hatası!</b>\n\n${error.message}`);
    }
  }

  /**
   * Handle digest edit input (LinkedIn digest editing)
   */
  async handleDigestEditInput(editedContent, userId, digestId) {
    try {
      const { deleteConversationState } = await import('../../../../lib/conversation-state.js');

      if (editedContent.length > 3000) {
        await this.sendTelegramMessage(
          `❌ <b>İçerik çok uzun!</b>\n\n` +
          `📏 Mevcut: ${editedContent.length} karakter\n` +
          `📏 Maksimum: 3000 karakter\n\n` +
          `Lütfen içeriği kısaltın ve tekrar gönderin.`
        );
        return;
      }

      await deleteConversationState(userId);

      const { data: digest, error: updateError } = await this.supabase
        .from('linkedin_digest_posts')
        .update({
          edited_content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', digestId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Digest güncelleme hatası: ${updateError.message}`);
      }

      await this.sendTelegramMessage(
        `✅ <b>İçerik Güncellendi!</b>\n\n` +
        `📝 Düzenlenmiş içerik kaydedildi.\n` +
        `📊 Karakter sayısı: ${editedContent.length}/3000\n\n` +
        `<b>📋 Önizleme:</b>\n` +
        `${editedContent.substring(0, 500)}${editedContent.length > 500 ? '...' : ''}\n\n` +
        `👇 Şimdi ne yapmak istersiniz?`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ Approve & Post to LinkedIn',
                  callback_data: `approve_${digestId}`
                }
              ],
              [
                {
                  text: '❌ Reject',
                  callback_data: `reject_${digestId}`
                }
              ],
              [
                {
                  text: '👁️ View Full Content',
                  callback_data: `view_${digestId}`
                }
              ],
              [
                {
                  text: '🔙 Back to Menu',
                  callback_data: 'action_refresh_menu'
                }
              ]
            ]
          }
        }
      );

      console.log(`✅ Digest ${digestId} updated with edited content by user ${userId}`);

    } catch (error) {
      console.error('Digest edit input error:', error);
      await this.sendTelegramMessage(
        `❌ <b>Hata Oluştu!</b>\n\n${error.message}\n\n` +
        'Lütfen tekrar deneyin veya /help ile destek alın.',
        {
          reply_markup: getMainMenuKeyboard()
        }
      );
      const { deleteConversationState } = await import('../../../../lib/conversation-state.js');
      await deleteConversationState(userId);
    }
  }

  /**
   * Forward approve|reject|edit|view_<uuid> callbacks to n8n after status checks.
   * @returns {{ success: boolean, message: string, httpStatus?: number }}
   */
  async handleDigestCallback(callback_query, { checkRateLimit, isValidUUID, processedCallbacks }) {
    const data = callback_query.data;
    const chatId = callback_query.message.chat.id;
    const messageId = callback_query.message.message_id;
    const fromId = callback_query.from.id;
    const [action, digestId] = data.split('_');

    if (!isValidUUID(digestId)) {
      console.warn(`Invalid UUID format in callback: ${digestId}`);
      await this.sendTelegramMessage('❌ Geçersiz istek formatı.');
      return { success: false, message: 'Invalid UUID format', httpStatus: 400 };
    }

    const callbackQueryId = callback_query.id;

    if (processedCallbacks.has(callbackQueryId)) {
      console.log(`⚠️ Callback already processed: ${callbackQueryId}`);
      return { success: true, message: 'Already processed (deduplicated)' };
    }

    processedCallbacks.set(callbackQueryId, Date.now());
    setTimeout(() => processedCallbacks.delete(callbackQueryId), 300000);

    try {
      await this.callTelegramApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: '⏳ İşleniyor...',
        show_alert: false,
      });
      console.log(`✅ Callback acknowledged: ${callbackQueryId}`);
    } catch (ackError) {
      console.error('⚠️ Failed to acknowledge callback:', ackError.message);
    }

    if (!checkRateLimit(fromId, 10, 60000)) {
      console.warn(`Rate limit exceeded for user: ${fromId}`);
      await this.sendTelegramMessage('⏱️ Çok fazla istek gönderdiniz. Lütfen 1 dakika bekleyin.');
      return { success: true, message: 'Rate limited but callback acknowledged' };
    }

    try {
      const { data: digest, error: digestError } = await this.supabase
        .from('linkedin_digest_posts')
        .select('*')
        .eq('id', digestId)
        .single();

      if (digestError) {
        throw new Error(`Digest bulunamadı: ${digestError.message}`);
      }

      if (!digest) {
        throw new Error('Digest bulunamadı');
      }

      if (action === 'approve' || action === 'reject') {
        if (digest.status !== 'pending') {
          let errorMsg = '';
          if (digest.status === 'posted') {
            errorMsg = `❌ Bu digest zaten paylaşılmış!\n\n📅 Tarih: ${digest.digest_date}\n📊 Paylaşım: ${new Date(digest.posted_at).toLocaleString('tr-TR')}\n\n⚠️ Zaten paylaşılan bir digest üzerinde işlem yapamazsınız.`;
          } else if (digest.status === 'rejected') {
            errorMsg = `❌ Bu digest zaten reddedilmiş!\n\n📅 Tarih: ${digest.digest_date}\n\n⚠️ Reddedilen bir digest'i onaylayamazsınız.\n\n💡 Yeni bir digest oluşturmak için /linkedin komutunu kullanın.`;
          } else {
            errorMsg = `❌ Bu digest üzerinde işlem yapılamıyor!\n\n📊 Mevcut durum: ${digest.status}\n\n⚠️ Sadece "pending" durumundaki digest'ler onaylanabilir veya reddedilebilir.`;
          }

          await this.sendTelegramMessage(errorMsg);
          console.warn(`⚠️ Status validation failed: ${action} on ${digest.status} digest`);

          return {
            success: false,
            message: `Cannot ${action} a ${digest.status} digest (validation failed but callback acknowledged)`
          };
        }
      }

      const N8N_WEBHOOK_URL = process.env.N8N_LINKEDIN_WORKFLOW_WEBHOOK;

      if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N_LINKEDIN_WORKFLOW_WEBHOOK environment variable not configured. Please add it to Vercel.');
      }

      console.log(`📤 Forwarding LinkedIn digest callback to n8n: ${action}_${digestId} (status: ${digest.status})`);

      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query: callback_query,
          action: action,
          digest_id: digestId,
          chat_id: chatId,
          message_id: messageId,
          from_id: fromId,
          digest_status: digest.status
        })
      });

      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        throw new Error(`n8n webhook error (${n8nResponse.status}): ${errorText}`);
      }

      console.log('✅ Successfully forwarded to n8n workflow');

      return {
        success: true,
        message: 'Request forwarded to n8n workflow for processing'
      };

    } catch (error) {
      console.error('❌ Error forwarding to n8n:', error);
      await this.sendTelegramMessage(
        `❌ İşlem sırasında hata oluştu:\n\n<code>${error.message}</code>\n\nLütfen tekrar deneyin veya /help ile destek alın.`
      );
      return {
        success: false,
        message: `Error: ${error.message} (callback acknowledged)`
      };
    }
  }
}
