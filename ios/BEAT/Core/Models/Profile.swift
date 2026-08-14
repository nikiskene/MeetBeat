import Foundation

struct Profile: Codable, Identifiable, Sendable {
    let id: UUID
    var displayName: String?
    var bio: String?
    var city: String?
    var country: String?
    var region: String?
    var birthdate: String?
    var gender: String?
    var interestedIn: [String]?
    var relationshipIntention: String?
    var conversationPreferences: [String]?
    var avatarURL: URL?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case bio, city, country, region, birthdate, gender
        case interestedIn = "interested_in"
        case relationshipIntention = "relationship_intention"
        case conversationPreferences = "conversation_preferences"
        case avatarURL = "avatar_url"
    }
}

struct ProfileUpdate: Encodable, Sendable {
    let displayName: String
    let bio: String
    let birthdate: String?
    let gender: String?
    let interestedIn: [String]
    let relationshipIntention: String
    let conversationPreferences: [String]

    enum CodingKeys: String, CodingKey {
        case displayName = "display_name"
        case bio, birthdate, gender
        case interestedIn = "interested_in"
        case relationshipIntention = "relationship_intention"
        case conversationPreferences = "conversation_preferences"
    }
}
