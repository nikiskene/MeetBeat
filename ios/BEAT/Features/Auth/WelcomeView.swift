import SwiftUI

struct WelcomeView: View {
    @State private var authMode: AuthMode?
    @State private var legalDocument: LegalDocument?

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 0) {
                    LandingHero(
                        onJoin: { authMode = .signUp },
                        onSignIn: { authMode = .signIn }
                    )
                    HowItWorksSection()
                    ConversationFirstSection()
                    SafetySection()
                    LandingCallToAction { authMode = .signUp }
                    LandingLegalFooter(document: $legalDocument)
                }
            }
            .ignoresSafeArea(edges: .top)
            .background(BeatTheme.paper)
            .navigationDestination(item: $authMode) { mode in
                AuthView(mode: mode)
            }
            .sheet(item: $legalDocument) { document in
                NavigationStack { LegalDocumentView(document: document) }
            }
            .task { await ContentService.shared.refresh() }
        }
    }
}

enum AuthMode: String, Identifiable {
    case signIn
    case signUp
    var id: String { rawValue }
}
