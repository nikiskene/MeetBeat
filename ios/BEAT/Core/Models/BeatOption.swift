import Foundation

enum BeatOption: String, CaseIterable, Codable, Identifiable, Sendable {
    case deepTalk = "deep_talk", coffee, dreamyWalk = "dreamy_walk"
    case quietTime = "quiet_time", laugh, flirt, adventure, create
    case museum, playlist, philosophy, outside, unforgettable

    var id: String { rawValue }
    var label: String { copy.label }
    var answer: String { copy.answer }
    var description: String { copy.description }
    var accessibilityLabel: String { "\(label). \(description)" }

    private var copy: (label: String, answer: String, description: String) {
        switch self {
        case .deepTalk: ("Deep Talk", "Have a deep conversation", "One of those conversations where we forget to check our phones.")
        case .coffee: ("Coffee", "Meet for a casual coffee", "No pressure. No performance. Just see how it feels.")
        case .dreamyWalk: ("Dreamy Walk", "Take a dreamy walk", "Walk side by side and let the conversation find its own direction.")
        case .quietTime: ("Quiet Time", "Spend quiet time together", "Comfortable company without needing to fill every silence.")
        case .laugh: ("Laugh", "Laugh out loud", "Keep it light, playful and wonderfully unserious.")
        case .flirt: ("Flirt", "Flirt respectfully", "A little chemistry, clear signals and good boundaries.")
        case .adventure: ("Adventure", "Have an adventurous day", "Leave the routine behind and see where the day takes us.")
        case .create: ("Create", "Create something meaningful", "Cook, draw, build, write or make something together.")
        case .museum: ("Museum", "Visit a museum or gallery", "Discover something beautiful and have someone to talk about it with.")
        case .playlist: ("Playlist", "Share our playlists", "Trade the songs that say more about us than a profile ever could.")
        case .philosophy: ("Philosophy", "Get lost in philosophy", "Big questions, curious minds and no urgent need for final answers.")
        case .outside: ("Outside", "Get outside", "Fresh air, open space and somewhere better than another screen.")
        case .unforgettable: ("Unforgettable", "Do something unforgettable", "Create the kind of story we will still enjoy telling later.")
        }
    }
}

struct ActiveBeat: Codable, Sendable {
    let userID: UUID
    let beat: BeatOption
    let selectedAt: Date
    let expiresAt: Date

    var isActive: Bool { expiresAt > Date() }

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case beat
        case selectedAt = "selected_at"
        case expiresAt = "expires_at"
    }
}
