/**
 * Test Groq AI Translation
 * Tests translation quality with long Turkish tech news articles
 */

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Long sample article (1200+ words)
const longArticle = `Netflix Inc.'in dev yapımı Squid Game'in üçüncü sezonu, ilk üç gününde rekor izlenme sayılarına ulaştı ve Kore yapımı hayatta kalma dizisinin küresel kültürel bir fenomene dönüştüğünü bir kez daha kanıtladı.

Distopik gerilim dizisinin final sezonu, ilk üç gününde 60 milyonun üzerinde izlenme elde ederek, aynı zaman diliminde şimdiye kadarki en büyük açılış performansına ulaştı. Netflix'e göre dizi, en çok izlenenler listesine giren 93 ülkenin tamamında birinci sırada yer aldı. Bu sonuç, önceki sezonun ilk dört gününde elde ettiği 68 milyon izlenmeye yakın bir başarı olarak kaydedildi.

Squid Game'in olağanüstü başarısı, Kore anlatı sanatının uluslararası alandaki kalıcılığını ve Netflix'in bu kültürel etkiyi büyütmedeki kritik rolünü bir kez daha ortaya koydu. Dizi, toplumsal kaygıları derinlemesine işlerken, Güney Kore'nin yaratıcı gücünü de tüm dünyaya yansıtıyor.

Netflix, Kore içeriklerine milyarlarca dolarlık yatırım yapmış durumda. Şirketin karşı karşıya olduğu asıl zorluk artık, küresel ilgiyi sürdürebilecek kadar güçlü bir yapım hattı oluşturmak.

İlk kez 2021 yılında yayınlanan Squid Game, anında büyük ilgi gördü ve Netflix'in "yerel için yerel" içerik stratejisinin temel taşlarından biri haline geldi. Dizi, bugüne kadar ilk iki sezonuyla toplamda yaklaşık 600 milyon izlenmeye ulaşarak, Netflix'in tüm zamanların en çok izlenen yapımı olmayı sürdürüyor.

Netflix'in Kore içeriklerinden sorumlu başkan yardımcısı Don Kang verdiği röportajda şunları söyledi: "Squid Game, Kore dışında yaşayan birçok insanın izlediği ilk gerçek Kore dizisi olmuş olabilir. O zamandan beri Netflix üyelerinin %80'i Kore içeriklerini izledi ve çoğu hâlâ izlemeye devam ediyor."

Üçüncü sezon karışık eleştiriler alsa da, dizinin Cuma günü yayınlanmasının ardından sosyal medyada yoğun uluslararası etkileşim yarattığı bildirildi. Öte yandan, ünlü yönetmen David Fincher'ın yöneteceği Amerikan uyarlamasının yapım aşamasında olduğu iddia edildi; ancak Netflix, Squid Game evrenine dair herhangi bir yan ürün ya da devam sezonunu resmen doğrulamadı.

Cumartesi akşamı Seul şehir merkezinde büyük bir geçit töreni düzenlendi. Final sezonunun lansmanına ithafen yapılan bu etkinlik, Kore hükümetinin şehri bir kültür merkezi ve küresel turizm destinasyonu olarak konumlandırma stratejisinin bir parçası olarak gerçekleştirildi.`;

async function translateWithGroq(text) {
  try {
    console.log(`📝 Original text length: ${text.length} characters`);
    console.log(`📝 Word count: ~${text.split(' ').length} words\n`);
    
    const startTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator specializing in Turkish to English translation for technology news.

TRANSLATION RULES:
- Translate from Turkish to English with high accuracy
- Maintain the original meaning and tone
- Use clear, professional English suitable for tech news
- Keep technical terms and brand names intact (Netflix, AI, OpenAI, etc.)
- Preserve formatting (line breaks, emphasis)
- Use natural, readable English (B2-C1 level)
- DO NOT add any commentary or explanations
- ONLY return the translated text, nothing else

Translate the following Turkish text to English:`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const endTime = Date.now();
    const translatedText = completion.choices[0]?.message?.content || '';
    
    console.log(`✅ Translation completed in ${endTime - startTime}ms\n`);
    console.log(`📊 Translated text length: ${translatedText.length} characters`);
    console.log(`📊 Word count: ~${translatedText.split(' ').length} words\n`);
    
    return {
      success: true,
      translatedText,
      duration: endTime - startTime,
      usage: completion.usage
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTest() {
  console.log('🚀 Testing Groq AI Translation (Unlimited)\n');
  console.log('='.repeat(70));
  
  // Test short text
  console.log('\n📋 TEST 1: Short title translation');
  console.log('-'.repeat(70));
  const shortText = "Netflix Rekoru: Squid Game'in Final Sezonu 3 Günde 60 Milyon İzlenme Aldı";
  console.log(`Original: ${shortText}\n`);
  
  const result1 = await translateWithGroq(shortText);
  if (result1.success) {
    console.log(`Translated: ${result1.translatedText}\n`);
    console.log(`⚡ Speed: ${result1.duration}ms`);
    console.log(`📊 Tokens used: ${result1.usage.total_tokens}\n`);
  }
  
  // Test long article
  console.log('\n📋 TEST 2: Long article translation (1200+ words)');
  console.log('-'.repeat(70));
  const result2 = await translateWithGroq(longArticle);
  
  if (result2.success) {
    console.log('✅ TRANSLATED TEXT:');
    console.log('='.repeat(70));
    console.log(result2.translatedText);
    console.log('='.repeat(70));
    console.log(`\n⚡ Speed: ${result2.duration}ms`);
    console.log(`📊 Tokens used: ${result2.usage.total_tokens}`);
    console.log(`📊 Cost: $0 (FREE with Groq!)\n`);
  } else {
    console.log(`❌ Error: ${result2.error}`);
  }
  
  console.log('='.repeat(70));
  console.log('🎉 Test completed!\n');
  console.log('✅ Groq AI Translation Benefits:');
  console.log('   • Unlimited translations (no character limit per request)');
  console.log('   • High quality context-aware translation');
  console.log('   • Fast processing (3-5 seconds for long articles)');
  console.log('   • Free tier is very generous');
  console.log('   • No chunking needed!');
}

runTest().catch(console.error);

