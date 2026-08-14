import { useEffect } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import LegalFooter from '../components/LegalFooter';
import {
  COMPANY,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LINKS,
  LegalPageId,
  legalPath,
} from '../legalContent';

const BLACK_LOGO =
  'https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/beatlogo%20blk.png';

type Props = {
  page: LegalPageId;
  onBack: () => void;
};

type Section = { title: string; paragraphs: string[]; bullets?: string[] };

const privacySections: Section[] = [
  {
    title: '1. Who controls your data',
    paragraphs: [
      `${COMPANY.name} is the controller responsible for personal data processed through BEAT. Contact us at ${COMPANY.email} for privacy questions or to exercise your rights.`,
    ],
  },
  {
    title: '2. Data we process',
    paragraphs: ['We process information you provide, information created when you use BEAT, and limited technical information needed to run and secure the service.'],
    bullets: [
      'Account and profile data, including contact details, date of birth, gender, preferences, biography, and photos.',
      'Conversations, matches, reports, support requests, and other content you choose to submit.',
      'Device, log, approximate location, security, and usage data.',
      'Subscription and transaction status from payment providers; we do not store full payment-card details.',
    ],
  },
  {
    title: '3. Why we process it',
    paragraphs: ['We process data to perform our contract with you, pursue legitimate interests, comply with law, and—where required—based on consent.'],
    bullets: [
      'Provide profiles, discovery, matching, messaging, support, and account features.',
      'Keep BEAT safe, prevent fraud, investigate reports, and enforce our rules.',
      'Operate, troubleshoot, measure, and improve the service.',
      'Send service communications and, with any required consent, marketing.',
    ],
  },
  {
    title: '4. Sharing and international transfers',
    paragraphs: [
      'Profile information is visible to other eligible BEAT users according to product settings. We may also share data with vetted hosting, analytics, communications, moderation, support, and payment providers; authorities when legally required; or a successor in a corporate transaction.',
      'BEAT is operated by a Dubai company and providers may process data outside your country. Where GDPR applies, we use an accepted transfer mechanism and appropriate safeguards, such as adequacy decisions or standard contractual clauses.',
    ],
  },
  {
    title: '5. Retention and security',
    paragraphs: [
      'We keep personal data only as long as needed for the purposes above, legal obligations, dispute resolution, and safety. Retention periods vary by data type. Some safety, fraud, transaction, and legal records may remain after account deletion where necessary and permitted.',
      'We use organizational and technical safeguards designed to protect personal data. No online service can guarantee absolute security.',
    ],
  },
  {
    title: '6. Your choices and GDPR rights',
    paragraphs: ['Depending on your location, you may request access, correction, deletion, restriction, portability, or objection, and may withdraw consent at any time. You may also complain to your local data-protection authority.'],
    bullets: [
      `Send a request from your account email to ${COMPANY.email}. We may verify your identity before acting.`,
      'You can update profile and discovery information in BEAT and may request account deletion.',
      'You can control device permissions and unsubscribe from optional marketing.',
    ],
  },
  {
    title: '7. Age, changes, and contact',
    paragraphs: [
      'BEAT is only for adults aged 18 or older. We do not knowingly permit minors to use the service.',
      `We may update this notice as BEAT changes. Material changes will be communicated where required. Questions and requests: ${COMPANY.email}.`,
    ],
  },
];

const eulaSections: Section[] = [
  {
    title: '1. Agreement and eligibility',
    paragraphs: [
      `This End User Licence Agreement (“Agreement”) is between you and ${COMPANY.name} (“BEAT”, “we”, “us”). By creating an account, accessing, or using BEAT, you accept this Agreement and our Privacy & GDPR Notice. You must be at least 18, legally able to agree, and not barred from using BEAT.`,
    ],
  },
  {
    title: '2. Licence and your account',
    paragraphs: [
      'We grant you a personal, limited, non-exclusive, non-transferable, revocable licence to use BEAT for private, lawful purposes. You are responsible for accurate account information, safeguarding access credentials, and activity under your account.',
    ],
  },
  {
    title: '3. Acceptable use',
    paragraphs: ['You must treat people respectfully and use BEAT only for genuine personal connection. You must not:'],
    bullets: [
      'Harass, threaten, exploit, discriminate against, impersonate, or deceive anyone.',
      'Post illegal, hateful, sexually exploitative, non-consensual, infringing, or deliberately harmful content.',
      'Solicit money, advertise, spam, scrape, automate access, reverse engineer, disrupt security, or misuse another person’s data.',
      'Use BEAT if you are under 18 or upload an image or content without the necessary rights and consent.',
    ],
  },
  {
    title: '4. Content and safety',
    paragraphs: [
      'You retain ownership of your content. You give us a worldwide, non-exclusive, royalty-free licence to host, reproduce, adapt, display, and distribute it only as needed to operate, secure, moderate, promote within, and improve BEAT. This licence ends when content is deleted, except for lawful retention, backups, or content shared with others.',
      'We may review, restrict, or remove content and accounts to protect users or enforce this Agreement. We do not conduct comprehensive identity or background checks and do not guarantee any user’s identity, intentions, conduct, compatibility, or safety. Use judgment, keep early meetings public, and report concerning behavior.',
    ],
  },
  {
    title: '5. Subscriptions and third-party services',
    paragraphs: [
      'Paid features, prices, renewals, cancellation, and refunds are shown before purchase and may also be governed by the relevant app store. BEAT may link to or rely on third-party services; their terms and privacy practices apply separately.',
    ],
  },
  {
    title: '6. Intellectual property',
    paragraphs: [
      'BEAT, its software, design, brands, and service content are owned by us or our licensors. Except for the licence above, no rights are transferred to you. Feedback may be used without restriction or compensation.',
    ],
  },
  {
    title: '7. Suspension and termination',
    paragraphs: [
      'You may stop using BEAT and request account deletion. We may suspend or terminate access when reasonably necessary for safety, legal compliance, non-payment, service protection, or a breach of this Agreement. Provisions that by nature should survive termination will remain effective.',
    ],
  },
  {
    title: '8. Disclaimers and liability',
    paragraphs: [
      'To the maximum extent permitted by law, BEAT is provided “as is” and “as available”. We do not guarantee uninterrupted access, matches, dates, relationships, or particular outcomes.',
      'To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive loss, or for conduct of other users. Nothing excludes liability that cannot legally be excluded, including applicable mandatory consumer rights.',
    ],
  },
  {
    title: '9. Governing law and changes',
    paragraphs: [
      'This Agreement is governed by the laws applicable in the Emirate of Dubai and the federal laws of the United Arab Emirates, without depriving consumers of mandatory protections that apply in their country. Courts with lawful jurisdiction may hear disputes.',
      `We may update this Agreement to reflect legal, safety, or product changes. We will give notice of material changes where required. Contact ${COMPANY.email} with questions.`,
    ],
  },
];

function Sections({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-10">
      {sections.map(section => (
        <section key={section.title} className="space-y-4">
          <h2 className="text-xl font-medium text-[#141414]">{section.title}</h2>
          {section.paragraphs.map(paragraph => (
            <p key={paragraph} className="leading-7 text-[#333333]/75">{paragraph}</p>
          ))}
          {section.bullets && (
            <ul className="list-disc space-y-2 pl-5 leading-7 text-[#333333]/75">
              {section.bullets.map(item => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default function LegalPage({ page, onBack }: Props) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page]);

  const titles: Record<LegalPageId, string> = {
    legal: 'Legal information',
    privacy: 'Privacy & GDPR Notice',
    imprint: 'Imprint',
    eula: 'End User Licence Agreement',
  };

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-[#141414]">
      <header className="sticky top-0 z-40 border-b border-[#e8e0d0] bg-[#fdfcf9]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#333333]/60 transition-colors hover:text-[#141414]">
            <ArrowLeft size={16} /> Back
          </button>
          <img src={BLACK_LOGO} alt="BEAT" className="h-6" />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:px-12 lg:grid-cols-[220px_minmax(0,760px)] lg:py-20">
        <nav aria-label="Legal pages" className="flex flex-wrap content-start gap-2 lg:sticky lg:top-28 lg:flex-col lg:self-start">
          {LEGAL_LINKS.map(link => (
            <a key={link.id} href={legalPath(link.id)} className={`rounded-full px-4 py-2 text-sm transition-colors ${page === link.id ? 'bg-[#141414] text-white' : 'bg-[#f2ede3] text-[#333333]/70 hover:text-[#141414]'}`}>
              {link.label}
            </a>
          ))}
        </nav>

        <article>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#9a6959]">BEAT · Legal</p>
          <h1 className="mb-3 text-4xl font-light leading-tight md:text-5xl">{titles[page]}</h1>
          <p className="mb-12 text-sm text-[#333333]/50">Effective: {LEGAL_EFFECTIVE_DATE}</p>

          {page === 'legal' && (
            <div className="space-y-10">
              <p className="text-lg leading-8 text-[#333333]/75">BEAT is operated by {COMPANY.name}. These pages explain the terms that apply when you use BEAT and how we handle personal data.</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {LEGAL_LINKS.filter(link => link.id !== 'legal').map(link => (
                  <a key={link.id} href={legalPath(link.id)} className="rounded-2xl border border-[#e8e0d0] bg-white p-5 transition-transform hover:-translate-y-0.5">
                    <span className="font-medium">{link.label}</span>
                    <p className="mt-2 text-sm leading-6 text-[#333333]/55">Read the current {link.label.toLowerCase()}.</p>
                  </a>
                ))}
              </div>
              <section className="rounded-2xl bg-[#f2ede3] p-6">
                <h2 className="mb-3 text-xl font-medium">Contact</h2>
                <p className="leading-7 text-[#333333]/75">{COMPANY.name}<br />{COMPANY.address}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <a className="underline underline-offset-4" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
                  <a className="inline-flex items-center gap-1 underline underline-offset-4" href={COMPANY.website} target="_blank" rel="noreferrer">www.iacy.com <ExternalLink size={13} /></a>
                </div>
              </section>
            </div>
          )}
          {page === 'privacy' && <Sections sections={privacySections} />}
          {page === 'eula' && <Sections sections={eulaSections} />}
          {page === 'imprint' && (
            <div className="space-y-10 leading-7 text-[#333333]/75">
              <section>
                <h2 className="mb-4 text-xl font-medium text-[#141414]">Service provider</h2>
                <p>{COMPANY.name}<br />{COMPANY.address}</p>
              </section>
              <section>
                <h2 className="mb-4 text-xl font-medium text-[#141414]">Contact</h2>
                <p>Email: <a className="underline underline-offset-4" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a><br />Website: <a className="underline underline-offset-4" href={COMPANY.website} target="_blank" rel="noreferrer">www.iacy.com</a></p>
              </section>
              <section>
                <h2 className="mb-4 text-xl font-medium text-[#141414]">Responsible for BEAT</h2>
                <p>{COMPANY.name} is responsible for the BEAT website and application. For legal notices, support, privacy requests, or reports concerning content, contact {COMPANY.email}.</p>
              </section>
              <section>
                <h2 className="mb-4 text-xl font-medium text-[#141414]">Information notice</h2>
                <p>We take reasonable care to keep our information current, but external links are operated by their respective providers. Mandatory legal rights and responsibilities remain unaffected.</p>
              </section>
            </div>
          )}
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}
