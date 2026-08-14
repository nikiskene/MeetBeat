import SwiftUI

struct HowItWorksSection: View {
    @ObservedObject private var content = ContentService.shared
    private var steps: [(String, String, String)] { [
        ("01", text("welcome.step_1.title", "Tell us how you connect"), text("welcome.step_1.body", "Answer ten thoughtful questions so BEAT can understand your natural communication and connection style.")),
        ("02", text("welcome.step_2.title", "Choose today’s BEAT"), text("welcome.step_2.body", "Deep Talk, Coffee, Adventure or Quiet Time: choose what would genuinely feel good today.")),
        ("03", text("welcome.step_3.title", "Meet people who agree"), text("welcome.step_3.body", "Browse everyone nearby who chose the same BEAT and fits your age, gender and distance preferences. Like as many people as you genuinely want to meet."))
    ] }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            eyebrow(text("welcome.how_it_works.label", "How BEAT works").uppercased())
            Text(text("welcome.how_it_works.title", "Start with the kind of connection you want today."))
                .font(BeatFont.light(36))
                .padding(.top, 12)
                .padding(.bottom, 28)
            ForEach(steps, id: \.0) { step in
                VStack(alignment: .leading, spacing: 13) {
                    Text(step.0)
                        .font(BeatFont.light(45))
                        .foregroundStyle(BeatTheme.accentLight)
                    Text(step.1).font(BeatFont.medium(19))
                    Text(step.2)
                        .foregroundStyle(BeatTheme.muted.opacity(0.68))
                        .lineSpacing(5)
                }
                .padding(25)
                .background(BeatTheme.surface)
                .clipShape(RoundedRectangle(cornerRadius: 25))
                .padding(.bottom, 14)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 82)
    }

    private func text(_ key: String, _ fallback: String) -> String {
        content.text(key, fallback: fallback)
    }
}

struct ConversationFirstSection: View {
    @ObservedObject private var content = ContentService.shared
    private let items = [
        ("message", "Shared intention"),
        ("heart", "Personal compatibility"),
        ("shield", "Verified profiles"),
        ("arrow.right", "Your own pace")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            eyebrow(content.text("welcome.connection.label", fallback: "Many ways to connect").uppercased(), color: BeatTheme.gold)
            Text(content.text("welcome.connection.title", fallback: "Attraction does not follow one script."))
                .font(BeatFont.light(36))
                .foregroundStyle(.white)
                .padding(.vertical, 18)
            Text(content.text(
                "welcome.connection.body_1",
                fallback: "Some people connect through conversation. Others through humour, curiosity, music, movement, silence or a shared adventure."
            ) + "\n\n" + content.text(
                "welcome.connection.body_2",
                fallback: "BEAT helps you find people who want a similar kind of connection today, while still leaving you free to browse, choose and follow your own curiosity."
            ))
                .foregroundStyle(.white.opacity(0.70))
                .lineSpacing(5)
            LazyVGrid(columns: [.init(), .init()], spacing: 12) {
                ForEach(items, id: \.1) { item in
                    VStack(alignment: .leading, spacing: 11) {
                        Image(systemName: item.0).foregroundStyle(BeatTheme.gold)
                        Text(item.1)
                            .font(BeatFont.medium(13))
                            .foregroundStyle(.white)
                    }
                    .frame(maxWidth: .infinity, minHeight: 96, alignment: .leading)
                    .padding(16)
                    .background(.white.opacity(0.05))
                    .overlay(RoundedRectangle(cornerRadius: 17).stroke(.white.opacity(0.10)))
                    .clipShape(RoundedRectangle(cornerRadius: 17))
                }
            }
            .padding(.top, 28)
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 82)
        .background(BeatTheme.brandDark)
    }
}

struct SafetySection: View {
    private let items = [
        ("Safety is default", "Reporting, blocking, and unmatching are always one tap away. You control every interaction."),
        ("Intention over impulse", "BEAT is built for people who know what they're looking for. No gamification, no hot-or-not ranking."),
        ("Real moderation", "Our team reviews flagged content and removes profiles that don't meet our community standards.")
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            eyebrow("SAFETY & INTENTION")
            Text("A space built for trust.")
                .font(BeatFont.light(36))
                .padding(.vertical, 16)
            Text("Meaningful connection requires emotional safety. Every decision we make in product and policy is guided by this principle.")
                .foregroundStyle(BeatTheme.muted.opacity(0.68))
                .lineSpacing(5)
                .padding(.bottom, 26)
            ForEach(items, id: \.0) { item in
                VStack(alignment: .leading, spacing: 8) {
                    Text(item.0).font(BeatFont.medium(16))
                    Text(item.1)
                        .font(BeatFont.regular(14))
                        .foregroundStyle(BeatTheme.muted.opacity(0.68))
                        .lineSpacing(4)
                }
                .padding(20)
                .overlay(RoundedRectangle(cornerRadius: 17).stroke(BeatTheme.border))
                .padding(.bottom, 12)
            }
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 82)
    }
}

struct LandingCallToAction: View {
    let onJoin: () -> Void
    @ObservedObject private var content = ContentService.shared

    var body: some View {
        VStack(spacing: 22) {
            Text("BEAT").font(BeatFont.medium(22)).tracking(6)
            Text(content.text("welcome.cta.title", fallback: "What would feel good today?"))
                .font(BeatFont.light(36))
                .multilineTextAlignment(.center)
            Text(content.text("welcome.cta.body", fallback: "Choose your BEAT and discover who is on the same wavelength."))
                .foregroundStyle(BeatTheme.muted.opacity(0.68))
                .multilineTextAlignment(.center)
                .lineSpacing(5)
            Button(content.text("welcome.cta.button", fallback: "Join BEAT"), action: onJoin)
                .font(BeatFont.medium(15))
                .foregroundStyle(BeatTheme.primaryActionText)
                .padding(.horizontal, 34)
                .frame(height: 52)
                .background(BeatTheme.primaryAction)
                .clipShape(Capsule())
        }
        .padding(.horizontal, 24)
        .padding(.vertical, 90)
        .frame(maxWidth: .infinity)
        .background(BeatTheme.moodPanel)
    }
}

struct LandingLegalFooter: View {
    @Binding var document: LegalDocument?

    var body: some View {
        VStack(spacing: 18) {
            Text("© \(Calendar.current.component(.year, from: Date())) IACy International FZCO")
                .font(BeatFont.regular(12))
            HStack(spacing: 14) {
                ForEach(LegalDocument.allCases) { item in
                    Button(item.title) { document = item }
                }
            }
            .font(BeatFont.regular(11))
        }
        .foregroundStyle(.white.opacity(0.55))
        .padding(.horizontal, 18)
        .padding(.vertical, 28)
        .frame(maxWidth: .infinity)
        .background(BeatTheme.brandDark)
    }
}

private func eyebrow(_ title: String, color: Color = BeatTheme.accent) -> some View {
    Text(title)
        .font(BeatFont.medium(12))
        .tracking(2.4)
        .foregroundStyle(color)
}
