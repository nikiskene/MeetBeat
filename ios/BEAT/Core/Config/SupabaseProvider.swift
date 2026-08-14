import Supabase

enum SupabaseProvider {
    static let client = SupabaseClient(
        supabaseURL: AppConfig.supabaseURL,
        supabaseKey: AppConfig.supabaseKey,
        options: .init(
            auth: .init(
                flowType: .pkce
            )
        )
    )
}
