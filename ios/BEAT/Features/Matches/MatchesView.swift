import SwiftUI

struct MatchesView: View {
    let onOpenConversation: (UUID) -> Void
    @State private var matches: [BeatMatch] = []
    @State private var isLoading = true
    @State private var errorMessage: String?

    private let repository = ProfileRepository()

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                } else if let errorMessage {
                    ContentUnavailableView {
                        Label("common.error", systemImage: "exclamationmark.triangle")
                    } description: {
                        Text(errorMessage)
                    } actions: {
                        Button("common.retry") { Task { await load() } }
                    }
                } else if matches.isEmpty {
                    ContentUnavailableView(
                        "matches.empty",
                        systemImage: "heart",
                        description: Text("matches.empty_description")
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(matches) { match in
                                MatchCard(match: match) {
                                    onOpenConversation(match.matchedUserID)
                                }
                            }
                        }
                        .padding(20)
                    }
                }
            }
            .background(BeatTheme.paper)
            .navigationTitle("tab.matches")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        errorMessage = nil
        do {
            matches = try await repository.fetchMatches()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

private struct MatchCard: View {
    let match: BeatMatch
    let openConversation: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            avatar
            VStack(alignment: .leading, spacing: 6) {
                Text(match.displayName ?? String(localized: "profile.unknown"))
                    .font(.headline)
                if let city = match.city, !city.isEmpty {
                    Label(city, systemImage: "mappin")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                if let bio = match.bio, !bio.isEmpty {
                    Text(bio)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
                Button("matches.open_conversation", action: openConversation)
                    .font(.footnote.weight(.semibold))
                    .padding(.top, 3)
            }
            Spacer()
        }
        .padding(14)
        .background(BeatTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .overlay {
            RoundedRectangle(cornerRadius: 22).stroke(BeatTheme.border)
        }
    }

    @ViewBuilder
    private var avatar: some View {
        if let url = match.avatarURL {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                ProgressView()
            }
            .frame(width: 92, height: 112)
            .clipShape(RoundedRectangle(cornerRadius: 17))
        } else {
            ZStack {
                BeatTheme.accentLight.opacity(0.42)
                Text(match.displayName?.prefix(1).uppercased() ?? "?")
                    .font(.largeTitle.weight(.light))
                    .foregroundStyle(BeatTheme.accent)
            }
            .frame(width: 92, height: 112)
            .clipShape(RoundedRectangle(cornerRadius: 17))
        }
    }
}
