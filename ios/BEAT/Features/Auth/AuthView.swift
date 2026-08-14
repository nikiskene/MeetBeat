import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var auth: AuthStore
    @Environment(\.dismiss) private var dismiss

    let mode: AuthMode
    @State private var email = ""
    @State private var password = ""
    @State private var isSecure = true
    @State private var isBusy = false
    @State private var ageConfirmed = false
    @State private var privacyAccepted = false
    @State private var eulaAccepted = false
    @State private var legalDocument: LegalDocument?

    private var canSubmit: Bool {
        !email.isEmpty && password.count >= 6 &&
            (mode == .signIn || (ageConfirmed && privacyAccepted && eulaAccepted))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text(mode == .signUp ? "Join BEAT" : "Welcome back")
                    .font(.system(size: 34, weight: .light, design: .serif))
                Text(mode == .signUp
                     ? "Create your profile, discover how you connect and choose what would feel good today."
                     : "Your next connection may already be on your wavelength.")
                    .foregroundStyle(.secondary)

                field("auth.email", text: $email, secure: false)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                field("auth.password", text: $password, secure: isSecure)
                    .textContentType(mode == .signUp ? .newPassword : .password)
                    .overlay(alignment: .trailing) {
                        Button {
                            isSecure.toggle()
                        } label: {
                            Image(systemName: isSecure ? "eye" : "eye.slash")
                                .foregroundStyle(.secondary)
                                .frame(width: 44, height: 44)
                        }
                    }

                if mode == .signUp {
                    consentRows
                } else {
                    Button("auth.forgot") {
                        Task { await resetPassword() }
                    }
                    .font(.footnote)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                }

                if let error = auth.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .accessibilityLabel("Error: \(error)")
                }
                if let notice = auth.notice {
                    Text(notice)
                        .font(.footnote)
                        .foregroundStyle(.green)
                }

                BeatButton(
                    title: mode == .signUp ? "auth.create_account" : "auth.sign_in",
                    isLoading: isBusy
                ) {
                    Task { await submit() }
                }
                .disabled(!canSubmit)
                .opacity(canSubmit ? 1 : 0.45)
            }
            .padding(24)
        }
        .background(BeatTheme.paper)
        .navigationTitle("BEAT")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $legalDocument) { document in
            NavigationStack { LegalDocumentView(document: document) }
        }
    }

    private func field(
        _ title: LocalizedStringKey,
        text: Binding<String>,
        secure: Bool
    ) -> some View {
        Group {
            if secure {
                SecureField(title, text: text)
            } else {
                TextField(title, text: text)
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 54)
        .background(BeatTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 15))
        .overlay {
            RoundedRectangle(cornerRadius: 15).stroke(BeatTheme.border)
        }
    }

    private var consentRows: some View {
        VStack(spacing: 10) {
            ConsentRow(
                isAccepted: $ageConfirmed,
                title: "auth.age_confirm"
            )
            ConsentRow(
                isAccepted: $privacyAccepted,
                title: "auth.privacy_confirm",
                action: { legalDocument = .privacy }
            )
            ConsentRow(
                isAccepted: $eulaAccepted,
                title: "auth.eula_confirm",
                action: { legalDocument = .eula }
            )
        }
    }

    private func submit() async {
        guard canSubmit else { return }
        isBusy = true
        if mode == .signUp {
            _ = await auth.signUp(email: email, password: password)
        } else {
            _ = await auth.signIn(email: email, password: password)
        }
        isBusy = false
    }

    private func resetPassword() async {
        guard !email.isEmpty else {
            auth.errorMessage = String(localized: "auth.enter_email")
            return
        }
        isBusy = true
        _ = await auth.requestPasswordReset(email: email)
        isBusy = false
    }
}

private struct ConsentRow: View {
    @Binding var isAccepted: Bool
    let title: LocalizedStringKey
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Button {
                isAccepted.toggle()
            } label: {
                Image(systemName: isAccepted ? "checkmark.square.fill" : "square")
                    .font(.title3)
                    .foregroundStyle(isAccepted ? BeatTheme.accent : .secondary)
            }
            Button(action: { action?() }) {
                Text(title)
                    .font(.footnote)
                    .foregroundStyle(BeatTheme.ink)
                    .multilineTextAlignment(.leading)
            }
            .disabled(action == nil)
            Spacer()
        }
        .padding(14)
        .background(BeatTheme.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
