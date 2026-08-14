import Foundation

struct BeatMatch: Codable, Identifiable, Sendable {
    let id: UUID
    let matchedUserID: UUID
    let displayName: String?
    let bio: String?
    let city: String?
    let avatarURL: URL?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case matchedUserID = "matched_user_id"
        case displayName = "display_name"
        case bio, city
        case avatarURL = "avatar_url"
        case createdAt = "created_at"
    }
}
