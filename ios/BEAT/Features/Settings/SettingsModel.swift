import Observation
import SwiftUI

@MainActor
@Observable
final class SettingsModel {
    var settings: DiscoverySettings?
    var privacy: PrivacyStatus?
    var isLoading = false
    var isBusy = false
    var didSave = false
    var errorMessage: String?
    var exportURL: URL?
    private let repository = SettingsRepository()

    func load(userID: UUID?) async {
        guard let userID else { return }
        isLoading = true
        errorMessage = nil
        do {
            async let settings = repository.fetchSettings(userID: userID)
            async let privacy = repository.fetchPrivacyStatus()
            self.settings = Self.normalized(try await settings)
            self.privacy = try await privacy
        } catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    func save() async {
        guard let settings else { return }
        isBusy = true
        errorMessage = nil
        do {
            try await repository.save(settings)
            UserDefaults.standard.set(settings.moodWheelOptions, forKey: "beat.enabledOptions")
            NotificationCenter.default.post(name: .beatWheelSettingsChanged, object: nil)
            didSave = true
        } catch { errorMessage = error.localizedDescription }
        isBusy = false
    }

    func prepareExport() async {
        isBusy = true
        do {
            let data = try await repository.exportData()
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("beat-data-export.json")
            try data.write(to: url, options: .atomic)
            exportURL = url
        } catch { errorMessage = error.localizedDescription }
        isBusy = false
    }

    func requestDeletion(reason: String) async {
        isBusy = true
        do {
            let request = try await repository.requestDeletion(
                reason: reason.isEmpty ? nil : reason
            )
            if let privacy {
                self.privacy = PrivacyStatus(
                    acceptances: privacy.acceptances,
                    deletionRequest: request
                )
            }
        } catch { errorMessage = error.localizedDescription }
        isBusy = false
    }

    func cancelDeletion() async {
        isBusy = true
        do {
            try await repository.cancelDeletion()
            if let privacy {
                self.privacy = PrivacyStatus(
                    acceptances: privacy.acceptances,
                    deletionRequest: nil
                )
            }
        } catch { errorMessage = error.localizedDescription }
        isBusy = false
    }

    var currentMinAge: Int { safeAges.minimum }
    var currentMaxAge: Int { safeAges.maximum }
    private var safeAges: (minimum: Int, maximum: Int) {
        let minimum = min(max(settings?.minAge ?? 25, 18), 98)
        return (minimum, max(min(max(settings?.maxAge ?? 55, 19), 99), minimum + 1))
    }

    private static func normalized(_ value: DiscoverySettings) -> DiscoverySettings {
        var value = value
        value.interestedIn = Array(Set(value.interestedIn.compactMap(DiscoveryInterest.canonical)))
            .sorted()
        value.minAge = min(max(value.minAge, 18), 98)
        value.maxAge = max(min(max(value.maxAge, 19), 99), value.minAge + 1)
        value.moodWheelOptions = BeatWheelSettings.normalized(value.moodWheelOptions)
        return value
    }

    func changeMinimum(by change: Int) {
        guard var settings else { return }
        settings.minAge = min(max(settings.minAge + change, 18), currentMaxAge - 1)
        self.settings = Self.normalized(settings)
        didSave = false
    }

    func changeMaximum(by change: Int) {
        guard var settings else { return }
        settings.maxAge = max(min(settings.maxAge + change, 99), currentMinAge + 1)
        self.settings = Self.normalized(settings)
        didSave = false
    }

    var distance: Binding<Double> {
        Binding(
            get: { Double(self.settings?.maxDistanceKM ?? 50) },
            set: { self.settings?.maxDistanceKM = Int($0); self.didSave = false }
        )
    }

    func interestBinding(_ value: String) -> Binding<Bool> {
        Binding(
            get: { self.settings?.interestedIn.contains(value) == true },
            set: { enabled in
                guard var values = self.settings?.interestedIn else { return }
                if enabled { values.append(value) } else { values.removeAll { $0 == value } }
                self.settings?.interestedIn = Array(Set(values)).sorted()
                self.didSave = false
            }
        )
    }

    func moodBinding(_ value: String) -> Binding<Bool> {
        Binding(
            get: { self.settings?.moodWheelOptions.contains(value) == true },
            set: { enabled in
                guard let values = self.settings?.moodWheelOptions,
                      let updated = BeatWheelSettings.toggling(value, enabled: enabled, in: values)
                else { return }
                self.settings?.moodWheelOptions = updated
                self.didSave = false
            }
        )
    }
}

extension Notification.Name {
    static let beatWheelSettingsChanged = Notification.Name("beatWheelSettingsChanged")
}
