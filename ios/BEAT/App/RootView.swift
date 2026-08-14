import SwiftUI

struct RootView: View {
    @EnvironmentObject private var auth: AuthStore

    var body: some View {
        Group {
            switch auth.state {
            case .starting:
                LaunchView()
            case .signedOut:
                WelcomeView()
            case .signedIn:
                ReadinessView()
            }
        }
        .animation(.easeInOut(duration: 0.25), value: auth.state)
    }
}

private struct LaunchView: View {
    var body: some View {
        ZStack {
            BeatTheme.brandDark.ignoresSafeArea()
            VStack(spacing: 18) {
                Text("BEAT")
                    .font(.system(size: 34, weight: .light, design: .serif))
                    .tracking(8)
                    .foregroundStyle(.white)
                ProgressView()
                    .tint(BeatTheme.gold)
            }
        }
    }
}
