import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { usePageContext } from '../lib/context/PageContext';
import { PERSONAL_INFO } from '../lib/constants/personal';
import { SEO } from '../components/SEO';
import { LegalPageShell, LegalSection } from '../sections/LegalPageShell';
import { useI18n } from '../features/i18n';

/**
 * Terms & Conditions — protective Ireland / EU commercial terms for the portfolio.
 * Not a substitute for advice from an Irish solicitor.
 * Turkish is a courtesy translation; English prevails on conflict (see §15).
 */
function TermsPage() {
  const { setPageInfo } = usePageContext();
  const { t, lang } = useI18n();
  const lastUpdated = t({ en: '26 July 2026', tr: '26 Temmuz 2026' });
  const title = t({ en: 'Terms & Conditions', tr: 'Şartlar ve Koşullar' });

  useEffect(() => {
    setPageInfo({
      path: '/terms',
      title,
      summary:
        lang === 'tr'
          ? 'Portfolyo sitesi, teknoloji haberleri ve AI chatbot için İrlanda hukukuna tabi bağlayıcı şartlar; güçlü sorumluluk ve fikri mülkiyet korumaları.'
          : 'Binding Ireland-governed terms for the portfolio site, tech news, and AI chatbot, with strong liability and IP protections.',
      highlights:
        lang === 'tr'
          ? [
              'Yalnızca bilgilendirme amaçlı portfolyo — garanti veya mesleki tavsiye yok',
              'Sıkı chatbot / kabul edilebilir kullanım kuralları ve kullanıcı tazmini',
              'İrlanda hukuku, Dublin mahkemeleri, yasaların izin verdiği ölçüde sınırlı sorumluluk',
            ]
          : [
              'Informational portfolio only — no warranties or professional advice',
              'Strict chatbot / acceptable-use rules and user indemnities',
              'Irish law, Dublin courts, capped liability to the fullest extent permitted',
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
            ? 'Cem Köylüoğlu portfolyosu için İrlanda hukukuna tabi bağlayıcı şartlar: fikri mülkiyet, chatbot kullanımı, feragatler ve sorumluluk sınırları.'
            : "Binding terms for Cem Koyluoglu's portfolio under Irish law: IP, chatbot use, disclaimers, and liability limits."
        }
        ogTitle={`${title} | Cem Koyluoglu`}
        ogDescription={
          lang === 'tr'
            ? 'Güçlü fikri mülkiyet ve sorumluluk korumalarıyla İrlanda hukukuna tabi site şartları.'
            : 'Ireland-governed site terms with strong IP and liability protections.'
        }
      />
      <LegalPageShell title={title} lastUpdated={lastUpdated}>
        {lang === 'tr' ? <TermsBodyTr /> : <TermsBodyEn />}
      </LegalPageShell>
    </>
  );
}

function TermsBodyEn() {
  return (
    <>
      <LegalSection number="01" title="Agreement and parties">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) form a binding agreement between you
          (&quot;you&quot; or &quot;user&quot;) and {PERSONAL_INFO.name}, a natural person operating
          from {PERSONAL_INFO.location} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
          concerning access to and use of this website, its content, APIs exposed for the site, and
          the portfolio chatbot (together, the &quot;Site&quot;).
        </p>
        <p>
          By accessing, browsing, or using the Site, you accept these Terms. If you do not agree,
          you must stop using the Site immediately. Personal data is governed by our{' '}
          <Link to="/privacy-policy">Privacy Policy</Link>, which forms part of this agreement by
          reference to the extent permitted by law.
        </p>
        <p>
          Nothing in these Terms creates a partnership, joint venture, employment, or agency
          relationship between you and us.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Nature of the Site (informational only)">
        <p>
          The Site is a personal professional portfolio and demonstration environment. It may
          include project descriptions, publications, tech-news pages, status indicators, and an
          AI-assisted chatbot. Unless we expressly agree otherwise in a signed written contract:
        </p>
        <ul>
          <li>
            Content is provided for general information and self-promotion only and does not
            constitute legal, financial, medical, immigration, tax, security, or other professional
            advice.
          </li>
          <li>
            Nothing on the Site is an offer of employment, an offer capable of acceptance forming a
            services contract, a guarantee of availability, pricing, or results, or a commitment to
            enter any engagement.
          </li>
          <li>
            Availability badges, response-time statements, and similar indicators are indicative
            only and may be inaccurate or outdated.
          </li>
          <li>
            Any future professional engagement is subject to separate written terms (and, if
            relevant, a statement of work) that supersede marketing or portfolio statements.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="03" title="Eligibility and capacity">
        <p>
          You represent that you have legal capacity to enter these Terms. If you use the Site on
          behalf of an organisation, you represent that you are authorised to bind that
          organisation, and &quot;you&quot; includes that organisation. The Site is not directed at
          children under 16.
        </p>
      </LegalSection>

      <LegalSection number="04" title="Acceptable use and prohibited conduct">
        <p>You must use the Site lawfully and only for legitimate purposes. You must not:</p>
        <ul>
          <li>
            Interfere with, overload, probe, scan, or attempt unauthorised access to the Site,
            accounts, APIs, or related infrastructure.
          </li>
          <li>
            Scrape, harvest, mirror, or systematically extract content or data except as allowed by
            ordinary browser use or written permission; automated access that harms availability or
            circumvents rate limits is forbidden.
          </li>
          <li>
            Reverse engineer, decompile, or attempt to derive source code from the Site except
            where mandatory law expressly permits.
          </li>
          <li>
            Upload or transmit malware, or use the Site to distribute spam, phishing, or unlawful
            content.
          </li>
          <li>
            Misrepresent your identity or affiliation, or use the Site to harass, defame, or
            infringe others&apos; rights.
          </li>
          <li>
            Use the chatbot to generate or solicit illegal, harmful, fraudulent, or abusive
            content, or to attempt prompt injection, jailbreaks, or extraction of system prompts /
            secrets.
          </li>
          <li>
            Submit passwords, payment card data, government ID numbers, special-category data
            (health, biometric, etc.), or confidential third-party information into the chatbot or
            public forms of contact via the Site.
          </li>
        </ul>
        <p>
          We may suspend, throttle, block, or terminate access (including by IP, session, or other
          technical means) where we reasonably believe these Terms or applicable law have been
          breached, or where needed to protect the Site, us, or others. We have no obligation to
          provide prior notice where doing so would be impractical or unsafe.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Portfolio chatbot and AI output">
        <p>
          The chatbot is an optional convenience feature for questions about our portfolio and
          background. It is not a decision-making system that produces legal effects concerning
          you. By using it you acknowledge and agree that:
        </p>
        <ul>
          <li>
            Outputs are generated by probabilistic models (including third-party inference such as
            Groq and, where configured, automation such as n8n) and may be incomplete, outdated,
            biased, or wrong.
          </li>
          <li>
            You must independently verify any information before relying on it for decisions of
            any kind.
          </li>
          <li>
            Chatbot output is not advice, not a representation or warranty, and not a substitute
            for speaking with us directly or obtaining your own professional advice.
          </li>
          <li>
            Message content may be transmitted to processors and stored as described in the{' '}
            <Link to="/privacy-policy">Privacy Policy</Link>. Do not submit confidential or
            sensitive information.
          </li>
          <li>
            We may log, review, rate-limit, refuse, or delete conversations to operate, secure, and
            improve the feature, and to investigate abuse.
          </li>
          <li>
            To the extent you submit text to the chatbot, you grant us a worldwide, non-exclusive,
            royalty-free licence to host, process, reproduce, and use that text solely to provide,
            secure, and improve the Site and chatbot, and to comply with law. You represent that
            you have the rights needed to submit that text.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="06" title="Tech news and third-party material">
        <p>
          Tech-news pages may include material produced or assisted by automated tooling
          (including translation). Titles, summaries, and related presentation may contain errors
          or omissions. We do not warrant accuracy, completeness, or fitness for any purpose.
          Where third-party publications or products are mentioned or linked (including academic
          publishers such as Springer Nature), those rights remain with their owners; links are
          for reference only and are not endorsements.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Intellectual property">
        <p>
          Except for third-party materials clearly attributed or linked, all rights, title, and
          interest in the Site — including text, design, layout, graphics, logos, selection and
          arrangement, original code, and branding — are owned by {PERSONAL_INFO.name} or our
          licensors and are protected by Irish and international intellectual-property laws
          (including copyright and related rights under the Copyright and Related Rights Act 2000
          as amended, and trade-mark / passing-off principles where applicable).
        </p>
        <p>
          You receive a limited, revocable, non-transferable, non-sublicensable licence to access
          and view the Site for personal or internal business evaluation. You may not copy,
          modify, distribute, publicly display, frame, sell, or create derivative works from Site
          materials without prior written consent, except for ordinary viewing / deep-linking to
          public URLs or as mandatory law (for example limited fair dealing) allows. All rights
          not expressly granted are reserved.
        </p>
        <p>
          Our name, likeness, and professional marks may not be used in a way that suggests
          endorsement, employment, partnership, or sponsorship without prior written consent.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Disclaimer of warranties">
        <p>
          To the maximum extent permitted by applicable law, the Site and all content, features,
          and services are provided on an &quot;as is&quot; and &quot;as available&quot; basis,
          without warranties of any kind, whether express, implied, or statutory — including
          implied warranties of merchantability, satisfactory quality, fitness for a particular
          purpose, non-infringement, accuracy, uninterrupted availability, or freedom from
          viruses.
        </p>
        <p>
          We do not warrant that the Site will meet your requirements, that AI outputs will be
          correct, or that defects will be corrected. Some jurisdictions do not allow certain
          warranty exclusions; in that case, exclusions apply to the fullest extent permitted.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Limitation of liability">
        <p>
          To the maximum extent permitted by Irish and applicable EU law, we (and our officers,
          agents, and suppliers, if any) shall not be liable for any indirect, incidental,
          special, consequential, exemplary, or punitive damages; loss of profits, revenue,
          goodwill, data, or business opportunity; business interruption; or cost of substitute
          services — whether in contract, tort (including negligence), statute, or otherwise —
          arising out of or related to the Site, chatbot, tech news, linked third-party services,
          or these Terms, even if advised of the possibility of such damages.
        </p>
        <p>
          To the maximum extent permitted by law, our aggregate liability arising out of or
          relating to the Site or these Terms shall not exceed the greater of (a) zero euro (€0),
          where you have paid us nothing for Site access, or (b) the total fees you actually paid
          us specifically for the Site feature giving rise to the claim in the twelve (12) months
          before the claim. Because the Site is generally provided free of charge, this typically
          means liability is excluded to the fullest lawful extent.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability for death or personal injury caused
          by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot
          be excluded or limited under Irish law (including non-excludable consumer rights where
          you are a consumer under Irish or applicable EU consumer law).
        </p>
      </LegalSection>

      <LegalSection number="10" title="Indemnity">
        <p>
          You agree to indemnify, defend, and hold harmless {PERSONAL_INFO.name} from and against
          any claims, demands, losses, liabilities, damages, costs, and expenses (including
          reasonable legal fees) arising out of or related to: (a) your misuse of the Site or
          chatbot; (b) your breach of these Terms; (c) content you submit; or (d) your violation of
          any law or third-party right. We may assume exclusive defence of any matter subject to
          indemnity at your expense; you will cooperate reasonably.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Third-party services and links">
        <p>
          The Site may link to or integrate third-party services (for example GitHub, LinkedIn,
          WhatsApp, academic publishers, analytics, hosting, or AI providers). Those services are
          outside our control. We are not responsible for their availability, content, security, or
          terms. Your use of them is solely between you and the third party, at your own risk.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Force majeure">
        <p>
          We are not liable for delay or failure caused by events beyond our reasonable control,
          including outages of hosting, DNS, AI providers, networks, labour disputes, acts of God,
          war, terrorism, epidemic, government action, or failures of utilities or suppliers.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Changes, suspension, and termination">
        <p>
          We may modify, suspend, or discontinue any part of the Site at any time without
          liability. We may update these Terms by posting a revised version with an updated
          &quot;Last updated&quot; date. Except where mandatory law requires otherwise, continued
          use after posting constitutes acceptance. If you disagree, stop using the Site.
        </p>
        <p>
          Provisions that by their nature should survive (including IP, disclaimers, liability
          limits, indemnity, governing law, and severability) survive termination of access.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Governing law, venue, and disputes">
        <p>
          These Terms and any non-contractual obligations arising out of or in connection with
          them are governed by the laws of Ireland, without regard to conflict-of-law rules that
          would require another law.
        </p>
        <p>
          Subject to mandatory consumer protections that cannot be waived: the courts of Ireland
          (and, for convenience of proceedings, those sitting in Dublin) have exclusive
          jurisdiction over disputes arising out of or relating to these Terms or the Site. You
          and we submit to that jurisdiction. If you are a consumer resident in the EEA/UK, you
          may also benefit from mandatory local consumer courts or ADR mechanisms that cannot be
          displaced by contract.
        </p>
        <p>
          Before filing a claim, you agree to attempt good-faith resolution by emailing{' '}
          <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a> with a description of
          the dispute and allowing thirty (30) days for a response, except where urgent injunctive
          relief is needed to protect IP or security.
        </p>
      </LegalSection>

      <LegalSection number="15" title="General">
        <ul>
          <li>
            <strong>Severability:</strong> If any provision is held invalid or unenforceable, the
            remainder continues in full force; the invalid provision will be modified to the
            minimum extent necessary to make it valid.
          </li>
          <li>
            <strong>No waiver:</strong> Failure to enforce a provision is not a waiver of that
            provision or any other.
          </li>
          <li>
            <strong>Assignment:</strong> You may not assign these Terms without our prior written
            consent. We may assign them in connection with a reorganisation or transfer of the
            Site.
          </li>
          <li>
            <strong>Entire agreement:</strong> These Terms, together with the Privacy Policy where
            incorporated, are the entire agreement regarding the Site and supersede prior
            inconsistent statements about Site use (not any signed services contract).
          </li>
          <li>
            <strong>Language:</strong> If we provide a translation, the English version prevails
            in case of conflict, except where mandatory local law requires otherwise.
          </li>
          <li>
            <strong>Notices:</strong> We may provide notices by posting on the Site or by email if
            you have contacted us. You may contact us at{' '}
            <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="16" title="Contact">
        <ContactBlock
          related={
            <>
              Related: <Link to="/privacy-policy">Privacy Policy</Link>.
            </>
          }
          disclaimer="These Terms are drafted to protect our legitimate interests under Irish and EU law. They are not personalised legal advice. For high-stakes matters, consult an Irish solicitor."
        />
      </LegalSection>
    </>
  );
}

function TermsBodyTr() {
  return (
    <>
      <LegalSection number="01" title="Sözleşme ve taraflar">
        <p>
          Bu Şartlar ve Koşullar (&quot;Şartlar&quot;), siz (&quot;siz&quot; veya
          &quot;kullanıcı&quot;) ile {PERSONAL_INFO.location}’dan faaliyet gösteren gerçek kişi{' '}
          {PERSONAL_INFO.name} (&quot;biz&quot;, &quot;bize&quot; veya &quot;bizim&quot;) arasında;
          bu web sitesine, içeriğine, site için sunulan API’lere ve portfolyo chatbot’una (birlikte
          &quot;Site&quot;) erişim ve kullanım hakkında bağlayıcı bir sözleşme oluşturur.
        </p>
        <p>
          Siteye erişerek, gezinerek veya kullanarak bu Şartları kabul etmiş olursunuz. Kabul
          etmiyorsanız Siteyi derhal kullanmayı bırakmalısınız. Kişisel veriler, hukukun izin
          verdiği ölçüde bu sözleşmenin parçası olan{' '}
          <Link to="/privacy-policy">Gizlilik Politikası</Link>’mıza tabidir.
        </p>
        <p>
          Bu Şartlarda hiçbir şey sizinle aramızda ortaklık, joint venture, istihdam veya vekâlet
          ilişkisi oluşturmaz.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Sitenin niteliği (yalnızca bilgilendirme)">
        <p>
          Site kişisel profesyonel bir portfolyo ve demo ortamıdır. Proje açıklamaları, yayınlar,
          teknoloji haberleri sayfaları, durum göstergeleri ve AI destekli chatbot içerebilir.
          İmza altına alınmış yazılı bir sözleşmeyle açıkça aksi kararlaştırılmadıkça:
        </p>
        <ul>
          <li>
            İçerik yalnızca genel bilgilendirme ve kendini tanıtma amaçlıdır; hukuki, mali, tıbbi,
            göç, vergi, güvenlik veya başka mesleki tavsiye oluşturmaz.
          </li>
          <li>
            Sitedeki hiçbir şey iş teklifi, kabul edilebilir hizmet sözleşmesi teklifi, müsaitlik /
            fiyat / sonuç garantisi veya herhangi bir angajmana girme taahhüdü değildir.
          </li>
          <li>
            Müsaitlik rozetleri, yanıt süresi ifadeleri ve benzeri göstergeler yalnızca gösterge
            niteliğindedir; hatalı veya güncel olmayabilir.
          </li>
          <li>
            Gelecekteki her profesyonel ilişki, pazarlama veya portfolyo ifadelerinin yerine geçen
            ayrı yazılı şartlara (ve gerekirse iş tanımına) tabidir.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="03" title="Uygunluk ve ehliyet">
        <p>
          Bu Şartları kabul etmek için hukuki ehliyetiniz olduğunu beyan edersiniz. Siteyi bir
          kuruluş adına kullanıyorsanız, o kuruluşu bağlama yetkiniz olduğunu beyan edersiniz ve
          &quot;siz&quot; o kuruluşu da kapsar. Site 16 yaş altı çocuklara yönelik değildir.
        </p>
      </LegalSection>

      <LegalSection number="04" title="Kabul edilebilir kullanım ve yasaklar">
        <p>Siteyi yasalara uygun ve yalnızca meşru amaçlarla kullanmalısınız. Şunları yapamazsınız:</p>
        <ul>
          <li>
            Siteye, hesaplara, API’lere veya ilgili altyapıya müdahale etmek, aşırı yüklemek, tarama /
            sondalama yapmak veya yetkisiz erişim denemek.
          </li>
          <li>
            Olağan tarayıcı kullanımı veya yazılı izin dışında içeriği veya veriyi kazımak, toplamak,
            yansıtmak veya sistematik çıkarmak; erişilebilirliğe zarar veren veya hız sınırlarını
            aşan otomatik erişim yasaktır.
          </li>
          <li>
            Zorunlu hukuk açıkça izin vermedikçe Siteyi tersine mühendislik, kaynak koda indirme
            veya kaynak kod türetme.
          </li>
          <li>
            Kötü amaçlı yazılım yüklemek veya iletmek; Siteyi spam, kimlik avı veya hukuka aykırı
            içerik dağıtmak için kullanmak.
          </li>
          <li>
            Kimliğinizi veya bağlantınızı yanlış beyan etmek; Siteyi taciz, iftira veya başkalarının
            haklarını ihlal için kullanmak.
          </li>
          <li>
            Chatbot’u yasa dışı, zararlı, dolandırıcı veya kötüye kullanıma yönelik içerik üretmek /
            istemek; prompt injection, jailbreak veya sistem prompt / sır çıkarma denemek için
            kullanmak.
          </li>
          <li>
            Chatbot’a veya Site üzerinden kamuya açık iletişim kanallarına parola, ödeme kartı
            verisi, kimlik numarası, özel nitelikli veri (sağlık, biyometrik vb.) veya gizli üçüncü
            taraf bilgisi göndermek.
          </li>
        </ul>
        <p>
          Bu Şartların veya uygulanabilir hukukun ihlal edildiğine makul olarak inanırsak veya
          Siteyi, bizi veya başkalarını korumak gerekirse erişimi askıya alabilir, yavaşlatabilir,
          engelleyebilir veya sonlandırabiliriz (IP, oturum veya diğer teknik yollar dahil).
          Pratik olmayan veya güvensiz olduğunda önceden bildirim yükümlülüğümüz yoktur.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Portfolyo chatbot’u ve AI çıktısı">
        <p>
          Chatbot, portfolyomuz ve geçmişimiz hakkında sorular için isteğe bağlı bir kolaylık
          özelliğidir. Sizi hukuken etkileyen bir karar alma sistemi değildir. Kullanarak şunları
          kabul edersiniz:
        </p>
        <ul>
          <li>
            Çıktılar olasılıksal modellerle üretilir (Groq gibi üçüncü taraf çıkarım ve
            yapılandırılmışsa n8n gibi otomasyon dahil); eksik, güncel olmayan, yanlı veya hatalı
            olabilir.
          </li>
          <li>
            Herhangi bir kararda dayanmadan önce bilgileri bağımsız doğrulamalısınız.
          </li>
          <li>
            Chatbot çıktısı tavsiye, beyan veya garanti değildir; doğrudan bizimle konuşmanın veya
            kendi mesleki tavsiyenizi almanın yerine geçmez.
          </li>
          <li>
            Mesaj içeriği <Link to="/privacy-policy">Gizlilik Politikası</Link>’nda açıklandığı gibi
            işleyenlere iletilebilir ve saklanabilir. Gizli veya hassas bilgi göndermeyin.
          </li>
          <li>
            Özelliği işletmek, güvence altına almak, iyileştirmek ve kötüye kullanımı incelemek için
            konuşmaları kaydedebilir, inceleyebilir, hız sınırlayabilir, reddedebilir veya silebiliriz.
          </li>
          <li>
            Chatbot’a metin gönderdiğiniz ölçüde, o metni yalnızca Site ve chatbot’u sağlamak,
            güvence altına almak ve iyileştirmek ile hukuka uymak için barındırmak, işlemek, çoğaltmak
            ve kullanmak üzere dünya çapında, münhasır olmayan, telifsiz bir lisans verirsiniz.
            Göndermek için gerekli haklara sahip olduğunuzu beyan edersiniz.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="06" title="Teknoloji haberleri ve üçüncü taraf materyaller">
        <p>
          Teknoloji haberleri sayfaları otomatik araçlarla (çeviri dahil) üretilmiş veya desteklenmiş
          materyal içerebilir. Başlıklar, özetler ve ilgili sunum hatalar veya eksikler
          barındırabilir. Doğruluk, eksiksizlik veya herhangi bir amaca uygunluk garanti etmeyiz.
          Üçüncü taraf yayınlar veya ürünler anıldığında veya bağlandığında (Springer Nature gibi
          akademik yayıncılar dahil) haklar sahiplerinde kalır; bağlantılar yalnızca referans içindir
          ve onay değildir.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Fikri mülkiyet">
        <p>
          Açıkça atfedilmiş veya bağlanmış üçüncü taraf materyaller hariç, Site’deki tüm haklar,
          unvan ve menfaat — metin, tasarım, düzen, grafikler, logolar, seçim ve düzenleme, orijinal
          kod ve marka dahil — {PERSONAL_INFO.name}’a veya lisans verenlerimize aittir ve İrlanda
          ile uluslararası fikri mülkiyet yasalarıyla korunur (değiştirilmiş haliyle Copyright and
          Related Rights Act 2000 kapsamındaki telif ve ilgili haklar ile uygulanabilir marka /
          passing-off ilkeleri dahil).
        </p>
        <p>
          Siteye kişisel veya iç iş değerlendirmesi için sınırlı, geri alınabilir, devredilemez,
          alt lisanslanamaz erişim ve görüntüleme lisansı alırsınız. Önceden yazılı izin olmadan
          Site materyallerini kopyalayamaz, değiştiremez, dağıtamaz, kamuya sergileyemez, çerçeveleyemez,
          satamaz veya türev eser oluşturamazsınız — olağan görüntüleme / kamuya açık URL’lere derin
          bağlantı veya zorunlu hukukun (ör. sınırlı fair dealing) izin verdiği haller hariç.
          Açıkça verilmeyen tüm haklar saklıdır.
        </p>
        <p>
          Adımız, görüntümüz ve profesyonel işaretlerimiz, önceden yazılı izin olmadan onay,
          istihdam, ortaklık veya sponsorluk ima edecek şekilde kullanılamaz.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Garanti feragati">
        <p>
          Uygulanabilir hukukun izin verdiği azami ölçüde Site ve tüm içerik, özellik ve hizmetler
          &quot;olduğu gibi&quot; ve &quot;mevcut olduğu kadarıyla&quot; sunulur; açık, zımni veya
          yasal hiçbir garanti yoktur — satılabilirlik, tatmin edici kalite, belirli bir amaca
          uygunluk, ihlal etmeme, doğruluk, kesintisiz erişilebilirlik veya virüssüzlük zımni
          garantileri dahil.
        </p>
        <p>
          Sitenin gereksinimlerinizi karşılayacağını, AI çıktılarının doğru olacağını veya kusurların
          düzeltileceğini garanti etmeyiz. Bazı yargı yerleri belirli garanti dışlamalarına izin
          vermez; bu durumda dışlamalar izin verilen azami ölçüde uygulanır.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Sorumluluğun sınırlandırılması">
        <p>
          İrlanda ve uygulanabilir AB hukukunun izin verdiği azami ölçüde biz (ve varsa
          görevlilerimiz, temsilcilerimiz ve tedarikçilerimiz) dolaylı, arızi, özel, sonuçsal,
          örnek veya cezai zararlar; kâr, gelir, itibar, veri veya iş fırsatı kaybı; iş kesintisi
          veya ikame hizmet maliyeti için — sözleşme, haksız fiil (ihmal dahil), kanun veya başka
          yoldan — Site, chatbot, teknoloji haberleri, bağlantılı üçüncü taraf hizmetler veya bu
          Şartlardan doğan veya bunlarla ilgili olsa bile, bu tür zararların olasılığı bildirilmiş
          olsa dahi sorumlu değiliz.
        </p>
        <p>
          Hukukun izin verdiği azami ölçüde, Site veya bu Şartlardan doğan veya bunlarla ilgili
          toplam sorumluluğumuz (a) Site erişimi için bize hiçbir şey ödemediyseniz sıfır euro (€0)
          veya (b) talepten önceki on iki (12) ayda söz konusu Site özelliği için fiilen ödediğiniz
          toplam ücretlerden büyük olanını aşmaz. Site genelde ücretsiz sunulduğu için bu tipik
          olarak sorumluluğun yasaların izin verdiği ölçüde hariç tutulması anlamına gelir.
        </p>
        <p>
          Bu Şartlarda hiçbir şey, ihmalden kaynaklanan ölüm veya kişisel yaralanma, dolandırıcılık
          veya hileli beyan ya da İrlanda hukuku altında hariç tutulamayan veya sınırlandırılamayan
          diğer sorumlulukları (İrlanda veya uygulanabilir AB tüketici hukuku kapsamında
          tüketiciseniz hariç tutulamayan tüketici hakları dahil) hariç tutmaz veya sınırlamaz.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Tazmin">
        <p>
          Şunlardan doğan veya bunlarla ilgili her türlü talep, kayıp, yükümlülük, zarar, maliyet ve
          giderlere (makul avukatlık ücretleri dahil) karşı {PERSONAL_INFO.name}’ı tazmin etmeyi,
          savunmayı ve zarar görmemesini sağlamayı kabul edersiniz: (a) Site veya chatbot’u kötüye
          kullanmanız; (b) bu Şartları ihlaliniz; (c) gönderdiğiniz içerik; veya (d) herhangi bir
          hukuk veya üçüncü taraf hakkını ihlaliniz. Tazmine tabi herhangi bir konuda masrafınız
          üzerinden münhasır savunmayı üstlenebiliriz; makul şekilde işbirliği yaparsınız.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Üçüncü taraf hizmetler ve bağlantılar">
        <p>
          Site üçüncü taraf hizmetlere bağlanabilir veya onları entegre edebilir (ör. GitHub,
          LinkedIn, WhatsApp, akademik yayıncılar, analitik, barındırma veya AI sağlayıcıları). Bu
          hizmetler kontrolümüz dışındadır. Erişilebilirlikleri, içerikleri, güvenlikleri veya
          şartlarından sorumlu değiliz. Kullanımınız yalnızca siz ve üçüncü taraf arasındadır; risk
          size aittir.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Mücbir sebep">
        <p>
          Makul kontrolümüz dışındaki olaylardan kaynaklanan gecikme veya başarısızlıktan sorumlu
          değiliz; barındırma, DNS, AI sağlayıcıları, ağlar, iş uyuşmazlıkları, doğal afet, savaş,
          terör, salgın, hükümet eylemi veya kamu hizmeti / tedarikçi arızaları dahil.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Değişiklikler, askıya alma ve sona erme">
        <p>
          Sitenin herhangi bir bölümünü herhangi bir zamanda sorumluluk olmaksızın değiştirebilir,
          askıya alabilir veya durdurabiliriz. Bu Şartları, güncellenmiş &quot;Son güncelleme&quot;
          tarihiyle gözden geçirilmiş sürüm yayımlayarak güncelleyebiliriz. Zorunlu hukuk aksi
          gerektirmediği sürece, yayımlamadan sonra kullanıma devam kabul sayılır. Katılmıyorsanız
          Siteyi kullanmayı bırakın.
        </p>
        <p>
          Niteliği gereği ayakta kalması gereken hükümler (fikri mülkiyet, feragatler, sorumluluk
          sınırları, tazmin, uygulanacak hukuk ve bölünebilirlik dahil) erişimin sona ermesinden
          sonra da geçerlidir.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Uygulanacak hukuk, yetki ve uyuşmazlıklar">
        <p>
          Bu Şartlar ve bunlardan doğan veya bunlarla bağlantılı sözleşme dışı yükümlülükler,
          başka bir hukuk gerektiren kanunlar ihtilafı kurallarına bakılmaksızın İrlanda
          hukukuna tabidir.
        </p>
        <p>
          Feragat edilemeyen zorunlu tüketici korumalarına tabi olarak: İrlanda mahkemeleri (ve
          yargılama kolaylığı için Dublin’de oturanlar) bu Şartlar veya Site’den doğan veya bunlarla
          ilgili uyuşmazlıklarda münhasır yetkiye sahiptir. Siz ve biz bu yetkiye tabi oluruz.
          AEA/BK’de ikamet eden bir tüketiciseniz, sözleşmeyle bertaraf edilemeyen zorunlu yerel
          tüketici mahkemelerinden veya ADR mekanizmalarından da yararlanabilirsiniz.
        </p>
        <p>
          Dava açmadan önce, uyuşmazlığın açıklamasıyla{' '}
          <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a> adresine yazarak iyi
          niyetli çözüm denemeyi ve otuz (30) gün yanıt süresi tanımayı kabul edersiniz — fikri
          mülkiyet veya güvenliği korumak için acil ihtiyati tedbir gerektiği haller hariç.
        </p>
      </LegalSection>

      <LegalSection number="15" title="Genel">
        <ul>
          <li>
            <strong>Bölünebilirlik:</strong> Herhangi bir hüküm geçersiz veya uygulanamaz sayılırsa
            geri kalanı tam güçte devam eder; geçersiz hüküm geçerli kılmak için gerekli asgari
            ölçüde değiştirilir.
          </li>
          <li>
            <strong>Feragat yok:</strong> Bir hükmü uygulamamak, o hükmün veya başka bir hükmün
            feragati değildir.
          </li>
          <li>
            <strong>Devir:</strong> Önceden yazılı iznimiz olmadan bu Şartları devredemezsiniz. Site
            yeniden yapılandırması veya devriyle bağlantılı olarak biz devredebiliriz.
          </li>
          <li>
            <strong>Tüm anlaşma:</strong> Bu Şartlar, dahil edildiği ölçüde Gizlilik Politikası ile
            birlikte Site hakkındaki tüm anlaşmadır ve Site kullanımı hakkındaki önceki tutarsız
            ifadelerin yerine geçer (imzalı hizmet sözleşmesi hariç).
          </li>
          <li>
            <strong>Dil:</strong> Çeviri sağlarsak, çatışma halinde İngilizce sürüm geçerlidir —
            zorunlu yerel hukuk aksi gerektirmediği sürece.
          </li>
          <li>
            <strong>Bildirimler:</strong> Bildirimleri Sitede yayımlayarak veya bize yazdıysanız
            e-posta ile verebiliriz. Bize{' '}
            <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a> adresinden
            ulaşabilirsiniz.
          </li>
        </ul>
      </LegalSection>

      <LegalSection number="16" title="İletişim">
        <ContactBlock
          emailLabel="E-posta"
          locationLabel="Konum"
          related={
            <>
              İlgili: <Link to="/privacy-policy">Gizlilik Politikası</Link>.
            </>
          }
          disclaimer="Bu Şartlar, İrlanda ve AB hukuku altında meşru menfaatlerimizi korumak için hazırlanmıştır. Kişiselleştirilmiş hukuki tavsiye değildir. Yüksek riskli konular için İrlandalı bir avukata danışın."
        />
      </LegalSection>
    </>
  );
}

function ContactBlock({
  emailLabel = 'Email',
  locationLabel = 'Location',
  related,
  disclaimer,
}: {
  emailLabel?: string;
  locationLabel?: string;
  related: ReactNode;
  disclaimer: string;
}) {
  return (
    <>
      <p>
        <strong>{PERSONAL_INFO.name}</strong>
        <br />
        {emailLabel}:{' '}
        <a href={`mailto:${PERSONAL_INFO.email}`}>{PERSONAL_INFO.email}</a>
        <br />
        {locationLabel}: {PERSONAL_INFO.location}
      </p>
      <p>{related}</p>
      <p className="text-ink-42 text-[13px]">{disclaimer}</p>
    </>
  );
}

export default TermsPage;
