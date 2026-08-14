import Foundation
import Supabase

struct ConnectionRepository: Sendable {
    private let client = SupabaseProvider.client

    func fetch(userID: UUID) async throws -> StoredConnectionProfile? {
        let rows: [StoredConnectionProfile] = try await client
            .from("connection_profiles")
            .select()
            .eq("user_id", value: userID)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    func save(userID: UUID, answers: [String: String]) async throws -> StoredConnectionProfile {
        let profile = try ConnectionScorer.calculate(answers: answers)
        let now = Date()
        let value = StoredConnectionProfile(
            userID: userID,
            questionnaireVersion: ConnectionProfile.questionnaireVersion,
            answers: answers,
            profile: profile,
            completedAt: now,
            updatedAt: now
        )
        return try await client
            .from("connection_profiles")
            .upsert(value, onConflict: "user_id")
            .select()
            .single()
            .execute()
            .value
    }
}
