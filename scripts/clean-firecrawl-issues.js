/**
 * Clean articles based on Firecrawl analysis
 * Removes articles with Turkish content, wrong dates, and fixes titles
 */

import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanBasedOnFirecrawl() {
  console.log('🔍 Firecrawl analizine göre temizlik yapılıyor...\n');
  
  // Tüm haberleri çek
  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('id, title, content, date, source_url')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('❌ Hata:', error);
    return;
  }
  
  console.log(`📊 Toplam haber: ${data.length}\n`);
  
  const toDelete = [];
  const toFix = [];
  
  for (const article of data) {
    const issues = [];
    
    // 1. Yanlış tarih kontrolü (6930, 6891, 6859, 6849, 6802, 6800, 6798 gibi)
    if (article.date) {
      const year = parseInt(article.date.split('-')[0]);
      if (year > 2030 || year < 2020) {
        issues.push(`Yanlış tarih: ${article.date}`);
        toDelete.push(article.id);
        continue;
      }
    }
    
    // 2. Başlıkta Türkçe karakter kontrolü
    if (article.title) {
      const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/g;
      const titleTurkish = (article.title.match(turkishChars) || []).length;
      if (titleTurkish > 3) {
        issues.push(`Başlıkta ${titleTurkish} Türkçe karakter`);
        toDelete.push(article.id);
        continue;
      }
      
      // Başlıkta "– NuvemMag" temizleme
      if (article.title.includes('– NuvemMag') || article.title.includes('- NuvemMag')) {
        const cleanTitle = article.title.replace(/\s*[–—\-]\s*NuvemMag\s*$/i, '').trim();
        if (cleanTitle !== article.title) {
          toFix.push({ id: article.id, title: cleanTitle });
        }
      }
    }
    
    // 3. İçerikte Türkçe kontrolü (daha hassas)
    if (article.content) {
      const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/g;
      const contentTurkish = (article.content.match(turkishChars) || []).length;
      const totalChars = article.content.length;
      const turkishRatio = totalChars > 0 ? contentTurkish / totalChars : 0;
      
      // İlk 500 karakterde Türkçe kontrolü
      const preview = article.content.substring(0, 500);
      const previewTurkish = (preview.match(turkishChars) || []).length;
      
      // Türkçe kelime kontrolü
      const turkishPhrases = [
        'yapay zeka', 'teknoloji', 'haber', 'haberi', 'haberler',
        'tarafından', 'olarak', 'şekilde', 'durumda', 'halde',
        'için', 'göre', 'kadar', 'ile', 've', 'de', 'da', 'ki',
        'oldu', 'olduğu', 'yapıldı', 'yapılan', 'yapılacak',
        'açıkladı', 'duyurdu', 'söyledi', 'belirtti',
        'hollywood', 'süregelen', 'kesin bir sınır',
        'ailesi altındaki', 'en yeni', 'açık modellerini',
        'duyurarak', 'performansında', 'hız artışı',
        'vadeden', 'farklı boyutu', 'tanıttı'
      ];
      
      const contentLower = article.content.toLowerCase();
      let turkishPhraseCount = 0;
      for (const phrase of turkishPhrases) {
        if (contentLower.includes(phrase.toLowerCase())) {
          turkishPhraseCount++;
        }
      }
      
      // Çeviri hatası kontrolü
      const translationError = article.content.includes("I couldn't find the rest of the text") ||
                              article.content.includes('Please provide the complete text in Turkish');
      
      // Karar kriterleri
      if (contentTurkish > 30 ||                    // 30'dan fazla Türkçe karakter
          turkishRatio > 0.025 ||                  // %2.5'ten fazla Türkçe
          (previewTurkish > 15 && turkishRatio > 0.015) || // İlk 500'de çok Türkçe
          turkishPhraseCount > 5 ||                 // 5'ten fazla Türkçe ifade
          translationError) {                       // Çeviri hatası
        issues.push(`İçerikte Türkçe: ${contentTurkish} karakter (${(turkishRatio*100).toFixed(2)}%), ${turkishPhraseCount} ifade`);
        toDelete.push(article.id);
        continue;
      }
    }
    
    if (issues.length > 0 && !toDelete.includes(article.id)) {
      console.log(`⚠️  ${article.title?.substring(0, 60)}... - ${issues.join(', ')}`);
    }
  }
  
  // Başlık düzeltmeleri
  if (toFix.length > 0) {
    console.log(`\n🔧 ${toFix.length} başlık düzeltiliyor...`);
    for (const fix of toFix) {
      const { error: updateError } = await supabase
        .from('tech_news_articles')
        .update({ title: fix.title })
        .eq('id', fix.id);
      
      if (updateError) {
        console.error(`❌ Başlık düzeltme hatası (${fix.id}):`, updateError);
      }
    }
    console.log(`✅ ${toFix.length} başlık düzeltildi`);
  }
  
  // Silme işlemi
  const uniqueToDelete = [...new Set(toDelete)];
  console.log(`\n🗑️  ${uniqueToDelete.length} sorunlu haber siliniyor...`);
  
  if (uniqueToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('tech_news_articles')
      .delete()
      .in('id', uniqueToDelete);
    
    if (deleteError) {
      console.error('❌ Silme hatası:', deleteError);
    } else {
      console.log(`✅ ${uniqueToDelete.length} haber başarıyla silindi!`);
    }
  } else {
    console.log('✅ Silinecek sorunlu haber bulunamadı!');
  }
  
  console.log(`\n📊 Özet:`);
  console.log(`   🔧 Düzeltilen başlık: ${toFix.length}`);
  console.log(`   🗑️  Silinen haber: ${uniqueToDelete.length}`);
}

cleanBasedOnFirecrawl().catch(console.error);

