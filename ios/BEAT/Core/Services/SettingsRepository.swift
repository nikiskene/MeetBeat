import Foundation
import Supabase

struct SettingsRepository: Sendable {
    private let client = SupabaseProvider.client

    func fetchSettings(userID: UUID) async throws -> DiscoverySettings {
        async let discoveryRows: [DiscoveryRow] = client
            .from("discovery_settings")
            .select()
            .eq("user_id", value: userID)
            .limit(1)
            .execute()
            .value
        async let profileRows: [MoodRow] = client
            .from("profiles")
            .select("mood_wheel_options")
            .eq("id", value: userID)
            .limit(1)
            .execute()
            .value

        let discovery = try await discoveryRows.first
        let profile = try await profileRows.first
        return DiscoverySettings(
            userID: userID,
            interestedIn: discovery?.interestedIn ?? [],
            minAge: discovery?.minAge ?? 25,
            maxAge: discovery?.maxAge ?? 55,
            maxDistanceKM: discovery?.maxDistanceKM ?? 50,
            moodWheelOptions: profile?.moodWheelOptions ?? BeatOption.allCases.map(\.rawValue)
        )
    }

    func save(_ settings: DiscoverySettings) async throws {
        try await client
            .from("discovery_settings")
            .upsert(DiscoveryWrite(settings: settings))
            .execute()
        try await client
            .from("profiles")
            .update(MoodWrite(moodWheelOptions: settings.moodWheelOptions))
            .eq("id", value: settings.userID)
            .execute()
    }

    func fetchPrivacyStatus() async throws -> PrivacyStatus {
        try await client.rpc("get_my_privacy_status").execute().value
    }

    func requestDeletion(reason: String?) async throws -> DeletionRequest {
        try await client
            .rpc("request_account_deletion", params: DeleteParams(pReason: reason))
            .execute()
            .value
    }

    func cancelDeletion() async throws {
        try await client.rpc("cancel_account_deletion").execute()
    }

    func exportData() async throws -> Data {
        let response = try await client.rpc("get_my_data_export").execute()
        return response.data
    }
}

private struct DiscoveryRow: Decodable {
    let interestedIn: [String]?
    let minAge: Int?
    let maxAge: Int?
    let maxDistanceKM: Int?
    enum CodingKeys: String, CodingKey {
        case interestedIn = "interested_in"
        case minAge = "min_age"
        case maxAge = "max_age"
        case maxDistanceKM = "max_distance_km"
    }
}

private struct MoodRow: Decodable {
    let moodWheelOptions: [String]?
    enum CodingKeys: String, CodingKey {
        case moodWheelOptions = "mood_wheel_options"
    }
}

private struct DiscoveryWrite: Encodable {
    let userID: UUID
    let interestedIn: [String]
    let minAge: Int
    let maxAge: Int
    let maxDistanceKM: Int
    let updatedAt: String

    init(settings: DiscoverySettings) {
        userID = settings.userID
        interestedIn = settings.interestedIn
        minAge = settings.minAge
        maxAge = settings.maxAge
        maxDistanceKM = settings.maxDistanceKM
        updatedAt = ISO8601DateFormatter().string(from: Date())
    }

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case interestedIn = "interested_in"
        case minAge = "min_age"
        case maxAge = "max_age"
        case maxDistanceKM = "max_distance_km"
        case updatedAt = "updated_at"
    }
}

private struct MoodWrite: Encodable {
    let moodWheelOptions: [String]
    enum CodingKeys: String, CodingKey {
        case moodWheelOptions = "mood_wheel_options"
    }
}

private struct DeleteParams: Encodable {
    let pReason: String?
    enum CodingKeys: String, CodingKey {
        case pReason = "p_reason"
    }
}
