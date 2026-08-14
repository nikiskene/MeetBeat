import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var auth: AuthStore
    @State private var model = SettingsModel()
    @State private var legalDocument: LegalDocument?
    @State private var showDelete = false

    var body: some View {
        NavigationStack {
            Form {
                if auth.isSuperAdmin {
                    Section {
                        NavigationLink {
                            AdminDashboardView()
                        } label: {
                            Label("Admin Dashboard", systemImage: "gauge.with.dots.needle.67percent")
                        }
                    }
                }

                discoverySections
                privacySections

                Section("Legal & privacy") {
                    ForEach(LegalDocument.allCases) { document in
                        Button(document.title) { legalDocument = document }
                            .foregroundStyle(BeatTheme.ink)
                    }
                }

                Section("Account") {
                    LabeledContent("Email", value: auth.user?.email ?? "—")
                    Button("Sign out", role: .destructive) {
                        Task { await auth.signOut() }
                    }
                }
            }
            .font(BeatFont.regular(15))
            .scrollContentBackground(.hidden)
            .background(BeatTheme.paper)
            .navigationTitle("Settings")
            .toolbar {
                if model.settings != nil {
                    ToolbarItem(placement: .confirmationAction) {
                        Button(model.didSave ? "Saved" : "Save") {
                            Task { await model.save() }
                        }
                        .disabled(model.isBusy)
                    }
                }
            }
            .task { await model.load(userID: auth.user?.id) }
            .sheet(item: $legalDocument) { document in
                NavigationStack { LegalDocumentView(document: document) }
            }
            .sheet(isPresented: $showDelete) {
                DeleteAccountView(model: model)
            }
            .overlay {
                if model.isLoading {
                    ProgressView()
                        .padding(20)
                        .background(.regularMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
            }
        }
    }

    @ViewBuilder
    private var discoverySections: some View {
        if let settings = model.settings {
            Section("Who do you want to meet?") {
                ForEach(DiscoveryInterest.allCases) { option in
                    Toggle(option.label, isOn: model.interestBinding(option.rawValue))
                }
            }
            Section("Age range") {
                AgeValueControl(
                    title: "Minimum",
                    value: model.currentMinAge,
                    canDecrease: model.currentMinAge > 18,
                    canIncrease: model.currentMinAge < model.currentMaxAge - 1,
                    decrease: { model.changeMinimum(by: -1) },
                    increase: { model.changeMinimum(by: 1) }
                )
                AgeValueControl(
                    title: "Maximum",
                    value: model.currentMaxAge,
                    canDecrease: model.currentMaxAge > model.currentMinAge + 1,
                    canIncrease: model.currentMaxAge < 99,
                    decrease: { model.changeMaximum(by: -1) },
                    increase: { model.changeMaximum(by: 1) }
                )
            }
            Section("Distance: \(settings.maxDistanceKM) km") {
                Slider(
                    value: model.distance,
                    in: 5...250,
                    step: 5
                )
            }
            Section {
                Text("Choose which experiences can appear on your wheel. Keep at least one active.")
                    .font(BeatFont.regular(13))
                    .foregroundStyle(.secondary)
                ForEach(BeatOption.allCases) { beat in
                    Toggle(beat.label, isOn: model.moodBinding(beat.rawValue))
                }
            } header: {
                Text("Your BEAT wheel")
            }
        }
    }

    @ViewBuilder
    private var privacySections: some View {
        if let error = model.errorMessage {
            Section { Text(error).foregroundStyle(.red) }
        }
        if let privacy = model.privacy {
            Section("Legal agreements") {
                if privacy.acceptances.isEmpty {
                    Text("No durable acceptance record is available for this older account.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(privacy.acceptances) { acceptance in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(acceptance.title)
                            Text("Version \(acceptance.version)")
                                .font(BeatFont.regular(12))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            Section("Your data and account") {
                Button {
                    Task { await model.prepareExport() }
                } label: {
                    Label("Download my data", systemImage: "square.and.arrow.down")
                }
                if let exportURL = model.exportURL {
                    ShareLink(item: exportURL) {
                        Label("Share data export", systemImage: "square.and.arrow.up")
                    }
                }
                if privacy.deletionRequest != nil {
                    Button("Cancel account deletion", role: .cancel) {
                        Task { await model.cancelDeletion() }
                    }
                } else {
                    Button("Request account deletion", role: .destructive) {
                        showDelete = true
                    }
                }
            }
        }
    }
}
