import Foundation
import Supabase

extension ProfileRepository {
    func addPhoto(userID: UUID, data: Data) async throws -> ProfilePhoto {
        let photos = try await fetchProfilePhotos(userID: userID)
        guard let position = (1...3).first(where: { value in
            !photos.contains(where: { $0.position == value })
        }) else { throw ProfilePhotoOperationError.galleryFull }
        let uploaded = try await uploadPhotoAsset(userID: userID, data: data)
        do {
            return try await SupabaseProvider.client
                .from("profile_photos")
                .insert(ProfilePhotoUpload(
                    userID: userID, photoURL: uploaded.url.absoluteString, position: position
                ))
                .select("id, user_id, photo_url, position, created_at")
                .single().execute().value
        } catch {
            _ = try? await uploaded.storage.remove(paths: [uploaded.path])
            throw error
        }
    }

    func replacePhoto(userID: UUID, photo: ProfilePhoto, data: Data) async throws -> ProfilePhoto {
        guard photo.userID == userID else { throw ProfilePhotoOperationError.notOwned }
        let uploaded = try await uploadPhotoAsset(userID: userID, data: data)
        do {
            let updated: ProfilePhoto = try await SupabaseProvider.client
                .from("profile_photos")
                .update(ProfilePhotoURL(photoURL: uploaded.url.absoluteString))
                .eq("id", value: photo.id).eq("user_id", value: userID)
                .select("id, user_id, photo_url, position, created_at")
                .single().execute().value
            if let oldPath = photo.photoURL.ownedProfilePhotoPath(userID: userID) {
                _ = try? await uploaded.storage.remove(paths: [oldPath])
            }
            return updated
        } catch {
            _ = try? await uploaded.storage.remove(paths: [uploaded.path])
            throw error
        }
    }

    func setPrimaryPhoto(userID: UUID, photo: ProfilePhoto) async throws {
        guard photo.userID == userID else { throw ProfilePhotoOperationError.notOwned }
        try await updateAvatarURL(userID: userID, url: photo.photoURL)
    }

    func removePhoto(userID: UUID, photo: ProfilePhoto) async throws {
        guard photo.userID == userID else { throw ProfilePhotoOperationError.notOwned }
        try await SupabaseProvider.client
            .from("profile_photos")
            .delete()
            .eq("id", value: photo.id)
            .eq("user_id", value: userID)
            .execute()
        if let path = photo.photoURL.ownedProfilePhotoPath(userID: userID) {
            _ = try? await SupabaseProvider.client.storage
                .from("profile-photos")
                .remove(paths: [path])
        }
    }

    func reorderPhotos(userID: UUID, photos: [ProfilePhoto]) async throws {
        guard photos.allSatisfy({ $0.userID == userID }) else {
            throw ProfilePhotoOperationError.notOwned
        }
        for (index, photo) in photos.enumerated() {
            try await SupabaseProvider.client
                .from("profile_photos")
                .update(ProfilePhotoPosition(position: index + 1))
                .eq("id", value: photo.id)
                .eq("user_id", value: userID)
                .execute()
        }
    }

    private func uploadPhotoAsset(
        userID: UUID, data: Data
    ) async throws -> (url: URL, path: String, storage: StorageFileApi) {
        let path = "\(userID.uuidString.lowercased())/gallery-\(UUID().uuidString.lowercased()).jpg"
        let storage = SupabaseProvider.client.storage.from("profile-photos")
        try await storage.upload(
            path, data: data, options: FileOptions(contentType: "image/jpeg", upsert: false)
        )
        return (try storage.getPublicURL(path: path), path, storage)
    }
}

private struct ProfilePhotoPosition: Encodable {
    let position: Int
}

private struct ProfilePhotoURL: Encodable {
    let photoURL: String
    enum CodingKeys: String, CodingKey { case photoURL = "photo_url" }
}

private struct ProfilePhotoUpload: Encodable {
    let userID: UUID
    let photoURL: String
    let position: Int
    enum CodingKeys: String, CodingKey {
        case userID = "user_id"
        case photoURL = "photo_url"
        case position
    }
}

private enum ProfilePhotoOperationError: LocalizedError {
    case notOwned
    case galleryFull
    var errorDescription: String? {
        switch self {
        case .notOwned: "This photo is not available to update."
        case .galleryFull: "All three photo positions are filled."
        }
    }
}

private extension URL {
    func ownedProfilePhotoPath(userID: UUID) -> String? {
        let marker = "/profile-photos/"
        guard let range = absoluteString.range(of: marker) else { return nil }
        let path = String(absoluteString[range.upperBound...])
        return path.hasPrefix(userID.uuidString.lowercased()) ? path : nil
    }
}
