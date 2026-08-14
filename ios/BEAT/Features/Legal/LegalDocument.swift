import Foundation

enum LegalDocument: String, Identifiable, CaseIterable {
    case legal
    case privacy
    case imprint
    case eula

    var id: String { rawValue }

    var title: String {
        switch self {
        case .legal: String(localized: "legal.legal")
        case .privacy: String(localized: "legal.privacy")
        case .imprint: String(localized: "legal.imprint")
        case .eula: String(localized: "legal.eula")
        }
    }

    var body: String {
        switch self {
        case .legal:
            """
            BEAT is operated by IACy International FZCO. These pages explain the terms that apply when you use BEAT and how we handle personal data.

            CONTACT

            IACy International FZCO
            Dubai Airport Free Zone Building 9W Block C Office 523 - 68 9WC 523

            Email: beat@iacy.com
            Website: www.iacy.com
            """
        case .privacy:
            """
            1. WHO CONTROLS YOUR DATA

            IACy International FZCO is the controller responsible for personal data processed through BEAT. Contact us at beat@iacy.com for privacy questions or to exercise your rights.

            2. DATA WE PROCESS

            We process information you provide, information created when you use BEAT, and limited technical information needed to run and secure the service.

            • Account and profile data, including contact details, date of birth, gender, preferences, biography, and photos.
            • Conversations, matches, reports, support requests, and other content you choose to submit.
            • Device, log, approximate location, security, and usage data.
            • Subscription and transaction status from payment providers; we do not store full payment-card details.

            3. WHY WE PROCESS IT

            We process data to perform our contract with you, pursue legitimate interests, comply with law, and—where required—based on consent.

            • Provide profiles, discovery, matching, messaging, support, and account features.
            • Keep BEAT safe, prevent fraud, investigate reports, and enforce our rules.
            • Operate, troubleshoot, measure, and improve the service.
            • Send service communications and, with any required consent, marketing.

            4. SHARING AND INTERNATIONAL TRANSFERS

            Profile information is visible to other eligible BEAT users according to product settings. We may also share data with vetted hosting, analytics, communications, moderation, support, and payment providers; authorities when legally required; or a successor in a corporate transaction.

            BEAT is operated by a Dubai company and providers may process data outside your country. Where GDPR applies, we use an accepted transfer mechanism and appropriate safeguards, such as adequacy decisions or standard contractual clauses.

            5. RETENTION AND SECURITY

            We keep personal data only as long as needed for the purposes above, legal obligations, dispute resolution, and safety. Retention periods vary by data type. Some safety, fraud, transaction, and legal records may remain after account deletion where necessary and permitted.

            We use organizational and technical safeguards designed to protect personal data. No online service can guarantee absolute security.

            6. YOUR CHOICES AND GDPR RIGHTS

            Depending on your location, you may request access, correction, deletion, restriction, portability, or objection, and may withdraw consent at any time. You may also complain to your local data-protection authority.

            • Send a request from your account email to beat@iacy.com. We may verify your identity before acting.
            • You can update profile and discovery information in BEAT and may request account deletion.
            • You can control device permissions and unsubscribe from optional marketing.

            7. AGE, CHANGES, AND CONTACT

            BEAT is only for adults aged 18 or older. We do not knowingly permit minors to use the service.

            We may update this notice as BEAT changes. Material changes will be communicated where required. Questions and requests: beat@iacy.com.
            """
        case .imprint:
            """
            SERVICE PROVIDER

            IACy International FZCO

            Dubai Airport Free Zone Building 9W Block C Office 523 - 68 9WC 523

            CONTACT

            Email: beat@iacy.com
            Website: www.iacy.com

            RESPONSIBLE FOR BEAT

            IACy International FZCO is responsible for the BEAT website and application. For legal notices, support, privacy requests, or reports concerning content, contact beat@iacy.com.

            INFORMATION NOTICE

            We take reasonable care to keep our information current, but external links are operated by their respective providers. Mandatory legal rights and responsibilities remain unaffected.
            """
        case .eula:
            """
            1. AGREEMENT AND ELIGIBILITY

            This End User Licence Agreement (“Agreement”) is between you and IACy International FZCO (“BEAT”, “we”, “us”). By creating an account, accessing, or using BEAT, you accept this Agreement and our Privacy & GDPR Notice. You must be at least 18, legally able to agree, and not barred from using BEAT.

            2. LICENCE AND YOUR ACCOUNT

            We grant you a personal, limited, non-exclusive, non-transferable, revocable licence to use BEAT for private, lawful purposes. You are responsible for accurate account information, safeguarding access credentials, and activity under your account.

            3. ACCEPTABLE USE

            You must treat people respectfully and use BEAT only for genuine personal connection. You must not:

            • Harass, threaten, exploit, discriminate against, impersonate, or deceive anyone.
            • Post illegal, hateful, sexually exploitative, non-consensual, infringing, or deliberately harmful content.
            • Solicit money, advertise, spam, scrape, automate access, reverse engineer, disrupt security, or misuse another person’s data.
            • Use BEAT if you are under 18 or upload an image or content without the necessary rights and consent.

            4. CONTENT AND SAFETY

            You retain ownership of your content. You give us a worldwide, non-exclusive, royalty-free licence to host, reproduce, adapt, display, and distribute it only as needed to operate, secure, moderate, promote within, and improve BEAT. This licence ends when content is deleted, except for lawful retention, backups, or content shared with others.

            We may review, restrict, or remove content and accounts to protect users or enforce this Agreement. We do not conduct comprehensive identity or background checks and do not guarantee any user’s identity, intentions, conduct, compatibility, or safety. Use judgment, keep early meetings public, and report concerning behavior.

            5. SUBSCRIPTIONS AND THIRD-PARTY SERVICES

            Paid features, prices, renewals, cancellation, and refunds are shown before purchase and may also be governed by the relevant app store. BEAT may link to or rely on third-party services; their terms and privacy practices apply separately.

            6. INTELLECTUAL PROPERTY

            BEAT, its software, design, brands, and service content are owned by us or our licensors. Except for the licence above, no rights are transferred to you. Feedback may be used without restriction or compensation.

            7. SUSPENSION AND TERMINATION

            You may stop using BEAT and request account deletion. We may suspend or terminate access when reasonably necessary for safety, legal compliance, non-payment, service protection, or a breach of this Agreement. Provisions that by nature should survive termination will remain effective.

            8. DISCLAIMERS AND LIABILITY

            To the maximum extent permitted by law, BEAT is provided “as is” and “as available”. We do not guarantee uninterrupted access, matches, dates, relationships, or particular outcomes.

            To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive loss, or for conduct of other users. Nothing excludes liability that cannot legally be excluded, including applicable mandatory consumer rights.

            9. GOVERNING LAW AND CHANGES

            This Agreement is governed by the laws applicable in the Emirate of Dubai and the federal laws of the United Arab Emirates, without depriving consumers of mandatory protections that apply in their country. Courts with lawful jurisdiction may hear disputes.

            We may update this Agreement to reflect legal, safety, or product changes. We will give notice of material changes where required. Contact beat@iacy.com with questions.
            """
        }
    }
}
