import SwiftUI

struct ReadinessView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var state = ReadinessState.loading
    @State private var result: StoredConnectionProfile?

    var body: some View {
        Group {
            switch state {
            case .loading:
                ProgressView("Preparing BEAT…")
            case .basicProfile:
                ProfileView(isRequiredCompletion: true) {
                    Task { await load() }
                }
            case .connectionInterview:
                ConnectionInterviewView { saved in
                    result = saved
                    state = .connectionResult
                }
            case .connectionResult:
                if let result {
                    ConnectionResultView(profile: result.profile) { state = .chooseBeat }
                }
            case .chooseBeat, .ready:
                MainTabView()
            }
        }
        .task { await load() }
    }

    private func load() async {
        guard let userID = auth.user?.id else { return }
        do {
            async let profile = ProfileRepository().fetchProfile(userID: userID)
            async let connection = ConnectionRepository().fetch(userID: userID)
            async let activeBeat = ActiveBeatRepository().fetch(userID: userID)
            let (basic, stored, beat) = try await (profile, connection, activeBeat)
            result = stored
            if !basic.hasRequiredProfile {
                state = .basicProfile
            } else if stored == nil {
                state = .connectionInterview
            } else if beat == nil {
                state = .chooseBeat
            } else {
                state = .ready
            }
        } catch {
            state = .basicProfile
        }
    }
}

private enum ReadinessState {
    case loading, basicProfile, connectionInterview, connectionResult, chooseBeat, ready
}

private extension Profile {
    var hasRequiredProfile: Bool {
        displayName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
            && birthdate != nil
            && gender?.isEmpty == false
            && (bio?.trimmingCharacters(in: .whitespacesAndNewlines).count ?? 0) >= 40
    }
}
