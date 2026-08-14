import Foundation

enum ConnectionDraftStore {
    private static let key = "beat.connectionInterview.v1"

    static func load(defaults: UserDefaults = .standard) -> [String: String] {
        guard let data = defaults.data(forKey: key),
              let answers = try? JSONDecoder().decode([String: String].self, from: data)
        else { return [:] }
        return answers.filter { question, answer in
            ConnectionInterview.questions.contains { $0.id == question }
                && ["a", "b", "c"].contains(answer)
        }
    }

    static func save(_ answers: [String: String], defaults: UserDefaults = .standard) {
        guard let data = try? JSONEncoder().encode(answers) else { return }
        defaults.set(data, forKey: key)
    }

    static func clear(defaults: UserDefaults = .standard) {
        defaults.removeObject(forKey: key)
    }

    static func resumeIndex(for answers: [String: String]) -> Int {
        let firstMissing = ConnectionInterview.questions.firstIndex { answers[$0.id] == nil }
        return min(firstMissing ?? 9, 9)
    }
}
