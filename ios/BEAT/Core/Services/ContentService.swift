import Foundation
import Supabase

struct ContentEntry: Codable, Sendable {
    let key: String
    let title: String?
    let value: String
    let metadata: [String: String]?
    let locale: String
    let contentVersion: Int
    let isActive: Bool
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case key = "content_key"
        case title, value, metadata, locale
        case contentVersion = "content_version"
        case isActive = "is_active"
        case updatedAt = "updated_at"
    }
}

@MainActor
final class ContentService: ObservableObject {
    static let shared = ContentService()
    @Published private var remote: [String: String] = [:]
    private let cacheKey = "beat.content.en"

    private init() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let values = try? JSONDecoder().decode([String: String].self, from: data) {
            remote = values
        }
    }

    func text(_ key: String, fallback: String, values: [String: String] = [:]) -> String {
        let candidate = remote[key]?.trimmingCharacters(in: .whitespacesAndNewlines)
        let result = Self.resolve(candidate, fallback: fallback, values: values)
        #if DEBUG
        if candidate == nil {
            print("BEAT content fallback used for missing key: \(key)")
        }
        if result.range(of: #"\{[^}]+\}"#, options: .regularExpression) != nil {
            print("BEAT content contains an unresolved placeholder: \(key)")
        }
        #endif
        return result
    }

    nonisolated static func resolve(
        _ remote: String?,
        fallback: String,
        values: [String: String] = [:]
    ) -> String {
        let trimmed = remote?.trimmingCharacters(in: .whitespacesAndNewlines)
        var result = trimmed?.isEmpty == false ? trimmed! : fallback
        let allowed = Set(["current", "version", "selectedBeat"])
        for (name, value) in values where allowed.contains(name) {
            result = result.replacingOccurrences(of: "{\(name)}", with: value)
        }
        return result
    }

    func refresh() async {
        do {
            let entries: [ContentEntry] = try await SupabaseProvider.client
                .from("app_content")
                .select("content_key, title, value, metadata, locale, content_version, is_active, updated_at")
                .eq("locale", value: "en")
                .eq("is_active", value: true)
                .execute()
                .value
            let values: [String: String] = Dictionary(uniqueKeysWithValues: entries.compactMap {
                let value = $0.value.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !value.isEmpty else { return nil }
                return ($0.key, value) as (String, String)
            })
            remote = values
            if let data = try? JSONEncoder().encode(values) {
                UserDefaults.standard.set(data, forKey: cacheKey)
            }
        } catch {
            #if DEBUG
            print("BEAT content refresh failed: \(error.localizedDescription)")
            #endif
        }
    }
}
