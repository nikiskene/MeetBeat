import Foundation
import Supabase

struct MessageRepository: Sendable {
    private let client = SupabaseProvider.client

    func fetchConversations() async throws -> [Conversation] {
        try await client
            .rpc("get_my_matches")
            .execute()
            .value
    }

    func fetchMessages(matchID: UUID) async throws -> [BeatMessage] {
        var messages: [BeatMessage] = try await client
            .rpc("get_match_messages", params: MatchParams(pMatchID: matchID))
            .execute()
            .value
        guard !messages.isEmpty else { return [] }
        let rows: [ReactionRow] = try await client
            .from("message_reactions")
            .select("message_id, user_id, emoji")
            .in("message_id", values: messages.map(\.id))
            .execute()
            .value
        let grouped = Dictionary(grouping: rows, by: \.messageID)
        for index in messages.indices {
            messages[index].reactions = grouped[messages[index].id]?.map(\.reaction) ?? []
        }
        return messages
    }

    func sendMessage(matchID: UUID, content: String) async throws -> BeatMessage {
        let messages: [BeatMessage] = try await client
            .rpc(
                "send_match_message",
                params: SendParams(pMatchID: matchID, pContent: content)
            )
            .execute()
            .value

        guard let message = messages.first else {
            throw MessageError.missingResponse
        }
        return message
    }

    func markRead(matchID: UUID) async throws {
        try await client
            .rpc("mark_match_messages_read", params: MatchParams(pMatchID: matchID))
            .execute()
    }

    func markDelivered(matchID: UUID) async throws {
        try await client
            .rpc("mark_match_messages_delivered", params: MatchParams(pMatchID: matchID))
            .execute()
    }

    func setReaction(messageID: UUID, emoji: String?) async throws {
        try await client
            .rpc(
                "set_message_reaction",
                params: ReactionParams(pMessageID: messageID, pEmoji: emoji)
            )
            .execute()
    }
}

private struct ReactionRow: Decodable {
    let messageID: UUID
    let userID: UUID
    let emoji: String
    var reaction: MessageReaction { .init(userID: userID, emoji: emoji) }
    enum CodingKeys: String, CodingKey {
        case messageID = "message_id"
        case userID = "user_id"
        case emoji
    }
}

private struct MatchParams: Encodable {
    let pMatchID: UUID
    enum CodingKeys: String, CodingKey {
        case pMatchID = "p_match_id"
    }
}

private struct SendParams: Encodable {
    let pMatchID: UUID
    let pContent: String
    enum CodingKeys: String, CodingKey {
        case pMatchID = "p_match_id"
        case pContent = "p_content"
    }
}

private struct ReactionParams: Encodable {
    let pMessageID: UUID
    let pEmoji: String?
    enum CodingKeys: String, CodingKey {
        case pMessageID = "p_message_id"
        case pEmoji = "p_emoji"
    }
}

private enum MessageError: LocalizedError {
    case missingResponse
    var errorDescription: String? {
        String(localized: "messages.missing_response")
    }
}
