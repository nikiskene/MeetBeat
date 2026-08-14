import Foundation

struct ProfilePhoto: Codable, Identifiable, Sendable {
    let id: UUID
    let userID: UUID
    let photoURL: URL
    let position: Int
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case userID = "user_id"
        case photoURL = "photo_url"
        case position
        case createdAt = "created_at"
    }
}

enum AvatarChoiceResult: Sendable {
    case primary(URL)
    case gallery(ProfilePhoto)
}
