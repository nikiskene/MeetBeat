import Foundation

struct BetaBugReport: Decodable, Identifiable, Sendable {
    let id: UUID
    let reporterID: UUID
    let category: String
    let summary: String
    let details: String
    let currentScreen: String?
    let appVersion: String?
    let buildNumber: String?
    let iosVersion: String?
    let deviceModel: String?
    let appearance: String?
    let locale: String?
    let screenshotPath: String?
    let status: String
    let priority: String
    let adminNotes: String?
    let assignedTo: UUID?
    let reviewedAt: String?
    let resolvedAt: String?
    let createdAt: String
    let updatedAt: String

    enum CodingKeys: String, CodingKey {
        case id, category, summary, details, appearance, locale, status, priority
        case reporterID = "reporter_id"
        case currentScreen = "current_screen"
        case appVersion = "app_version"
        case buildNumber = "build_number"
        case iosVersion = "ios_version"
        case deviceModel = "device_model"
        case screenshotPath = "screenshot_path"
        case adminNotes = "admin_notes"
        case assignedTo = "assigned_to"
        case reviewedAt = "reviewed_at"
        case resolvedAt = "resolved_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct BugReportSubmission: Sendable {
    let category: String
    let summary: String
    let details: String
    let currentScreen: String
    let appearance: String
    let screenshotData: Data?
}
