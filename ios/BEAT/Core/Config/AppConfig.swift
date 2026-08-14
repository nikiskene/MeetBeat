import Foundation

enum AppConfig {
    static let supabaseURL: URL = {
        guard
            let rawValue = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
            !rawValue.isEmpty,
            let url = URL(string: rawValue)
        else {
            fatalError("SUPABASE_URL is missing from the app configuration.")
        }
        return url
    }()

    static let supabaseKey: String = {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String,
            !value.isEmpty
        else {
            fatalError("SUPABASE_ANON_KEY is missing from the app configuration.")
        }
        return value
    }()

    static let legalVersion = "2026.07.23"
    static let website = URL(string: "https://www.iacy.com")!
    static let supportEmail = "beat@iacy.com"
}
