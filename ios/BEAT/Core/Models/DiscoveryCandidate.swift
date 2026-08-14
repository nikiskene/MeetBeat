import Foundation

struct DiscoveryCandidate: Codable, Identifiable, Sendable {
    let id: UUID
    let displayName: String
    let birthdate: String?
    let gender: String?
    let relationshipIntention: String?
    let bio: String?
    let city: String?
    let country: String?
    let locationLabel: String?
    let avatarURL: URL?

    enum CodingKeys: String, CodingKey {
        case id, birthdate, gender, bio, city, country
        case displayName = "display_name"
        case relationshipIntention = "relationship_intention"
        case locationLabel = "location_label"
        case avatarURL = "avatar_url"
    }

    var age: Int? {
        guard
            let birthdate,
            let date = DateFormatter.beatDate.date(from: birthdate)
        else { return nil }
        return Calendar.current.dateComponents([.year], from: date, to: Date()).year
    }
}

private extension DateFormatter {
    static let beatDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
