import SwiftUI

@main
struct BEATApp: App {
    @StateObject private var auth = AuthStore()

    var body: some Scene {
        WindowGroup {
            launchView
                .environmentObject(auth)
                .environment(\.font, BeatFont.body)
                .tint(BeatTheme.accent)
                .task { await auth.start() }
                .onOpenURL { url in
                    Task { await auth.handle(url) }
                }
        }
    }

    @ViewBuilder
    private var launchView: some View {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ageRangeHarness") {
            AgeRangeDebugHarness()
        } else if ProcessInfo.processInfo.arguments.contains("-avatarChoiceHarness") {
            AvatarChoiceSheet(userID: UUID()) { _ in }
        } else {
            RootView()
        }
        #else
        RootView()
        #endif
    }
}
