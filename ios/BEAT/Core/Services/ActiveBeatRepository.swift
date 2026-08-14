import Foundation
import Supabase

struct ActiveBeatRepository: Sendable {
    private let client = SupabaseProvider.client

    func fetch(userID: UUID) async throws -> ActiveBeat? {
        let rows: [ActiveBeat] = try await client
            .from("active_beats")
            .select("user_id, beat, selected_at, expires_at")
            .eq("user_id", value: userID)
            .limit(1)
            .execute()
            .value
        guard let beat = rows.first, beat.isActive else {
            ActiveBeatCache.clear()
            return nil
        }
        ActiveBeatCache.save(beat)
        return beat
    }

    func select(userID: UUID, beat: BeatOption) async throws -> ActiveBeat {
        let selectedAt = Date()
        let value = ActiveBeat(
            userID: userID,
            beat: beat,
            selectedAt: selectedAt,
            expiresAt: selectedAt.addingTimeInterval(86_400)
        )
        let saved: ActiveBeat = try await client
            .from("active_beats")
            .upsert(value, onConflict: "user_id")
            .select("user_id, beat, selected_at, expires_at")
            .single()
            .execute()
            .value
        ActiveBeatCache.save(saved)
        return saved
    }
}

enum ActiveBeatCache {
    private static let key = "beat.activeBeat"
    static func save(_ beat: ActiveBeat) {
        if let data = try? JSONEncoder().encode(beat) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
    static func load() -> ActiveBeat? {
        guard let data = UserDefaults.standard.data(forKey: key),
              let beat = try? JSONDecoder().decode(ActiveBeat.self, from: data),
              beat.isActive else {
            clear()
            return nil
        }
        return beat
    }
    static func clear() { UserDefaults.standard.removeObject(forKey: key) }
}
