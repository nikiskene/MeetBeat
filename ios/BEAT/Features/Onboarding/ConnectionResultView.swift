import SwiftUI

struct ConnectionResultView: View {
    @ObservedObject private var content = ContentService.shared
    let profile: ConnectionProfile
    let onContinue: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(content.text("onboarding.result.eyebrow", fallback: "Your connection profile").uppercased())
                    .font(BeatFont.medium(11)).tracking(2).foregroundStyle(BeatTheme.accent)
                Text(content.text("onboarding.result.title", fallback: "This is how you tend to connect.")).font(BeatFont.light(34))
                Text(profile.identifier).font(BeatFont.medium(25))
                    .padding(20).frame(maxWidth: .infinity)
                    .background(BeatTheme.card).clipShape(RoundedRectangle(cornerRadius: 20))
                Text(profile.summary).font(BeatFont.regular(16)).lineSpacing(5)
                Text(content.text("onboarding.result.disclaimer", fallback: "This profile helps BEAT rank compatible people. It does not decide who you can meet."))
                    .font(BeatFont.regular(13)).foregroundStyle(.secondary)
                BeatButton(
                    title: LocalizedStringKey(
                        content.text("onboarding.result.action", fallback: "Choose today’s BEAT")
                    ),
                    action: onContinue
                )
            }
            .padding(24)
        }
        .background(BeatTheme.paper)
    }
}
