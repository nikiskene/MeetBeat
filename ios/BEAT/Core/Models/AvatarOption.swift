import Foundation

struct AvatarOption: Identifiable, Sendable {
    let name: String
    let url: URL

    var id: String { name }

    static let all: [AvatarOption] = [
        option("Braveheart F", "Braveheart%20F.png"),
        option("Braveheart M", "Braveheart%20M.png"),
        option("Radiant F", "Radiant%20F.png"),
        option("Radiant M", "Radiant%20M.png"),
        option("Lady", "Lady.png"),
        option("Gentleman", "Gentleman.png"),
        option("Dreamer F", "Dreamer%20F.png"),
        option("Dreamer M", "Dreamer%20M.png"),
    ]

    private static func option(_ name: String, _ filename: String) -> AvatarOption {
        AvatarOption(
            name: name,
            url: URL(
                string: "https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Avatars/\(filename)"
            )!
        )
    }
}
