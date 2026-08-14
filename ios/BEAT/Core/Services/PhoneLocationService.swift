import CoreLocation
import Foundation
import Supabase

@MainActor
final class PhoneLocationService: NSObject, @preconcurrency CLLocationManagerDelegate {
    static let shared = PhoneLocationService()

    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<CLLocation, Error>?
    private let refreshInterval: TimeInterval = 5 * 24 * 60 * 60

    override private init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func refreshIfNeeded(userID: UUID, force: Bool = false) async throws {
        if !force, let updatedAt = try await lastUpdate(userID: userID),
           Date().timeIntervalSince(updatedAt) < refreshInterval {
            return
        }

        let location = try await currentLocation()
        let placemark = try await CLGeocoder().reverseGeocodeLocation(location).first
        let city = placemark?.locality ?? placemark?.subAdministrativeArea
        let country = placemark?.country
        let region = placemark?.administrativeArea
        let label = [city, country].compactMap { $0 }.joined(separator: ", ")

        try await SupabaseProvider.client
            .from("profiles")
            .update(PhoneLocationUpdate(
                city: city,
                country: country,
                region: region,
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                locationLabel: label.isEmpty ? nil : label,
                locationUpdatedAt: ISO8601DateFormatter().string(from: Date())
            ))
            .eq("id", value: userID)
            .execute()
    }

    private func lastUpdate(userID: UUID) async throws -> Date? {
        let row: LocationTimestamp = try await SupabaseProvider.client
            .from("profiles")
            .select("location_updated_at")
            .eq("id", value: userID)
            .single()
            .execute()
            .value
        guard let value = row.locationUpdatedAt else { return nil }
        return ISO8601DateFormatter().date(from: value)
    }

    private func currentLocation() async throws -> CLLocation {
        if manager.authorizationStatus == .notDetermined {
            manager.requestWhenInUseAuthorization()
        }
        guard manager.authorizationStatus != .denied,
              manager.authorizationStatus != .restricted else {
            throw LocationError.permissionDenied
        }
        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        continuation?.resume(returning: location)
        continuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        continuation?.resume(throwing: error)
        continuation = nil
    }
}

private struct LocationTimestamp: Decodable {
    let locationUpdatedAt: String?
    enum CodingKeys: String, CodingKey {
        case locationUpdatedAt = "location_updated_at"
    }
}

struct PhoneLocationUpdate: Encodable {
    let city: String?
    let country: String?
    let region: String?
    let latitude: Double
    let longitude: Double
    let locationLabel: String?
    let locationUpdatedAt: String

    enum CodingKeys: String, CodingKey {
        case city, country, region, latitude, longitude
        case locationLabel = "location_label"
        case locationUpdatedAt = "location_updated_at"
    }
}

private enum LocationError: LocalizedError {
    case permissionDenied
    var errorDescription: String? {
        "Location permission is required to keep your BEAT location current."
    }
}
