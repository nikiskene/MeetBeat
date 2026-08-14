import SwiftUI

struct ConnectionInterviewView: View {
    @EnvironmentObject private var auth: AuthStore
    @ObservedObject private var content = ContentService.shared
    let onCompleted: (StoredConnectionProfile) -> Void
    @State private var index = 0
    @State private var answers: [String: String] = [:]
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    intro
                    ProgressView(value: Double(index + 1), total: 10)
                    Text(copy("onboarding.progress", "Question {current} of 10", ["current": "\(index + 1)"]))
                        .font(BeatFont.medium(12)).foregroundStyle(.secondary)
                    Text(question.text).font(BeatFont.light(29))
                    ForEach(question.answers) { answer in
                        answerButton(answer)
                    }
                    if let errorMessage {
                        Text(errorMessage).font(.footnote).foregroundStyle(.red)
                    }
                    controls
                }
                .padding(24)
            }
            .background(BeatTheme.paper)
            .navigationBarBackButtonHidden()
        }
        .onAppear {
            answers = ConnectionDraftStore.load()
            index = ConnectionDraftStore.resumeIndex(for: answers)
        }
        .onChange(of: answers) { _, value in
            ConnectionDraftStore.save(value)
        }
    }

    private var question: ConnectionQuestion { ConnectionInterview.questions[index] }
    private var intro: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(copy("onboarding.intro.eyebrow", "Your connection profile").uppercased()).font(BeatFont.medium(11))
                .tracking(2).foregroundStyle(BeatTheme.accent)
            Text(copy("onboarding.intro.title", "How do you naturally connect?")).font(BeatFont.light(34))
            Text(copy("onboarding.intro.body", "Ten quick questions help BEAT understand your communication style and show you more relevant people first. There are no right answers and no boxes you need to fit into."))
                .font(BeatFont.regular(14)).foregroundStyle(.secondary)
        }
    }

    private func answerButton(_ answer: ConnectionAnswer) -> some View {
        Button {
            answers[question.id] = answer.id
        } label: {
            HStack {
                Text(answer.text).multilineTextAlignment(.leading)
                Spacer()
                Image(systemName: answers[question.id] == answer.id ? "checkmark.circle.fill" : "circle")
            }
            .font(BeatFont.regular(16)).padding(16)
            .background(BeatTheme.card).clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(answer.text)
        .accessibilityAddTraits(answers[question.id] == answer.id ? .isSelected : [])
    }

    private var controls: some View {
        HStack {
            Button(copy("onboarding.back", "Back")) { index -= 1 }.disabled(index == 0 || isSaving)
            Spacer()
            BeatButton(
                title: LocalizedStringKey(
                    index == 9
                        ? copy("onboarding.finish", "See my profile")
                        : copy("onboarding.next", "Next")
                ),
                isLoading: isSaving
            ) {
                if index == 9 { Task { await save() } } else { index += 1 }
            }
            .frame(width: 180)
            .disabled(answers[question.id] == nil)
        }
    }

    private func save() async {
        guard let userID = auth.user?.id else { return }
        isSaving = true
        defer { isSaving = false }
        do {
            let stored = try await ConnectionRepository().save(userID: userID, answers: answers)
            ConnectionDraftStore.clear()
            onCompleted(stored)
        } catch { errorMessage = error.localizedDescription }
    }

    private func copy(_ key: String, _ fallback: String, _ values: [String: String] = [:]) -> String {
        content.text(key, fallback: fallback, values: values)
    }
}
