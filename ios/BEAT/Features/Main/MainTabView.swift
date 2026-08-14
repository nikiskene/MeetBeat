import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var selectedTab = AppTab.today
    @State private var conversationUserID: UUID?
    @State private var avatarURL: URL?
    @State private var showAvatarInvitation = false
    @State private var checkedAvatar = false

    var body: some View {
        TabView(selection: $selectedTab) {
            TodayView { userID in
                conversationUserID = userID
                selectedTab = .messages
            }
                .tabItem { Label("tab.today", systemImage: "sparkles") }
                .tag(AppTab.today)
            MatchesView { userID in
                conversationUserID = userID
                selectedTab = .messages
            }
                .tabItem { Label("tab.matches", systemImage: "heart") }
                .tag(AppTab.matches)
            MessagesView(openWithUserID: $conversationUserID)
                .tabItem { Label("tab.messages", systemImage: "message") }
                .tag(AppTab.messages)
            ProfileView()
                .tabItem { Label("tab.profile", systemImage: "person") }
                .tag(AppTab.profile)
            SettingsView()
                .tabItem { Label("tab.settings", systemImage: "gearshape") }
                .tag(AppTab.settings)
        }
        .background(BeatTheme.paper)
        .overlay(alignment: .bottomTrailing) {
            if let userID = auth.user?.id {
                FloatingBugReporter(
                    userID: userID,
                    currentScreen: selectedTab.reportLabel
                )
                .padding(.trailing, 16)
                .padding(.bottom, 78)
            }
        }
        .task(id: auth.user?.id) {
            await inviteForMissingAvatar()
        }
        .sheet(isPresented: $showAvatarInvitation) {
            if let userID = auth.user?.id {
                AvatarChoiceSheet(
                    userID: userID
                ) { result in
                    if case let .primary(url) = result {
                        avatarURL = url
                    }
                }
            }
        }
    }

    private func inviteForMissingAvatar() async {
        guard !checkedAvatar, let userID = auth.user?.id else { return }
        checkedAvatar = true
        let repository = ProfileRepository()
        guard let profile = try? await repository.fetchProfile(userID: userID) else {
            return
        }
        let photos = (try? await repository.fetchProfilePhotos(userID: userID)) ?? []
        let effectiveAvatarURL = profile.avatarURL ?? photos.first?.photoURL
        avatarURL = effectiveAvatarURL
        showAvatarInvitation = effectiveAvatarURL == nil

        if profile.avatarURL == nil, let fallbackURL = photos.first?.photoURL {
            try? await repository.updateAvatarURL(userID: userID, url: fallbackURL)
        }
    }
}

private enum AppTab: Hashable {
    case today, matches, messages, profile, settings

    var reportLabel: String {
        switch self {
        case .today: "Today"
        case .matches: "Matches"
        case .messages: "Messages"
        case .profile: "Profile"
        case .settings: "Settings"
        }
    }
}
