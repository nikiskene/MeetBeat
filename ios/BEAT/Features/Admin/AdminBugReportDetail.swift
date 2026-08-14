import SwiftUI

struct AdminBugReportDetail: View {
    let report: BetaBugReport
    let reporterName: String
    let onSaved: () async -> Void
    @State private var status: String
    @State private var priority: String
    @State private var notes: String
    @State private var screenshotURL: URL?
    @State private var error: String?
    @State private var saving = false

    init(report: BetaBugReport, reporterName: String, onSaved: @escaping () async -> Void) {
        self.report = report
        self.reporterName = reporterName
        self.onSaved = onSaved
        _status = State(initialValue: report.status)
        _priority = State(initialValue: report.priority)
        _notes = State(initialValue: report.adminNotes ?? "")
    }

    var body: some View {
        Form {
            Section("Report") {
                LabeledContent("Reporter", value: reporterName)
                LabeledContent("Category", value: report.category.capitalized)
                LabeledContent("Screen", value: report.currentScreen ?? "Unknown")
                LabeledContent("Created", value: report.createdAt)
            }
            Section("Summary") { Text(report.summary).font(BeatFont.medium(17)) }
            Section("Description") { Text(report.details.isEmpty ? report.summary : report.details) }
            Section("Device context") {
                LabeledContent("App", value: "\(report.appVersion ?? "?") (\(report.buildNumber ?? "?"))")
                LabeledContent("iOS", value: report.iosVersion ?? "Unknown")
                LabeledContent("Device", value: report.deviceModel ?? "Unknown")
                LabeledContent("Appearance", value: report.appearance?.capitalized ?? "Unknown")
                LabeledContent("Locale", value: report.locale ?? "Unknown")
            }
            if report.screenshotPath != nil {
                Section("Screenshot") {
                    if let screenshotURL {
                        AsyncImage(url: screenshotURL) { phase in
                            if case let .success(image) = phase {
                                image.resizable().scaledToFit()
                            } else if case .failure = phase {
                                ContentUnavailableView("Screenshot unavailable", systemImage: "photo")
                            } else {
                                ProgressView().frame(maxWidth: .infinity)
                            }
                        }
                    } else { ProgressView().frame(maxWidth: .infinity) }
                }
            }
            Section("Admin workflow") {
                Picker("Status", selection: $status) {
                    Text("New").tag("new")
                    Text("Triaged").tag("triaged")
                    Text("In progress").tag("in_progress")
                    Text("Resolved").tag("resolved")
                    Text("Won’t fix").tag("wont_fix")
                    Text("Duplicate").tag("duplicate")
                }
                Picker("Priority", selection: $priority) {
                    Text("Low").tag("low")
                    Text("Normal").tag("normal")
                    Text("High").tag("high")
                    Text("Critical").tag("critical")
                }
                TextField("Internal notes", text: $notes, axis: .vertical).lineLimit(4...10)
            }
            if let error { Section { Text(error).foregroundStyle(.red) } }
        }
        .navigationTitle("Bug Report")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { Task { await save() } }.disabled(saving)
            }
        }
        .task { await loadScreenshot() }
    }

    private func loadScreenshot() async {
        guard let path = report.screenshotPath else { return }
        do { screenshotURL = try await AdminRepository().signedBugScreenshot(path: path) }
        catch { self.error = error.localizedDescription }
    }

    private func save() async {
        saving = true
        do {
            try await AdminRepository().updateBugReport(
                id: report.id, status: status, priority: priority,
                adminNotes: notes.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            error = nil
            await onSaved()
        } catch { self.error = error.localizedDescription }
        saving = false
    }
}
