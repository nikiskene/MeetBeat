import Foundation
import Supabase

struct DiscoveryRepository: Sendable {
    private let client = SupabaseProvider.client

    func fetchCandidates() async throws -> [DiscoveryCandidate] {
        try await client
            .rpc("get_discovery_candidates_v2")
            .execute()
            .value
    }

    func decide(targetID: UUID, decision: String) async throws -> UUID? {
        let response = try await client
            .rpc(
                "record_discovery_decision",
                params: DecisionParams(pTargetID: targetID, pDecision: decision)
            )
            .execute()

        guard response.data != Data("null".utf8) else { return nil }
        return try? JSONDecoder().decode(UUID.self, from: response.data)
    }
}

private struct DecisionParams: Encodable {
    let pTargetID: UUID
    let pDecision: String
    enum CodingKeys: String, CodingKey {
        case pTargetID = "p_target_id"
        case pDecision = "p_decision"
    }
}
