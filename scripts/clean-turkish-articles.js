/**
 * Clean Turkish Content from Database
 * Removes articles with Turkish content that should have been translated
 */

import { supabase } from './lib/supabaseAdmin.js';

async function cleanTurkishArticles() {
  console.log('🔍 TÜM VERİTABANINDA Türkçe içerik kontrolü...\n');
  
  // Tüm haberleri çek (veya belirli tarih aralığı)
  const { data, error } = await supabase
    .from('tech_news_articles')
    .select('id, title, content, date, source_url')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('❌ Hata:', error);
    return;
  }
  
  console.log(`📊 Kontrol edilen haber sayısı: ${data.length}\n`);
  
  const turkishArticles = [];
  
  // Türkçe kelime listesi
  const turkishWords = [
    've', 'ile', 'için', 'bu', 'şu', 'o', 'bir', 'iki', 'üç', 'dört', 'beş',
    'var', 'yok', 'oldu', 'olduğu', 'yapıldı', 'yapılan', 'yapılacak',
    'tarafından', 'göre', 'kadar', 'sonra', 'önce', 'içinde', 'dışında',
    'üzerinde', 'altında', 'arasında', 'veya', 'ya da',
    'ancak', 'fakat', 'ama', 'çünkü', 'zira', 'ki', 'de', 'da', 'mi', 'mı', 'mu', 'mü',
    'yapay', 'zeka', 'teknoloji', 'haber', 'haberi', 'haberler', 'haberleri',
    'türk', 'türkiye', 'türkçe', 'türkler',
    'olarak', 'şekilde', 'durumda', 'halde', 'gibi', 'daha', 'en',
    'çok', 'az', 'fazla', 'biraz', 'pek', 'oldukça',
    'hakkında', 'ile ilgili', 'konusunda', 'üzerine',
    'yapıyor', 'yapıldı', 'yapılacak', 'yapılmış', 'yapılıyor',
    'oldu', 'olacak', 'olmuş', 'oluyor', 'olur',
    'geldi', 'gelecek', 'gelmiş', 'geliyor', 'gelir',
    'gitti', 'gidecek', 'gitmiş', 'gidiyor', 'gider',
    'söyledi', 'söyleyecek', 'söylemiş', 'söylüyor',
    'açıkladı', 'açıklayacak', 'açıklamış', 'açıklıyor',
    'duyurdu', 'duyuracak', 'duyurmuş', 'duyuruyor'
  ];
  
  for (const article of data) {
    if (!article.content || article.content.length < 100) continue;
    
    const content = article.content;
    const contentLower = content.toLowerCase();
    
    // 1. Türkçe karakter sayısı
    const turkishChars = /[ğüşıöçĞÜŞİÖÇ]/g;
    const turkishCharCount = (content.match(turkishChars) || []).length;
    const totalChars = content.length;
    const turkishCharRatio = totalChars > 0 ? turkishCharCount / totalChars : 0;
    
    // 2. Türkçe kelime sayısı
    let turkishWordCount = 0;
    for (const word of turkishWords) {
      // Basit kelime arama (regex yerine)
      const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = contentLower.match(wordRegex);
      if (matches) turkishWordCount += matches.length;
    }
    
    // 3. Türkçe cümle yapıları
    const turkishPatterns = [
      /\b(ve|ile|için|bu|şu|o|bir|iki|üç|dört|beş)\b/gi,
      /\b(var|yok|oldu|olduğu|yapıldı|yapılan)\b/gi,
      /\b(tarafından|göre|kadar|sonra|önce)\b/gi,
      /\b(olarak|şekilde|durumda|halde|gibi)\b/gi,
      /\b(yapay|zeka|teknoloji|haber)\b/gi
    ];
    
    let patternMatches = 0;
    for (const pattern of turkishPatterns) {
      const matches = content.match(pattern);
      if (matches) patternMatches += matches.length;
    }
    
    // 4. Karar kriterleri (daha hassas - 18 Aralık için özel)
    // İçeriğin ilk 500 karakterinde Türkçe kontrolü
    const preview = content.substring(0, 500);
    const previewTurkishChars = (preview.match(turkishChars) || []).length;
    const previewRatio = preview.length > 0 ? previewTurkishChars / preview.length : 0;
    
    const isTurkish = 
      turkishCharRatio > 0.015 ||          // %1.5'ten fazla Türkçe karakter
      turkishWordCount > 12 ||              // 12'den fazla Türkçe kelime
      (turkishCharCount > 15 && patternMatches > 8) || // Hem karakter hem pattern
      (turkishCharCount > 30) ||            // 30'dan fazla Türkçe karakter
      (previewRatio > 0.02 && turkishCharCount > 20); // İlk 500 karakterde %2+ Türkçe
    
    if (isTurkish) {
      const preview = content.substring(0, 200).replace(/\n/g, ' ');
      
      turkishArticles.push({
        id: article.id,
        title: article.title?.substring(0, 60),
        date: article.date,
        turkishCharCount,
        turkishCharRatio: (turkishCharRatio * 100).toFixed(2) + '%',
        turkishWordCount,
        patternMatches,
        preview: preview.substring(0, 100) + '...',
        source_url: article.source_url
      });
    }
  }
  
  console.log(`❌ Türkçe içerikli haber sayısı: ${turkishArticles.length}\n`);
  
  if (turkishArticles.length > 0) {
    console.log('📋 Türkçe İçerikli Haberler:');
    turkishArticles.forEach((a, i) => {
      console.log(`\n${i+1}. ID: ${a.id}`);
      console.log(`   Tarih: ${a.date}`);
      console.log(`   Başlık: ${a.title}...`);
      console.log(`   Türkçe karakter: ${a.turkishCharCount} (${a.turkishCharRatio})`);
      console.log(`   Türkçe kelime: ${a.turkishWordCount}`);
      console.log(`   Pattern eşleşme: ${a.patternMatches}`);
      console.log(`   Önizleme: ${a.preview}`);
    });
    
    // Silme işlemi
    const idsToDelete = turkishArticles.map(a => a.id);
    console.log(`\n🗑️  ${idsToDelete.length} Türkçe içerikli haber siliniyor...`);
    
    const { error: deleteError } = await supabase
      .from('tech_news_articles')
      .delete()
      .in('id', idsToDelete);
    
    if (deleteError) {
      console.error('❌ Silme hatası:', deleteError);
    } else {
      console.log(`✅ ${idsToDelete.length} haber başarıyla silindi!`);
    }
  } else {
    console.log('✅ Türkçe içerikli haber bulunamadı!');
  }
}

cleanTurkishArticles().catch(console.error);

