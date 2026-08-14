import Foundation

struct DiscoverySettings: Codable, Sendable {
    var userID: UUID
    var interestedIn: [String]
    var minAge: Int
    var maxAge: Int
    var maxDistanceKM: Int
    var moodWheelOptions: [String]

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case interestedIn = "interested_in"
        case minAge = "min_age"
        case maxAge = "max_age"
        case maxDistanceKM = "max_distance_km"
        case moodWheelOptions = "mood_wheel_options"
    }
}

struct PrivacyStatus: Codable, Sendable {
    let acceptances: [LegalAcceptance]
    let deletionRequest: DeletionRequest?

    enum CodingKeys: String, CodingKey {
        case acceptances
        case deletionRequest = "deletion_request"
    }
}

struct LegalAcceptance: Codable, Identifiable, Sendable {
    var id: String { "\(document)-\(version)" }
    let document: String
    let title: String
    let version: String
    let acceptedAt: String

    enum CodingKeys: String, CodingKey {
        case document, title, version
        case acceptedAt = "accepted_at"
    }
}

struct DeletionRequest: Codable, Sendable {
    let id: UUID
    let scheduledFor: String
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case scheduledFor = "scheduled_for"
        case createdAt = "created_at"
    }
}
