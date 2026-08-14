import SwiftUI

struct ConnectionProfileSection: View {
    @ObservedObject private var content = ContentService.shared
    let userID: UUID?
    @State private var stored: StoredConnectionProfile?
    @State private var showConfirmation = false
    @State private var showInterview = false
    @State private var newResult: StoredConnectionProfile?

    var body: some View {
        Section(content.text("profile.connection.title", fallback: "How I connect")) {
            Text(content.text(
                "profile.connection.body",
                fallback: "Your connection profile helps BEAT understand which people may feel more natural to meet."
            ))
                .font(.footnote).foregroundStyle(.secondary)
            if let stored {
                LabeledContent(
                    content.text("profile.connection.label", fallback: "My connection profile"),
                    value: stored.profile.identifier
                )
                Text(stored.profile.summary).font(.footnote)
                Text(content.text(
                    "profile.connection.version",
                    fallback: "Profile created from BEAT Interview {version}",
                    values: ["version": "\(stored.questionnaireVersion)"]
                ))
                    .font(.caption).foregroundStyle(.secondary)
                LabeledContent(
                    "Completed",
                    value: stored.completedAt.formatted(date: .abbreviated, time: .omitted)
                )
                Button(content.text("profile.connection.retake", fallback: "Retake interview")) {
                    showConfirmation = true
                }
            } else {
                Button("Complete connection interview") { showInterview = true }
            }
        }
        .task { await load() }
        .confirmationDialog("Retake the interview?", isPresented: $showConfirmation) {
            Button("Retake interview") { showInterview = true }
            Button("Keep current profile", role: .cancel) {}
        } message: {
            Text("Your new answers will replace your current connection profile and update future compatibility rankings.")
        }
        .fullScreenCover(isPresented: $showInterview) {
            ConnectionInterviewView { result in
                newResult = result
                stored = result
                showInterview = false
            }
        }
    }

    private func load() async {
        guard let userID else { return }
        stored = try? await ConnectionRepository().fetch(userID: userID)
    }
}
