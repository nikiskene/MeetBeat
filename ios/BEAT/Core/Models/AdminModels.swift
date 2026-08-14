import Foundation
import MapKit

struct AdminMapUser: Decodable, Identifiable, Sendable {
    let id: UUID
    let displayName: String?
    let city: String?
    let country: String?
    let latitude: Double
    let longitude: Double
    var coordinate: CLLocationCoordinate2D {
        .init(latitude: latitude, longitude: longitude)
    }
    enum CodingKeys: String, CodingKey {
        case id, city, country, latitude, longitude
        case displayName = "display_name"
    }
}

struct AdminUser: Decodable, Identifiable, Sendable {
    let id: UUID
    let displayName: String?
    let email: String?
    let avatarURL: URL?
    let isBanned: Bool?
    let lastActiveAt: String?
    let city: String?
    let country: String?
    let createdAt: String
    enum CodingKeys: String, CodingKey {
        case id, email, city, country
        case displayName = "display_name", avatarURL = "avatar_url"
        case isBanned = "is_banned", lastActiveAt = "last_active_at"
        case createdAt = "created_at"
    }
}

struct HealthEntry: Decodable, Identifiable, Sendable {
    let status: String
    let feature: String
    let message: String
    let checkedAt: String
    var id: String { feature }
    enum CodingKeys: String, CodingKey {
        case status, feature, message
        case checkedAt = "checked_at"
    }
}

struct AdminModerationCase: Decodable, Identifiable, Sendable {
    let id: UUID
    let caseNumber: Int
    let type: String
    let status: String
    let priority: String
    let title: String
    let description: String?
    let primaryMemberID: UUID?
    let assignedTo: UUID?
    let createdAt: String
    let updatedAt: String
    let resolvedAt: String?
    let closedAt: String?
    enum CodingKeys: String, CodingKey {
        case id, type, status, priority, title, description
        case caseNumber = "case_number", primaryMemberID = "primary_member_id"
        case assignedTo = "assigned_to", createdAt = "created_at"
        case updatedAt = "updated_at", resolvedAt = "resolved_at", closedAt = "closed_at"
    }
}

struct AdminModerationEvent: Decodable, Identifiable, Sendable {
    let id: UUID
    let eventType: String
    let category: String
    let relatedCaseID: UUID?
    let relatedMemberID: UUID?
    let severity: String
    let summary: String?
    let createdAt: String
    enum CodingKeys: String, CodingKey {
        case id, severity, summary
        case eventType = "event_type", category = "event_category"
        case relatedCaseID = "related_case_id", relatedMemberID = "related_member_id"
        case createdAt = "created_at"
    }
}

struct BroadcastResult: Decodable, Sendable {
    let id: UUID?
    let status: String?
    let queuedDeliveries: Int?
    enum CodingKeys: String, CodingKey {
        case id, status
        case queuedDeliveries = "queued_deliveries"
    }
}

struct HomepageSlide: Decodable, Identifiable, Sendable {
    let imageURL: URL
    let position: Int
    let visible: Bool
    let published: Bool
    var id: Int { position }
    enum CodingKeys: String, CodingKey {
        case imageURL = "image_url", position, visible, published
    }
}

struct AdminFeatureFlag: Decodable, Identifiable, Sendable {
    let id: UUID
    let name: String
    let description: String?
    let enabled: Bool
    let updatedAt: String
    enum CodingKeys: String, CodingKey {
        case id, name, description, enabled
        case updatedAt = "updated_at"
    }
}

struct AdminDashboard: Decodable, Sendable {
    let users: Users
    let activity: Activity
    let cases: Cases
    struct Users: Decodable, Sendable {
        let total: Int
        let newToday: Int
        let activeToday: Int
        let blocked: Int
        enum CodingKeys: String, CodingKey {
            case total, blocked
            case newToday = "new_today"
            case activeToday = "active_today"
        }
    }
    struct Activity: Decodable, Sendable {
        let matchesToday: Int
        let messagesToday: Int
        let reportsTotal: Int
        enum CodingKeys: String, CodingKey {
            case matchesToday = "matches_today"
            case messagesToday = "messages_today"
            case reportsTotal = "reports_total"
        }
    }
    struct Cases: Decodable, Sendable {
        let open: Int
        let critical: Int
    }
}
