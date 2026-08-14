import SwiftUI

struct DiscoveryView: View {
    @EnvironmentObject private var auth: AuthStore
    @ObservedObject private var content = ContentService.shared
    let beat: BeatOption
    let onOpenConversation: (UUID) -> Void
    let onChangeBeat: () -> Void

    @State private var candidates: [DiscoveryCandidate] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var matchedCandidate: DiscoveryCandidate?
    @State private var currentAvatarURL: URL?
    private let repository = DiscoveryRepository()

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("TODAY")
                .font(BeatFont.medium(11))
                .tracking(2.2)
                .foregroundStyle(BeatTheme.accent)
            Text(copy(
                "discovery.people.title",
                "People open to {selectedBeat} today",
                ["selectedBeat": beat.label]
            ))
                .font(BeatFont.light(29))
            Text(copy(
                "discovery.people.body",
                "They also fit your current age, gender and distance preferences."
            ))
                .font(BeatFont.regular(14)).foregroundStyle(.secondary)

            if isLoading {
                ProgressView(copy("discovery.loading", "Finding people on your wavelength…"))
                    .frame(maxWidth: .infinity).padding(50)
            } else if let errorMessage {
                errorView(errorMessage)
            } else if candidates.isEmpty {
                ContentUnavailableView(
                    copy("discovery.empty.title", "No one nearby has chosen this BEAT yet."),
                    systemImage: "person.2.slash",
                    description: Text(copy(
                        "discovery.empty.body",
                        "Try another BEAT, adjust your discovery preferences or check again later."
                    ))
                )
                Button(copy("discovery.empty.change_beat", "Choose another BEAT"), action: onChangeBeat)
            } else {
                ForEach(candidates) { candidate in
                    candidateCard(candidate, isMatch: false)
                }
            }
        }
        .task(id: beat) { await load() }
        .fullScreenCover(item: $matchedCandidate) { candidate in
            MatchCelebrationView(
                currentAvatarURL: currentAvatarURL,
                matchedAvatarURL: candidate.avatarURL,
                matchedName: candidate.displayName,
                onMessage: {
                    matchedCandidate = nil
                    onOpenConversation(candidate.id)
                },
                onContinue: { matchedCandidate = nil }
            )
        }
    }

    private func candidateCard(
        _ candidate: DiscoveryCandidate,
        isMatch: Bool
    ) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            AsyncImage(url: candidate.avatarURL) { phase in
                if case let .success(image) = phase {
                    image.resizable().scaledToFill()
                } else {
                    ZStack {
                        BeatTheme.accentLight.opacity(0.4)
                        Text(candidate.displayName.prefix(1).uppercased())
                            .font(BeatFont.light(54))
                            .foregroundStyle(BeatTheme.accent)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 330)
            .clipped()

            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    Text(candidate.displayName).font(BeatFont.medium(21))
                    if let age = candidate.age {
                        Text("\(age)").font(BeatFont.light(20)).foregroundStyle(.secondary)
                    }
                }
                if let location = candidate.locationLabel ?? candidate.city {
                    Label(location, systemImage: "mappin")
                        .font(BeatFont.regular(13))
                        .foregroundStyle(.secondary)
                }
                if let bio = candidate.bio {
                    Text(bio)
                        .font(BeatFont.regular(14))
                        .foregroundStyle(BeatTheme.muted.opacity(0.72))
                        .lineSpacing(4)
                }
                if !isMatch {
                    HStack(spacing: 12) {
                        decisionButton("Pass", symbol: "xmark", decision: "skip", candidate: candidate)
                        decisionButton("Like", symbol: "heart.fill", decision: "like", candidate: candidate)
                    }
                    .padding(.top, 8)
                }
            }
            .padding(18)
        }
        .background(BeatTheme.card)
        .overlay(RoundedRectangle(cornerRadius: 25).stroke(BeatTheme.border))
        .clipShape(RoundedRectangle(cornerRadius: 25))
        .shadow(color: .black.opacity(0.05), radius: 12, y: 5)
    }

    private func decisionButton(
        _ title: String,
        symbol: String,
        decision: String,
        candidate: DiscoveryCandidate
    ) -> some View {
        Button {
            Task { await decide(candidate, decision: decision) }
        } label: {
            Label(title, systemImage: symbol)
                .font(BeatFont.medium(14))
                .frame(maxWidth: .infinity)
                .frame(height: 48)
        }
        .foregroundStyle(decision == "like" ? BeatTheme.primaryActionText : BeatTheme.ink)
        .background(decision == "like" ? BeatTheme.primaryAction : BeatTheme.surface)
        .clipShape(Capsule())
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 14) {
            Text(message).font(BeatFont.regular(13)).foregroundStyle(.red)
            Button("Try again") { Task { await load() } }
        }
        .frame(maxWidth: .infinity)
        .padding(30)
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            async let candidateRequest = repository.fetchCandidates()
            candidates = try await candidateRequest
            if let userID = auth.user?.id {
                currentAvatarURL = try? await ProfileRepository().fetchProfile(userID: userID).avatarURL
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func decide(_ candidate: DiscoveryCandidate, decision: String) async {
        do {
            let matchID = try await repository.decide(
                targetID: candidate.id,
                decision: decision
            )
            candidates.removeAll { $0.id == candidate.id }
            if matchID != nil { matchedCandidate = candidate }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func copy(_ key: String, _ fallback: String, _ values: [String: String] = [:]) -> String {
        content.text(key, fallback: fallback, values: values)
    }
}
