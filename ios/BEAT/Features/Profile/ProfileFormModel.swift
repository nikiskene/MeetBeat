import Foundation
import Observation

@MainActor
@Observable
final class ProfileFormModel {
    var displayName = ""
    var bio = ""
    var city = ""
    var country = ""
    var region = ""
    var birthdate = ""
    var gender = ""
    var relationshipIntention = ""
    var conversationPreferences: [String] = []
    var interestedIn: [String] = []
    var avatarURL: URL?
    var profilePhotos: [ProfilePhoto] = []
    var isLoading = false
    var didSave = false
    var errorMessage: String?
    var validationMessage: String?
    var onSaved: (() -> Void)?
    private let repository = ProfileRepository()

    func load(userID: UUID?) async {
        guard let userID else { return }
        isLoading = true
        errorMessage = nil
        do {
            async let profileRequest = repository.fetchProfile(userID: userID)
            async let photosRequest = repository.fetchProfilePhotos(userID: userID)
            let profile = try await profileRequest
            displayName = profile.displayName ?? ""
            bio = profile.bio ?? ""
            city = profile.city ?? ""
            country = profile.country ?? ""
            region = profile.region ?? ""
            birthdate = profile.birthdate ?? ""
            gender = profile.gender ?? ""
            relationshipIntention = profile.relationshipIntention ?? ""
            conversationPreferences = profile.conversationPreferences ?? []
            interestedIn = profile.interestedIn ?? []
            let photos = try await photosRequest
            avatarURL = profile.avatarURL ?? photos.first?.photoURL
            profilePhotos = photos
            if profile.avatarURL == nil, let fallbackURL = photos.first?.photoURL {
                try? await repository.updateAvatarURL(userID: userID, url: fallbackURL)
            }
        } catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    func applyAvatarChoice(_ result: AvatarChoiceResult) {
        switch result {
        case let .primary(url): avatarURL = url
        case let .gallery(photo):
            if !profilePhotos.contains(where: { $0.id == photo.id }) {
                profilePhotos.append(photo)
                profilePhotos.sort { $0.position < $1.position }
            }
        }
    }

    func makePrimary(_ photo: ProfilePhoto, userID: UUID?) async {
        guard let userID else { return }
        do {
            try await repository.setPrimaryPhoto(userID: userID, photo: photo)
            avatarURL = photo.photoURL
        } catch { errorMessage = error.localizedDescription }
    }

    func remove(_ photo: ProfilePhoto, userID: UUID?) async {
        guard let userID, profilePhotos.count > 1, photo.photoURL != avatarURL else { return }
        do {
            try await repository.removePhoto(userID: userID, photo: photo)
            profilePhotos.removeAll { $0.id == photo.id }
        } catch { errorMessage = error.localizedDescription }
    }

    func move(_ photo: ProfilePhoto, by offset: Int, userID: UUID?) async {
        guard let userID, let index = profilePhotos.firstIndex(where: { $0.id == photo.id }),
              profilePhotos.indices.contains(index + offset) else { return }
        var updated = profilePhotos
        updated.swapAt(index, index + offset)
        do {
            try await repository.reorderPhotos(userID: userID, photos: updated)
            profilePhotos = updated
        } catch { errorMessage = error.localizedDescription }
    }

    func addPhoto(data: Data, userID: UUID?) async {
        guard let userID, let jpeg = ProfileImageProcessor.jpeg(from: data) else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let photo = try await repository.addPhoto(userID: userID, data: jpeg)
            profilePhotos.append(photo)
            profilePhotos.sort { $0.position < $1.position }
        } catch { errorMessage = error.localizedDescription }
    }

    func replace(_ photo: ProfilePhoto, data: Data, userID: UUID?) async {
        guard let userID, let jpeg = ProfileImageProcessor.jpeg(from: data) else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let wasPrimary = photo.photoURL == avatarURL
            let updated = try await repository.replacePhoto(userID: userID, photo: photo, data: jpeg)
            if let index = profilePhotos.firstIndex(where: { $0.id == photo.id }) {
                profilePhotos[index] = updated
            }
            if wasPrimary {
                try await repository.setPrimaryPhoto(userID: userID, photo: updated)
                avatarURL = updated.photoURL
            }
        } catch { errorMessage = error.localizedDescription }
    }

    func save(userID: UUID?) async {
        guard let userID else { return }
        let birthdate = validatedBirthdate
        if let message = validationMessage(birthdate: birthdate) {
            validationMessage = message
            return
        }
        guard let birthdate else { return }
        isLoading = true
        didSave = false
        errorMessage = nil
        do {
            try await repository.updateProfile(
                userID: userID,
                values: ProfileUpdate(
                    displayName: displayName, bio: bio, birthdate: birthdate,
                    gender: gender.isEmpty ? nil : gender,
                    interestedIn: interestedIn,
                    relationshipIntention: relationshipIntention,
                    conversationPreferences: conversationPreferences
                )
            )
            didSave = true
            onSaved?()
        } catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    private var validatedBirthdate: String? {
        let value = birthdate.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let date = DateFormatter.profileDate.date(from: value),
              Calendar.current.dateComponents([.year], from: date, to: Date()).year ?? 0 >= 18
        else { return nil }
        return value
    }

    private func validationMessage(birthdate: String?) -> String? {
        var requirements: [String] = []
        if displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            requirements.append("a display name")
        }
        if birthdate == nil { requirements.append("a valid birthdate (YYYY-MM-DD, age 18+)") }
        if gender.isEmpty { requirements.append("your gender") }
        if bio.trimmingCharacters(in: .whitespacesAndNewlines).count < 40 {
            requirements.append("a bio of at least 40 characters")
        }
        return requirements.isEmpty
            ? nil
            : "Please add " + requirements.joined(separator: ", ") + " before saving."
    }

    var locationLabel: String {
        let value = [city, region, country].filter { !$0.isEmpty }.joined(separator: ", ")
        return value.isEmpty ? "Location not available yet" : value
    }

    func refreshLocation(userID: UUID?) async {
        guard let userID else { return }
        isLoading = true
        errorMessage = nil
        do {
            try await PhoneLocationService.shared.refreshIfNeeded(userID: userID, force: true)
            await load(userID: userID)
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }
}

private extension DateFormatter {
    static let profileDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.isLenient = false
        return formatter
    }()
}
