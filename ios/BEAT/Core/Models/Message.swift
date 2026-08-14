import Foundation

struct Conversation: Codable, Hashable, Identifiable, Sendable {
    let id: UUID
    let matchedUserID: UUID
    let displayName: String?
    let avatarURL: URL?
    let createdAt: String?
    let lastMessage: String?
    let lastMessageAt: String?
    let unreadCount: Int?

    enum CodingKeys: String, CodingKey {
        case id
        case matchedUserID = "matched_user_id"
        case displayName = "display_name"
        case avatarURL = "avatar_url"
        case createdAt = "created_at"
        case lastMessage = "last_message"
        case lastMessageAt = "last_message_at"
        case unreadCount = "unread_count"
    }
}

struct BeatMessage: Codable, Identifiable, Sendable {
    let id: UUID
    let matchID: UUID
    let senderID: UUID
    let content: String
    let createdAt: String
    let deliveredAt: String?
    let readAt: String?
    var reactions: [MessageReaction]?

    enum CodingKeys: String, CodingKey {
        case id, content
        case matchID = "match_id"
        case senderID = "sender_id"
        case createdAt = "created_at"
        case deliveredAt = "delivered_at"
        case readAt = "read_at"
        case reactions
    }
}

struct MessageReaction: Codable, Identifiable, Sendable {
    let userID: UUID
    let emoji: String
    var id: String { "\(userID)-\(emoji)" }
    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case emoji
    }
}

enum ReactionOption: String, CaseIterable, Identifiable {
    case heart = "❤️", thumbsUp = "👍", laugh = "😂"
    case surprised = "😮", sad = "😢", thumbsDown = "👎"
    var id: String { rawValue }
    var label: String {
        switch self {
        case .heart: "Heart"; case .thumbsUp: "Thumbs up"; case .laugh: "Laughing"
        case .surprised: "Surprised"; case .sad: "Sad"; case .thumbsDown: "Thumbs down"
        }
    }
}
