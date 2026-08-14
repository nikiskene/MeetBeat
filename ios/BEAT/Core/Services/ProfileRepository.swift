import Foundation
import Supabase

struct ProfileRepository: Sendable {
    private let client = SupabaseProvider.client

    func fetchProfile(userID: UUID) async throws -> Profile {
        try await client
            .from("profiles")
            .select(
                """
                id, display_name, bio, city, country, region, birthdate, gender,
                interested_in, relationship_intention, conversation_preferences, avatar_url
                """
            )
            .eq("id", value: userID)
            .single()
            .execute()
            .value
    }

    func updateProfile(userID: UUID, values: ProfileUpdate) async throws {
        try await client
            .from("profiles")
            .update(values)
            .eq("id", value: userID)
            .execute()
    }

    func updateAvatarURL(userID: UUID, url: URL) async throws {
        try await client
            .from("profiles")
            .update(AvatarUpdate(avatarURL: url.absoluteString))
            .eq("id", value: userID)
            .execute()
    }

    func uploadAvatar(userID: UUID, data: Data) async throws -> URL {
        let previousURL = try? await fetchProfile(userID: userID).avatarURL
        let path = "\(userID.uuidString.lowercased())/avatar-\(UUID().uuidString.lowercased()).jpg"
        let storage = client.storage.from("profile-photos")
        try await storage.upload(
            path,
            data: data,
            options: FileOptions(contentType: "image/jpeg", upsert: true)
        )
        let url = try storage.getPublicURL(path: path)
        do {
            try await updateAvatarURL(userID: userID, url: url)
        } catch {
            _ = try? await storage.remove(paths: [path])
            throw error
        }
        if let previousPath = previousURL?.profilePhotoPath(for: userID), previousPath != path {
            _ = try? await storage.remove(paths: [previousPath])
        }
        return url
    }

    func fetchProfilePhotos(userID: UUID) async throws -> [ProfilePhoto] {
        try await client
            .from("profile_photos")
            .select("id, user_id, photo_url, position, created_at")
            .eq("user_id", value: userID)
            .order("position")
            .execute()
            .value
    }

    func addAvatarToGallery(userID: UUID, url: URL) async throws -> ProfilePhoto {
        let photos = try await fetchProfilePhotos(userID: userID)
        if let existing = photos.first(where: { $0.photoURL == url }) {
            return existing
        }
        guard let position = (1...3).first(where: { candidate in
            !photos.contains(where: { $0.position == candidate })
        }) else {
            throw ProfilePhotoError.galleryFull
        }

        return try await client
            .from("profile_photos")
            .insert(
                ProfilePhotoInsert(
                    userID: userID,
                    photoURL: url.absoluteString,
                    position: position
                )
            )
            .select("id, user_id, photo_url, position, created_at")
            .single()
            .execute()
            .value
    }

    func chooseAvatar(userID: UUID, url: URL) async throws -> AvatarChoiceResult {
        try await updateAvatarURL(userID: userID, url: url)
        return .primary(url)
    }

    func fetchMatches() async throws -> [BeatMatch] {
        try await client
            .rpc("get_my_matches")
            .execute()
            .value
    }
}

private extension URL {
    func profilePhotoPath(for userID: UUID) -> String? {
        let marker = "/profile-photos/"
        guard let range = absoluteString.range(of: marker) else { return nil }
        let value = String(absoluteString[range.upperBound...])
        return value.hasPrefix(userID.uuidString.lowercased()) ? value : nil
    }
}

private struct AvatarUpdate: Encodable {
    let avatarURL: String

    enum CodingKeys: String, CodingKey {
        case avatarURL = "avatar_url"
    }
}

private struct ProfilePhotoInsert: Encodable {
    let userID: UUID
    let photoURL: String
    let position: Int

    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case photoURL = "photo_url"
        case position
    }
}

private enum ProfilePhotoError: LocalizedError {
    case galleryFull

    var errorDescription: String? {
        "Your three gallery positions are already filled. Remove a photo before adding another."
    }
}
