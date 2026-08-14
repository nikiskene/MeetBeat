import Foundation

enum ConnectionDimension: String, CaseIterable, Codable, Sendable {
    case depth, directness, focus, structure, pace
}

struct ConnectionAnswer: Identifiable, Sendable {
    let id: String
    let text: String
    let score: Int
}

struct ConnectionQuestion: Identifiable, Sendable {
    let id: String
    let dimension: ConnectionDimension
    let text: String
    let answers: [ConnectionAnswer]
}

struct ConnectionProfile: Codable, Sendable {
    static let questionnaireVersion = 1
    let version: Int
    let dimensions: [String: Int]
    let labels: [String: String]
    let identifier: String

    var summary: String {
        ConnectionScorer.dimensionOrder.compactMap {
            labels[$0.rawValue].flatMap(ConnectionScorer.summary)
        }.joined(separator: " ")
    }
}

struct StoredConnectionProfile: Codable, Sendable {
    let userID: UUID
    let questionnaireVersion: Int
    let answers: [String: String]
    let profile: ConnectionProfile
    let completedAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case questionnaireVersion = "questionnaire_version"
        case answers, profile
        case completedAt = "completed_at"
        case updatedAt = "updated_at"
    }
}
