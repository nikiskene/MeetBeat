import Foundation

enum CompatibilityScorer {
    static let neutral = 0.5
    private static let weights: [(ConnectionDimension, Double)] = [
        (.depth, 0.25), (.directness, 0.25), (.focus, 0.20),
        (.structure, 0.15), (.pace, 0.15)
    ]

    static func score(_ first: ConnectionProfile?, _ second: ConnectionProfile?) -> Double {
        guard let first, let second else { return neutral }
        return weights.reduce(0) { total, item in
            let key = item.0.rawValue
            let difference = abs(first.dimensions[key, default: 0] -
                                 second.dimensions[key, default: 0])
            return total + (1 - Double(difference) / 4) * item.1
        }
    }

    static func ordered(
        _ candidates: [(id: UUID, profile: ConnectionProfile?, activity: Date?, distance: Double)],
        current: ConnectionProfile?
    ) -> [UUID] {
        candidates.sorted {
            let left = score(current, $0.profile)
            let right = score(current, $1.profile)
            if left != right { return left > right }
            if $0.activity != $1.activity {
                return ($0.activity ?? .distantPast) > ($1.activity ?? .distantPast)
            }
            if $0.distance != $1.distance { return $0.distance < $1.distance }
            return $0.id.uuidString < $1.id.uuidString
        }.map(\.id)
    }
}
