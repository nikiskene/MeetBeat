import Foundation
import Supabase

struct AdminRepository: Sendable {
    private let client = SupabaseProvider.client

    func fetchDashboard() async throws -> AdminDashboard {
        try await client.rpc("get_ops_center_dashboard").execute().value
    }

    func fetchUsers(search: String = "") async throws -> [AdminUser] {
        try await client.rpc(
            "get_admin_users",
            params: AdminUserQuery(
                search: search.isEmpty ? nil : search,
                limit: 100,
                offset: 0
            )
        ).execute().value
    }

    func fetchMapUsers() async throws -> [AdminMapUser] {
        try await client.from("profiles")
            .select("id, display_name, city, country, latitude, longitude")
            .not("latitude", operator: .is, value: "null")
            .not("longitude", operator: .is, value: "null")
            .limit(1_000)
            .execute().value
    }

    func setSuspended(userID: UUID, suspended: Bool) async throws {
        try await client.rpc(
            "set_member_banned",
            params: AdminBanParams(
                memberID: userID,
                banned: suspended,
                reason: suspended ? "Suspended from the iOS operations center" : nil
            )
        ).execute()
    }

    func fetchHealth() async throws -> [HealthEntry] {
        try await client.rpc("get_beat_health_snapshot").execute().value
    }

    func fetchModerationCases() async throws -> [AdminModerationCase] {
        try await client.from("ops_cases")
            .select(
                """
                id, case_number, type, status, priority, title, description,
                primary_member_id, assigned_to, created_at, updated_at, resolved_at, closed_at
                """
            )
            .order("created_at", ascending: false)
            .limit(200)
            .execute().value
    }

    func fetchModerationEvents() async throws -> [AdminModerationEvent] {
        try await client.from("ops_event_log")
            .select(
                """
                id, event_type, event_category, related_case_id, related_member_id,
                severity, summary, created_at
                """
            )
            .order("created_at", ascending: false)
            .limit(200)
            .execute().value
    }

    func publishBroadcast(title: String, body: String, audience: String) async throws -> BroadcastResult {
        let id: UUID = try await client.rpc(
            "create_ops_broadcast",
            params: BroadcastParams(title: title, body: body, audience: audience)
        ).execute().value
        return try await client.rpc(
            "publish_ops_broadcast",
            params: PublishParams(broadcastID: id)
        ).execute().value
    }

    func fetchSlides() async throws -> [HomepageSlide] {
        try await client.from("homepage_slides")
            .select("image_url, position, visible, published")
            .order("position")
            .execute().value
    }

    func fetchFeatureFlags() async throws -> [AdminFeatureFlag] {
        try await client.from("feature_flags")
            .select("id, name, description, enabled, updated_at")
            .order("name")
            .execute().value
    }

    func fetchBugReports() async throws -> [BetaBugReport] {
        try await client.from("beta_bug_reports")
            .select(
                """
                id, reporter_id, category, summary, details, current_screen,
                app_version, build_number, ios_version, device_model, appearance,
                locale, screenshot_path, status, priority, admin_notes, assigned_to,
                reviewed_at, resolved_at, created_at, updated_at
                """
            )
            .order("created_at", ascending: false)
            .limit(500)
            .execute().value
    }

    func updateBugReport(
        id: UUID,
        status: String,
        priority: String,
        adminNotes: String
    ) async throws {
        try await client.from("beta_bug_reports")
            .update(
                AdminBugReportUpdate(
                    status: status,
                    priority: priority,
                    adminNotes: adminNotes.isEmpty ? nil : adminNotes,
                    reviewedAt: ISO8601DateFormatter().string(from: Date())
                )
            )
            .eq("id", value: id)
            .execute()
    }

    func signedBugScreenshot(path: String) async throws -> URL {
        try await client.storage
            .from("beta-bug-screenshots")
            .createSignedURL(path: path, expiresIn: 3_600)
    }
}

private struct AdminBugReportUpdate: Encodable {
    let status: String
    let priority: String
    let adminNotes: String?
    let reviewedAt: String

    enum CodingKeys: String, CodingKey {
        case status, priority
        case adminNotes = "admin_notes"
        case reviewedAt = "reviewed_at"
    }
}

private struct AdminUserQuery: Encodable {
    let search: String?
    let limit: Int
    let offset: Int
    enum CodingKeys: String, CodingKey {
        case search = "p_search", limit = "p_limit", offset = "p_offset"
    }
}

private struct AdminBanParams: Encodable {
    let memberID: UUID
    let banned: Bool
    let reason: String?
    enum CodingKeys: String, CodingKey {
        case memberID = "p_member_id", banned = "p_banned", reason = "p_reason"
    }
}

private struct BroadcastParams: Encodable {
    let title: String
    let body: String
    let audience: String
    let scheduledAt: String? = nil
    enum CodingKeys: String, CodingKey {
        case title = "p_title", body = "p_body", audience = "p_audience"
        case scheduledAt = "p_scheduled_at"
    }
}

private struct PublishParams: Encodable {
    let broadcastID: UUID
    enum CodingKeys: String, CodingKey { case broadcastID = "p_broadcast_id" }
}
