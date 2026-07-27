import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePageContext } from '../lib/context/PageContext';
import { PERSONAL_INFO } from '../lib/constants/personal';
import { SEO } from '../components/SEO';
import { LegalPageShell, LegalSection } from '../sections/LegalPageShell';
import { useI18n } from '../features/i18n';

/**
 * Privacy Policy — Ireland / GDPR / Data Protection Act 2018.
 * Transparent where required; protective on verification, LI balancing, and abuse of rights.
 * Not a substitute for advice from an Irish solicitor / DPO.
 */
function PrivacyPage() {
  const { setPageInfo } = usePageContext();
  const { t, lang } = useI18n();
  const lastUpdated = t({ en: '26 July 2026', tr: '26 Temmuz 2026' });
  const title = t({ en: 'Privacy Policy', tr: 'Gizlilik Politikası' });

  useEffect(() => {
    setPageInfo({
      path: '/privacy-policy',
      title,
      summary:
        lang === 'tr'
          ? 'Portfolyo için GDPR gizlilik bildirimi: chatbot depolama, işleyenler, meşru menfaatler ve İrlanda hukuku kapsamındaki haklar.'
          : 'GDPR privacy notice for the portfolio: chatbot storage, processors, legitimate interests, and rights under Irish law.',
      highlights:
        lang === 'tr'
          ? [
              'Sohbet kayıtları Supabase’te; Groq / n8n işleme açıklanır',
              'Meşru menfaatler ve hak talepleri kötüye kullanıma karşı korunur',
              'Dublin veri sorumlusu; İrlanda DPC denetim otoritesi',
            ]
          : [
              'Chat logs in Supabase; Groq / n8n processing disclosed',
              'Legitimate interests and rights-request procedures protected against abuse',
              'Dublin controller; Irish DPC as supervisory authority',
            ],
      lastUpdated,
    });

    return () => setPageInfo(null);
  }, [setPageInfo, lang, title, lastUpdated]);

  return (
    <>
      <SEO
        title={`${title} | Cem Koyluoglu`}
        description={
          lang === 'tr'
            ? 'Cem Köylüoğlu’nun İrlanda merkezli portfolyosu için Gizlilik Politikası: chatbot verisi, işleyenler, saklama ve GDPR hakları.'
            : "Privacy Policy for Cem Koyluoglu's Ireland-based portfolio: chatbot data, processors, retention, and GDPR rights."
        }
        ogTitle={`${title} | Cem Koyluoglu`}
        ogDescription={
          lang === 'tr'
            ? 'Sohbet, analitik ve işleyenlerin GDPR ve İrlanda hukuku kapsamında nasıl işlendiği.'
            : 'How chat, analytics, and processors are handled under GDPR and Irish law.'
        }
      />
      <LegalPageShell title={title} lastUpdated={lastUpdated}>
        {lang === 'tr' ? <PrivacyBodyTr /> : <PrivacyBodyEn />}
      </LegalPageShell>
    </>
  );
}

function PrivacyBodyEn() {
  return (
    <>
      <LegalSection number="01" title="Controller and scope">
        <p>
          This Privacy Policy explains how {PERSONAL_INFO.name} (&quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;), based in {PERSONAL_INFO.location}, processes personal data when you use
          this website and its features (the &quot;Site&quot;), including the portfolio chatbot.
        </p>
        <p>
          We are the <strong>data controller</strong> for the processing described here under
          Regulation (EU) 2016/679 (GDPR) and the Irish Data Protection Act 2018. Contact:{' '}
          <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a>.
        </p>
        <p>
          This notice describes our practices for the Site. It does not cover third-party sites you
          reach via links (GitHub, LinkedIn, WhatsApp, publishers, etc.), which have their own
          controllers and policies. Use of the Site is also subject to our{' '}
          <Link to="/terms">Terms &amp; Conditions</Link>.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Personal data we process">
        <p>
          <strong>Data you choose to provide</strong>
        </p>
        <ul>
          <li>
            <strong>Portfolio chatbot:</strong> message content you submit; assistant replies; and
            technical conversation metadata we store (for example session identifier, role, content,
            processing source, and timestamps) in our database so the feature can run, be secured,
            and be improved.
          </li>
          <li>
            <strong>Direct contact:</strong> content of emails or messages you send via listed
            channels (email, LinkedIn, GitHub, WhatsApp). Those platforms are separate controllers
            for their own processing.
          </li>
        </ul>
        <p>
          <strong>Data collected automatically</strong>
        </p>
        <ul>
          <li>Usage and performance signals via hosting / analytics tooling.</li>
          <li>
            Diagnostics when errors occur (for example error message, page URL, user-agent), via
            monitoring tools and/or our own error logs.
          </li>
          <li>
            Language preference in browser <code className="text-ink-90">localStorage</code>{' '}
            (<code className="text-ink-90">site-lang</code>).
          </li>
          <li>
            Standard technical data necessarily processed by hosting infrastructure (for example
            IP address in server or edge logs) for security and delivery.
          </li>
        </ul>
        <p>
          <strong>What we do not seek.</strong> Do not send special-category data (GDPR Art. 9),
          criminal-offence data (Art. 10), payment credentials, or secrets through the chatbot. If
          you submit such data anyway, you do so at your own risk; we may delete it when we become
          aware and are not obliged to use it for any purpose other than deletion / security.
        </p>
        <p>
          Tech-news articles and similar editorial content stored for the Site are not, by
          themselves, personal data about visitors.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Purposes of processing">
        <ul>
          <li>
            <strong>Provide and secure the Site</strong> — deliver pages, APIs, and the chatbot;
            prevent abuse, fraud, and attacks.
          </li>
          <li>
            <strong>Respond to you</strong> — when you contact us about work or collaboration.
          </li>
          <li>
            <strong>Operate and improve the chatbot</strong> — generate replies; review and evaluate
            conversations for quality, safety, relevance, and reliability of the portfolio
            assistant (including internal evaluation workflows). This is not a separate consumer
            &quot;AI training product&quot;; it is operation and improvement of this Site feature.
          </li>
          <li>
            <strong>Understand reliability</strong> — analytics and error monitoring in a
            proportionate manner.
          </li>
          <li>
            <strong>Comply with law</strong> — respond to binding legal requests; establish,
            exercise, or defend legal claims.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="04" title="Legal bases">
        <ul>
          <li>
            <strong>Legitimate interests</strong> (GDPR Art. 6(1)(f)): running a professional
            portfolio; operating, securing, and improving the chatbot; defending against abuse;
            limited analytics and error monitoring. We balance these interests against your rights
            and expect visitors to use optional features (such as chat) knowingly.
          </li>
          <li>
            <strong>Contract / pre-contractual steps</strong> (Art. 6(1)(b)), where applicable:
            handling inquiries you initiate about potential engagement.
          </li>
          <li>
            <strong>Legal obligation</strong> (Art. 6(1)(c)) when Irish or EU law requires
            processing.
          </li>
        </ul>
        <p>
          Where we rely on legitimate interests, you may object (Art. 21). We will stop the
          relevant processing unless we demonstrate compelling legitimate grounds that override
          your interests, rights, and freedoms, or the processing is needed for legal claims —
          except where your objection relates to direct marketing (which we do not operate on this
          Site).
        </p>
      </LegalSection>

      <LegalSection number="05" title="Automated decision-making">
        <p>
          We do not use the Site to make solely automated decisions that produce legal effects
          concerning you or similarly significantly affect you within the meaning of GDPR Art. 22.
          Chatbot replies are informational only and must not be treated as binding decisions
          about you.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Processors and international transfers">
        <p>
          We use service providers (processors or separate controllers, as applicable) to operate
          the Site. Categories include:
        </p>
        <ul>
          <li>
            <strong>Database / backend:</strong> Supabase — storage of chatbot history and related
            operational data.
          </li>
          <li>
            <strong>AI inference / automation:</strong> Groq (and, where configured, n8n) — to
            generate chatbot replies; message content is transmitted for that purpose.
          </li>
          <li>
            <strong>Hosting / edge:</strong> Vercel — site and serverless functions.
          </li>
          <li>
            <strong>Analytics:</strong> Vercel Analytics and Vercel Speed Insights.
          </li>
          <li>
            <strong>Error monitoring:</strong> Sentry (session replay is not enabled in our current
            configuration); we may also keep selected frontend error events in our own database.
          </li>
        </ul>
        <p>
          Where personal data is transferred outside the European Economic Area, we use appropriate
          safeguards required by GDPR Chapter V — typically the European Commission&apos;s Standard
          Contractual Clauses and the provider&apos;s supplementary measures / published terms —
          unless an adequacy decision applies.
        </p>
        <p>
          We implement appropriate technical and organisational measures (including HTTPS and
          access-controlled storage). No method of transmission or storage is perfectly secure; you
          use the Site at your own risk to that extent.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Retention">
        <ul>
          <li>
            <strong>Chat logs:</strong> kept while needed for the purposes above, with an intended
            internal review horizon of up to twelve (12) months, and deleted or anonymised sooner
            where we uphold a valid erasure request. Retention is managed by periodic review and on
            request; do not assume an always-on automated purge in every environment.
          </li>
          <li>
            <strong>Correspondence:</strong> typically up to two (2) years from last contact,
            longer if needed for legal claims or ongoing discussions.
          </li>
          <li>
            <strong>Security, analytics, and error logs:</strong> for periods required for
            operations, security investigation, and the relevant vendor defaults.
          </li>
          <li>
            <strong>Language preference:</strong> until you clear site data or change the setting.
          </li>
        </ul>
        <p>
          We may retain data longer where necessary to establish, exercise, or defend legal claims,
          or where Irish / EU law requires.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Your rights (and how we handle requests)">
        <p>
          Under GDPR you may have rights of access, rectification, erasure, restriction,
          portability, and objection, and the right to lodge a complaint with a supervisory
          authority. Those rights are subject to the conditions and exemptions in the GDPR and the
          Data Protection Act 2018.
        </p>
        <p>
          <strong>How to request:</strong> email{' '}
          <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a> with enough detail to
          locate your data (for chat: approximate dates, topics, or any session identifier you
          still have). We may request reasonable information to verify your identity before acting;
          we will not disclose personal data to an unverified requester.
        </p>
        <p>
          We aim to respond within one (1) month of a verified request, extendable by two further
          months for complex or numerous requests as permitted by Art. 12 GDPR. Under Art. 12(5),
          where requests are manifestly unfounded or excessive (including repetitive), we may
          charge a reasonable fee or refuse to act, and we will explain why.
        </p>
        <p>
          Erasure and objection rights are not absolute (for example where we must keep data for
          legal claims, security, or other overriding legitimate grounds). We will explain if we
          cannot fully comply.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Cookies and similar technologies">
        <p>
          We do not operate a marketing email list or a consent banner for non-essential marketing
          cookies on this Site. Essential technical storage is used for the Site to function. Your
          language preference is stored in <strong>localStorage</strong>, not as a first-party
          marketing cookie. Hosting, analytics, or monitoring providers may use cookies or similar
          technologies under their policies. You can clear site data and control cookies in your
          browser; some features may then stop working.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Children">
        <p>
          The Site is not directed at children under 16. We do not knowingly collect their personal
          data. If you believe we have, contact us and we will take appropriate steps, including
          deletion where required.
        </p>
      </LegalSection>

      <LegalSection number="11" title="No sale of personal data">
        <p>
          We do not sell your personal data. We do not share chatbot contents with third parties for
          their independent marketing. Sharing with processors is limited to operating, securing,
          and improving the Site as described above, or where law requires.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Changes">
        <p>
          We may update this Privacy Policy to reflect changes in the Site, processors, or law. The
          &quot;Last updated&quot; date will change when we do. Material changes will be indicated
          by updating this page; continued use after the effective date means you should review the
          revised notice. Historic versions are not guaranteed to remain online.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Complaints and contact">
        <ContactBlock
          related={
            <>
              Related: <Link to="/terms">Terms &amp; Conditions</Link>.
            </>
          }
          disclaimer="This notice is intended to meet transparency duties under GDPR while protecting our legitimate interests. It is not personalised legal advice. For specialised compliance questions, consult an Irish solicitor or qualified privacy professional."
        />
      </LegalSection>
    </>
  );
}

function PrivacyBodyTr() {
  return (
    <>
      <LegalSection number="01" title="Veri sorumlusu ve kapsam">
        <p>
          Bu Gizlilik Politikası, {PERSONAL_INFO.location} merkezli {PERSONAL_INFO.name}
          (&quot;biz&quot;, &quot;bize&quot; veya &quot;bizim&quot;) olarak, bu web sitesini ve
          özelliklerini (portfolyo chatbot’u dahil; &quot;Site&quot;) kullandığınızda kişisel
          verileri nasıl işlediğimizi açıklar.
        </p>
        <p>
          Burada açıklanan işleme için (AB) 2016/679 sayılı Tüzük (GDPR) ve İrlanda Data Protection
          Act 2018 kapsamında <strong>veri sorumlusuyuz</strong>. İletişim:{' '}
          <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a>.
        </p>
        <p>
          Bu bildirim yalnızca Site uygulamalarımızı kapsar. Bağlantılarla ulaştığınız üçüncü taraf
          siteleri (GitHub, LinkedIn, WhatsApp, yayıncılar vb.) kendi veri sorumlularına ve
          politikalarına tabidir. Site kullanımı ayrıca{' '}
          <Link to="/terms">Şartlar ve Koşullar</Link>’ımıza da tabidir.
        </p>
      </LegalSection>

      <LegalSection number="02" title="İşlediğimiz kişisel veriler">
        <p>
          <strong>Sizin sağladığınız veriler</strong>
        </p>
        <ul>
          <li>
            <strong>Portfolyo chatbot’u:</strong> gönderdiğiniz mesaj içeriği; asistan yanıtları; ve
            özelliğin çalışması, güvenliği ve iyileştirilmesi için veritabanında sakladığımız teknik
            konuşma meta verileri (ör. oturum kimliği, rol, içerik, işleme kaynağı ve zaman
            damgaları).
          </li>
          <li>
            <strong>Doğrudan iletişim:</strong> listelenen kanallar (e-posta, LinkedIn, GitHub,
            WhatsApp) üzerinden gönderdiğiniz e-posta veya mesaj içerikleri. Bu platformlar kendi
            işlemeleri için ayrı veri sorumlularıdır.
          </li>
        </ul>
        <p>
          <strong>Otomatik toplanan veriler</strong>
        </p>
        <ul>
          <li>Barındırma / analitik araçları üzerinden kullanım ve performans sinyalleri.</li>
          <li>
            Hata oluştuğunda tanılama bilgileri (ör. hata mesajı, sayfa URL’si, user-agent);
            izleme araçları ve/veya kendi hata kayıtlarımız üzerinden.
          </li>
          <li>
            Tarayıcı <code className="text-ink-90">localStorage</code> içinde dil tercihi (
            <code className="text-ink-90">site-lang</code>).
          </li>
          <li>
            Barındırma altyapısının güvenlik ve teslimat için zorunlu işlediği standart teknik
            veriler (ör. sunucu veya edge günlüklerinde IP adresi).
          </li>
        </ul>
        <p>
          <strong>Aramadığımız veriler.</strong> Chatbot üzerinden özel nitelikli veri (GDPR md. 9),
          suç verisi (md. 10), ödeme bilgileri veya sırlar göndermeyin. Yine de gönderirseniz risk
          size aittir; fark ettiğimizde silebiliriz ve silme / güvenlik dışında bir amaçla
          kullanmak zorunda değiliz.
        </p>
        <p>
          Site için saklanan teknoloji haberleri ve benzeri editoryal içerik, tek başına ziyaretçiler
          hakkında kişisel veri değildir.
        </p>
      </LegalSection>

      <LegalSection number="03" title="İşleme amaçları">
        <ul>
          <li>
            <strong>Siteyi sağlamak ve güvence altına almak</strong> — sayfaları, API’leri ve
            chatbot’u sunmak; kötüye kullanım, dolandırıcılık ve saldırıları önlemek.
          </li>
          <li>
            <strong>Size yanıt vermek</strong> — iş veya işbirliği hakkında bizimle iletişime
            geçtiğinizde.
          </li>
          <li>
            <strong>Chatbot’u işletmek ve iyileştirmek</strong> — yanıt üretmek; kalite, güvenlik,
            uygunluk ve güvenilirlik için konuşmaları gözden geçirmek (iç değerlendirme iş akışları
            dahil). Bu ayrı bir tüketici &quot;AI eğitim ürünü&quot; değildir; Site özelliğinin
            işletilmesi ve iyileştirilmesidir.
          </li>
          <li>
            <strong>Güvenilirliği anlamak</strong> — orantılı analitik ve hata izleme.
          </li>
          <li>
            <strong>Hukuka uymak</strong> — bağlayıcı yasal taleplere yanıt vermek; hukuki
            talepleri tesis etmek, kullanmak veya savunmak.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="04" title="Hukuki dayanaklar">
        <ul>
          <li>
            <strong>Meşru menfaatler</strong> (GDPR md. 6(1)(f)): profesyonel portfolyo yürütmek;
            chatbot’u işletmek, güvence altına almak ve iyileştirmek; kötüye kullanıma karşı koruma;
            sınırlı analitik ve hata izleme. Bu menfaatleri haklarınızla dengeleriz; ziyaretçilerin
            isteğe bağlı özellikleri (sohbet gibi) bilerek kullanmasını bekleriz.
          </li>
          <li>
            <strong>Sözleşme / sözleşme öncesi adımlar</strong> (md. 6(1)(b)), uygulanabilir
            olduğunda: olası bir iş ilişkisi hakkında başlattığınız taleplerin ele alınması.
          </li>
          <li>
            <strong>Yasal yükümlülük</strong> (md. 6(1)(c)): İrlanda veya AB hukuku işlemeyi
            gerektirdiğinde.
          </li>
        </ul>
        <p>
          Meşru menfaatlere dayandığımızda itiraz edebilirsiniz (md. 21). İlgili işlemeyi
          durdururuz; ancak menfaatlerinizi, haklarınızı ve özgürlüklerinizi aşan zorlayıcı meşru
          gerekçeler gösterirsek veya işleme hukuki talepler için gerekliyse devam edebiliriz —
          doğrudan pazarlama itirazı hariç (bu Sitede doğrudan pazarlama yapmıyoruz).
        </p>
      </LegalSection>

      <LegalSection number="05" title="Otomatik karar alma">
        <p>
          Siteyi, GDPR md. 22 anlamında sizi hukuken etkileyen veya benzer şekilde önemli ölçüde
          etkileyen yalnızca otomatik kararlar almak için kullanmıyoruz. Chatbot yanıtları yalnızca
          bilgilendirme amaçlıdır ve sizin hakkınızda bağlayıcı karar sayılmamalıdır.
        </p>
      </LegalSection>

      <LegalSection number="06" title="İşleyenler ve uluslararası aktarımlar">
        <p>
          Siteyi işletmek için hizmet sağlayıcılar (işleyen veya ayrı veri sorumlusu, duruma göre)
          kullanırız. Kategoriler:
        </p>
        <ul>
          <li>
            <strong>Veritabanı / backend:</strong> Supabase — chatbot geçmişi ve ilgili operasyonel
            verilerin saklanması.
          </li>
          <li>
            <strong>AI çıkarım / otomasyon:</strong> Groq (ve yapılandırılmışsa n8n) — chatbot
            yanıtları üretmek; mesaj içeriği bu amaçla iletilir.
          </li>
          <li>
            <strong>Barındırma / edge:</strong> Vercel — site ve sunucusuz işlevler.
          </li>
          <li>
            <strong>Analitik:</strong> Vercel Analytics ve Vercel Speed Insights.
          </li>
          <li>
            <strong>Hata izleme:</strong> Sentry (mevcut yapılandırmada oturum yeniden oynatma
            kapalıdır); seçili ön yüz hata olaylarını kendi veritabanımızda da tutabiliriz.
          </li>
        </ul>
        <p>
          Kişisel veriler Avrupa Ekonomik Alanı dışına aktarıldığında, GDPR V. Bölüm’ün gerektirdiği
          uygun güvenceleri kullanırız — tipik olarak Avrupa Komisyonu Standart Sözleşme Maddeleri
          ve sağlayıcının ek önlemleri / yayımlanmış şartları — yeterlilik kararı uygulanmıyorsa.
        </p>
        <p>
          Uygun teknik ve organizasyonel önlemler uygularız (HTTPS ve erişim kontrollü depolama
          dahil). Hiçbir iletim veya saklama yöntemi kusursuz güvenli değildir; Siteyi bu ölçüde
          kendi riskinizle kullanırsınız.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Saklama">
        <ul>
          <li>
            <strong>Sohbet kayıtları:</strong> yukarıdaki amaçlar için gerektiği sürece tutulur;
            amaçlanan iç inceleme ufku on iki (12) aya kadardır; geçerli bir silme talebini kabul
            ettiğimizde daha erken silinir veya anonimleştirilir. Saklama periyodik inceleme ve talep
            üzerine yönetilir; her ortamda sürekli otomatik silme varsaymayın.
          </li>
          <li>
            <strong>Yazışmalar:</strong> tipik olarak son temastan itibaren iki (2) yıla kadar;
            hukuki talepler veya süren görüşmeler için daha uzun olabilir.
          </li>
          <li>
            <strong>Güvenlik, analitik ve hata günlükleri:</strong> operasyon, güvenlik soruşturması
            ve ilgili sağlayıcı varsayılanlarının gerektirdiği süreler boyunca.
          </li>
          <li>
            <strong>Dil tercihi:</strong> site verilerini temizleyene veya ayarı değiştirene kadar.
          </li>
        </ul>
        <p>
          Hukuki talepleri tesis etmek, kullanmak veya savunmak için ya da İrlanda / AB hukuku
          gerektirdiğinde verileri daha uzun saklayabiliriz.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Haklarınız (ve talepleri nasıl ele alırız)">
        <p>
          GDPR kapsamında erişim, düzeltme, silme, kısıtlama, taşınabilirlik ve itiraz haklarınız ile
          bir denetim otoritesine şikâyet hakkı bulunabilir. Bu haklar GDPR ve Data Protection Act
          2018’deki koşullara ve istisnalara tabidir.
        </p>
        <p>
          <strong>Nasıl talep edilir:</strong>{' '}
          <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a> adresine, verinizi
          bulmaya yetecek ayrıntıyla yazın (sohbet için: yaklaşık tarihler, konular veya hâlâ
          elinizde olan oturum kimliği). Harekete geçmeden önce kimliğinizi doğrulamak için makul
          bilgi isteyebiliriz; doğrulanmamış talepte kişisel veri açıklamayız.
        </p>
        <p>
          Doğrulanmış talebe bir (1) ay içinde yanıt vermeyi hedefleriz; karmaşık veya çok sayıda
          talepte GDPR md. 12 uyarınca iki ay daha uzatılabilir. Md. 12(5) uyarınca açıkça temelsiz
          veya aşırı (tekrarlayan dahil) taleplerde makul ücret alabilir veya işlemeyi
          reddedebiliriz; gerekçeyi açıklarız.
        </p>
        <p>
          Silme ve itiraz hakları mutlak değildir (ör. hukuki talepler, güvenlik veya üstün meşru
          gerekçeler için veri tutmamız gerektiğinde). Tamamen yerine getiremiyorsak açıklarız.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Çerezler ve benzer teknolojiler">
        <p>
          Bu Sitede pazarlama e-posta listesi veya zorunlu olmayan pazarlama çerezleri için onay
          banner’ı işletmiyoruz. Site’nin çalışması için gerekli teknik depolama kullanılır. Dil
          tercihiniz birinci taraf pazarlama çerezi olarak değil, <strong>localStorage</strong>{' '}
          içinde saklanır. Barındırma, analitik veya izleme sağlayıcıları kendi politikaları
          kapsamında çerez veya benzer teknolojiler kullanabilir. Tarayıcınızda site verilerini
          temizleyebilir ve çerezleri kontrol edebilirsiniz; bazı özellikler çalışmayı
          bırakabilir.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Çocuklar">
        <p>
          Site 16 yaş altı çocuklara yönelik değildir. Bilerek onların kişisel verilerini
          toplamayız. Topladığımıza inanıyorsanız bize yazın; gerekli silme dahil uygun adımları
          atarız.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Kişisel verilerin satılmaması">
        <p>
          Kişisel verilerinizi satmayız. Chatbot içeriklerini üçüncü taraflarla bağımsız pazarlama
          için paylaşmayız. İşleyenlerle paylaşım, yukarıda açıklandığı gibi Site’yi işletmek,
          güvence altına almak ve iyileştirmekle veya hukukun gerektirdiği hallerle sınırlıdır.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Değişiklikler">
        <p>
          Site, işleyenler veya hukuktaki değişiklikleri yansıtmak için bu Gizlilik Politikasını
          güncelleyebiliriz. Yaptığımızda &quot;Son güncelleme&quot; tarihi değişir. Önemli
          değişiklikler bu sayfanın güncellenmesiyle gösterilir; yürürlük tarihinden sonra kullanıma
          devam, gözden geçirilmiş bildirimi okumanız gerektiği anlamına gelir. Eski sürümlerin
          çevrimiçi kalması garanti edilmez.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Şikâyetler ve iletişim">
        <ContactBlock
          controllerLabel="Veri sorumlusu"
          emailLabel="E-posta"
          locationLabel="Konum"
          related={
            <>
              İlgili: <Link to="/terms">Şartlar ve Koşullar</Link>.
            </>
          }
          complaint={
            <>
              İrlanda Veri Koruma Komisyonu’na (DPC) şikâyette bulunabilirsiniz:{' '}
              <a href="https://www.dataprotection.ie" target="_blank" rel="noopener noreferrer">
                www.dataprotection.ie
              </a>
              . Önce bizimle iletişime geçmenizi öneririz; konuyu çözmeye çalışabiliriz.
            </>
          }
          disclaimer="Bu bildirim, meşru menfaatlerimizi korurken GDPR şeffaflık yükümlülüklerini karşılamak içindir. Kişiselleştirilmiş hukuki tavsiye değildir. Uzman uyum soruları için İrlandalı bir avukata veya nitelikli gizlilik uzmanına danışın."
        />
      </LegalSection>
    </>
  );
}

function ContactBlock({
  controllerLabel = 'Controller',
  emailLabel = 'Email',
  locationLabel = 'Location',
  related,
  complaint,
  disclaimer,
}: {
  controllerLabel?: string;
  emailLabel?: string;
  locationLabel?: string;
  related: ReactNode;
  complaint?: ReactNode;
  disclaimer: string;
}) {
  return (
    <>
      <p>
        <strong>
          {controllerLabel}: {PERSONAL_INFO.name}
        </strong>
        <br />
        {emailLabel}:{' '}
        <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a>
        <br />
        {locationLabel}: {PERSONAL_INFO.location}
      </p>
      {complaint ?? (
        <p>
          You may lodge a complaint with the Irish Data Protection Commission (DPC):{' '}
          <a href="https://www.dataprotection.ie" target="_blank" rel="noopener noreferrer">
            www.dataprotection.ie
          </a>
          . We encourage you to contact us first so we can try to resolve the matter.
        </p>
      )}
      <p>{related}</p>
      <p className="text-ink-42 text-[13px]">{disclaimer}</p>
    </>
  );
}

export default PrivacyPage;
