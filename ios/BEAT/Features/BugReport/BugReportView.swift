import Observation
import SwiftUI
import UIKit

struct FloatingBugReporter: View {
    let userID: UUID
    let currentScreen: String

    @Environment(\.colorScheme) private var colorScheme
    @State private var isEnabled = false
    @State private var showReporter = false
    @State private var draft = BugReportDraft()

    var body: some View {
        if isEnabled {
            Button {
                draft.screenshot = ScreenshotCapture.png()
                Task { @MainActor in
                    await Task.yield()
                    showReporter = true
                }
            } label: {
                Image(systemName: "ladybug.fill")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(BeatTheme.primaryActionText)
                    .frame(width: 46, height: 46)
                    .background(BeatTheme.primaryAction)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(BeatTheme.border))
                    .shadow(color: .black.opacity(0.18), radius: 8, y: 4)
            }
            .accessibilityLabel("Report a bug")
            .sheet(isPresented: $showReporter) {
                BugReportSheet(
                    userID: userID,
                    currentScreen: currentScreen,
                    appearance: colorScheme == .dark ? "dark" : "light",
                    draft: draft
                )
            }
        }
        Color.clear
            .frame(width: 0, height: 0)
            .task {
                isEnabled = await BugReportRepository().isEnabled()
            }
    }
}

private struct BugReportSheet: View {
    @Environment(\.dismiss) private var dismiss
    let userID: UUID
    let currentScreen: String
    let appearance: String
    let draft: BugReportDraft

    @State private var model = BugReportModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("What happened?") {
                    Picker("Category", selection: $model.category) {
                        Text("Bug").tag("bug")
                        Text("Design").tag("design")
                        Text("Confusing").tag("confusing")
                        Text("Suggestion").tag("suggestion")
                        Text("Other").tag("other")
                    }
                    TextField("Short summary", text: $model.summary)
                    TextField("Describe what happened", text: $model.details, axis: .vertical)
                        .lineLimit(4...9)
                }
                Section {
                    LabeledContent("Screen", value: currentScreen)
                    Toggle("Attach current screen", isOn: $model.includeScreenshot)
                        .disabled(draft.screenshot == nil)
                    if model.includeScreenshot,
                       let data = draft.screenshot,
                       let image = UIImage(data: data) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                } header: {
                    Text("Context")
                } footer: {
                    Text("The screenshot is optional. BEAT never automatically includes passwords, location coordinates, or diagnostic logs.")
                }
                if let error = model.errorMessage {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .navigationTitle("Report a problem")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Send") {
                        Task {
                            if await model.submit(
                                userID: userID,
                                currentScreen: currentScreen,
                                appearance: appearance,
                                screenshot: draft.screenshot
                            ) {
                                dismiss()
                            }
                        }
                    }
                    .disabled(!model.canSubmit || model.isSending)
                }
            }
            .overlay { if model.isSending { ProgressView() } }
        }
    }
}

@MainActor
@Observable
private final class BugReportDraft {
    var screenshot: Data?
}

@MainActor
@Observable
private final class BugReportModel {
    var category = "bug"
    var summary = ""
    var details = ""
    var includeScreenshot = false
    var isSending = false
    var errorMessage: String?

    var canSubmit: Bool {
        summary.trimmingCharacters(in: .whitespacesAndNewlines).count >= 3
            && details.trimmingCharacters(in: .whitespacesAndNewlines).count >= 3
    }

    func submit(
        userID: UUID,
        currentScreen: String,
        appearance: String,
        screenshot: Data?
    ) async -> Bool {
        isSending = true
        errorMessage = nil
        defer { isSending = false }
        do {
            try await BugReportRepository().submit(
                userID: userID,
                submission: BugReportSubmission(
                    category: category,
                    summary: summary.trimmingCharacters(in: .whitespacesAndNewlines),
                    details: details.trimmingCharacters(in: .whitespacesAndNewlines),
                    currentScreen: currentScreen,
                    appearance: appearance,
                    screenshotData: includeScreenshot ? screenshot : nil
                )
            )
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}

@MainActor
private enum ScreenshotCapture {
    static func png() -> Data? {
        let scenes = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
        let windows = scenes
            .sorted { $0.activationState == .foregroundActive && $1.activationState != .foregroundActive }
            .flatMap(\.windows)
        guard let window = windows.first(where: \.isKeyWindow) ?? windows.first else {
            return nil
        }
        let renderer = UIGraphicsImageRenderer(bounds: window.bounds)
        let image = renderer.image { _ in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        return image.pngData()
    }
}
