import Observation
import PhotosUI
import SwiftUI

@MainActor
@Observable
final class AvatarChoiceModel {
    var isBusy = false
    var errorMessage: String?
    private let repository = ProfileRepository()

    func choose(_ option: AvatarOption, userID: UUID) async -> AvatarChoiceResult? {
        await perform {
            try await repository.chooseAvatar(userID: userID, url: option.url)
        }
    }

    func upload(_ item: PhotosPickerItem, userID: UUID) async -> URL? {
        await perform {
            guard let original = try await item.loadTransferable(type: Data.self),
                  let data = ProfileImageProcessor.jpeg(from: original)
            else { throw AvatarChoiceError.invalidImage }
            return try await repository.uploadAvatar(userID: userID, data: data)
        }
    }

    private func perform(_ operation: () async throws -> URL) async -> URL? {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do { return try await operation() }
        catch { errorMessage = error.localizedDescription; return nil }
    }

    private func perform(
        _ operation: () async throws -> AvatarChoiceResult
    ) async -> AvatarChoiceResult? {
        isBusy = true
        errorMessage = nil
        defer { isBusy = false }
        do { return try await operation() }
        catch { errorMessage = error.localizedDescription; return nil }
    }
}

private enum AvatarChoiceError: LocalizedError {
    case invalidImage
    var errorDescription: String? {
        "This photo could not be prepared. Please choose another image."
    }
}
