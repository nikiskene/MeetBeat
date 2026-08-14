import Foundation
import Supabase

@MainActor
final class AuthStore: ObservableObject {
    enum State: Equatable {
        case starting
        case signedOut
        case signedIn
    }

    @Published private(set) var state: State = .starting
    @Published private(set) var user: User?
    @Published private(set) var isSuperAdmin = false
    @Published var errorMessage: String?
    @Published var notice: String?

    private let client = SupabaseProvider.client
    private var observerTask: Task<Void, Never>?

    func start() async {
        guard observerTask == nil else { return }

        if let session = try? await client.auth.session {
            apply(session)
        } else {
            state = .signedOut
        }

        let authChanges = client.auth.authStateChanges
        observerTask = Task { [weak self] in
            for await (_, session) in authChanges {
                guard !Task.isCancelled else { return }
                self?.apply(session)
            }
        }
    }

    func signIn(email: String, password: String) async -> Bool {
        await perform {
            let session = try await client.auth.signIn(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            apply(session)
        }
    }

    func signUp(email: String, password: String) async -> Bool {
        await perform {
            let acceptedAt = ISO8601DateFormatter().string(from: Date())
            _ = try await client.auth.signUp(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password,
                data: [
                    "age_confirmed_18": .bool(true),
                    "privacy_accepted": .bool(true),
                    "privacy_version": .string(AppConfig.legalVersion),
                    "eula_accepted": .bool(true),
                    "eula_version": .string(AppConfig.legalVersion),
                    "legal_accepted_at": .string(acceptedAt),
                    "legal_user_agent": .string("BEAT iOS")
                ],
                redirectTo: URL(string: "beat://auth/callback")
            )
            notice = String(localized: "auth.check_email")
        }
    }

    func requestPasswordReset(email: String) async -> Bool {
        await perform {
            try await client.auth.resetPasswordForEmail(
                email,
                redirectTo: URL(string: "beat://auth/reset")
            )
            notice = String(localized: "auth.reset_sent")
        }
    }

    func signOut() async {
        do {
            try await client.auth.signOut()
            user = nil
            state = .signedOut
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func handle(_ url: URL) async {
        do {
            try await client.auth.session(from: url)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func perform(_ operation: () async throws -> Void) async -> Bool {
        errorMessage = nil
        notice = nil
        do {
            try await operation()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func apply(_ session: Session?) {
        user = session?.user
        state = session == nil ? .signedOut : .signedIn
        if session == nil {
            isSuperAdmin = false
        } else {
            Task {
                await refreshAdminRole()
                if let userID = user?.id {
                    try? await PhoneLocationService.shared.refreshIfNeeded(userID: userID)
                }
            }
        }
    }

    private func refreshAdminRole() async {
        do {
            let value: Bool = try await client
                .rpc("is_super_admin")
                .execute()
                .value
            isSuperAdmin = value
        } catch {
            isSuperAdmin = false
        }
    }
}
